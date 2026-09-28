import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_CONFIG, type RoadRunnerConfig } from './config';
import { CRASH_IMAGE, DEFAULT_SPRITE_URLS, loadSprites, type SpriteUrls, type Sprites } from './assets';
import { RoadRunnerEngine } from './engine';
import { renderFrame } from './renderer';
import type { GameEventType, GameResult, Phase } from './types';
import './RoadRunnerGame.css';

export interface RoadRunnerGameProps {
  /** Игрок нажал «Забрать монеты» после проигрыша — тут начисляем монеты в кошелёк FunnyMoney. */
  onFinish?: (result: GameResult) => void;
  /** Крестик / выход из игры. */
  onExit?: () => void;
  /** Звуки и вибрация: coin | hit | shield-block | powerup | gameover | lane | start. */
  onEvent?: (type: GameEventType) => void;
  /** Свои картинки (переопределяют встроенные по ключам). */
  spriteUrls?: SpriteUrls;
  config?: RoadRunnerConfig;
  className?: string;
}

interface Hud {
  lives: number;
  coins: number;
  meters: number;
  magnet: boolean;
  shield: boolean;
  double: boolean;
}

const SWIPE_PX = 24;

export function RoadRunnerGame({
  onFinish,
  onExit,
  onEvent,
  spriteUrls,
  config = DEFAULT_CONFIG,
  className,
}: RoadRunnerGameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RoadRunnerEngine | undefined>(undefined);
  const spritesRef = useRef<Sprites>({});
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const urls = { ...DEFAULT_SPRITE_URLS, ...spriteUrls };
  const [phase, setPhase] = useState<Phase>('ready');
  const [ready, setReady] = useState(false);
  const [hud, setHud] = useState<Hud>({ lives: config.lives, coins: 0, meters: 0, magnet: false, shield: false, double: false });
  const [result, setResult] = useState<GameResult | null>(null);
  // Подтверждение выхода посреди заезда (как в уроках): игра стоит на паузе, пока окно открыто
  const [confirmExit, setConfirmExit] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = confirmExit;

  // Движок живёт всё время жизни компонента
  if (!engineRef.current) engineRef.current = new RoadRunnerEngine(config);
  const engine = engineRef.current;

  useEffect(() => {
    let alive = true;
    loadSprites({ ...DEFAULT_SPRITE_URLS, ...spriteUrls }).then((sp) => {
      if (!alive) return;
      spritesRef.current = sp;
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [spriteUrls]);

  useEffect(() => {
    return engine.on((e, st) => {
      onEventRef.current?.(e);
      if (e === 'gameover') {
        setResult(engine.result());
        setPhase('over');
      }
      if (e === 'start') setPhase('playing');
      void st;
    });
  }, [engine]);

  // Главный цикл: физика + рендер. Пауза, когда вкладка скрыта.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    let raf = 0;
    let last = performance.now();
    let hudKey = '';

    // Игра заполняет весь контейнер: ширина мира фиксирована, высота подстраивается под экран
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const scale = w / config.width;
      engine.fitHeight(h / scale, config);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current) engine.update(dt);
      renderFrame(ctx, engine.state, engine.cfg, spritesRef.current);

      const st = engine.state;
      const key = `${st.lives}|${st.coins}|${engine.meters}|${st.magnetLeft > 0}|${st.shieldLeft > 0}|${st.doubleLeft > 0}`;
      if (key !== hudKey) {
        hudKey = key;
        setHud({
          lives: st.lives,
          coins: st.coins,
          meters: engine.meters,
          magnet: st.magnetLeft > 0,
          shield: st.shieldLeft > 0,
          double: st.doubleLeft > 0,
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      last = performance.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [engine, config]);

  // Клавиатура
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (pausedRef.current) return;
      if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') engine.moveLeft();
      else if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') engine.moveRight();
      else if ((ev.key === ' ' || ev.key === 'Enter') && engine.state.phase === 'ready') start();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // Свайп и тап по левой/правой половине экрана
  const touch = useRef<{ x: number; done: boolean } | null>(null);
  const onPointerDown = (ev: React.PointerEvent) => {
    touch.current = { x: ev.clientX, done: false };
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    const t = touch.current;
    if (!t || t.done) return;
    const dx = ev.clientX - t.x;
    if (Math.abs(dx) >= SWIPE_PX) {
      dx < 0 ? engine.moveLeft() : engine.moveRight();
      t.done = true;
    }
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t || t.done || engine.state.phase !== 'playing') return;
    const rect = wrapRef.current!.getBoundingClientRect();
    ev.clientX < rect.left + rect.width / 2 ? engine.moveLeft() : engine.moveRight();
  };

  // Результат передаём ровно один раз за заезд: по кнопке после проигрыша или
  // при выходе крестиком. Даже нулевой результат важен: при игре с питомцем
  // он всё равно завершает взаимодействие и показывает его последствия.
  const claimed = useRef(false);
  const claim = useCallback(
    (res: GameResult) => {
      if (claimed.current) return;
      claimed.current = true;
      onFinish?.(res);
    },
    [onFinish],
  );
  const handleExit = () => {
    if (engine.state.phase !== 'ready') claim(engine.result());
    onExit?.();
  };
  // Крестик: посреди заезда сначала спрашиваем, в «ready» и «over» выходим сразу
  const requestExit = () => {
    if (engine.state.phase === 'playing') setConfirmExit(true);
    else handleExit();
  };

  const start = useCallback(() => {
    setResult(null);
    claimed.current = false;
    engine.start();
  }, [engine]);

  return (
    <div
      ref={wrapRef}
      className={`rr-root ${className ?? ''}`}
    >
      <canvas
        ref={canvasRef}
        className="rr-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (touch.current = null)}
      />

      <div className="rr-hud" aria-live="off">
        <div className="rr-pill rr-hearts">
          {Array.from({ length: config.lives }, (_, i) => (
            <span key={i} className={i < hud.lives ? 'rr-heart' : 'rr-heart rr-heart--lost'}>
              ♥
            </span>
          ))}
        </div>
        <div className="rr-pill rr-coins">
          {urls.coin ? <img className="rr-ico" src={urls.coin} alt="" /> : <span className="rr-coin-dot" />} {hud.coins}
        </div>
        <div className="rr-pill rr-meters">{hud.meters} м</div>
        {onExit && (
          <button className="rr-close" onClick={requestExit} aria-label="Выйти">
            ✕
          </button>
        )}
      </div>

      {(hud.magnet || hud.shield || hud.double) && (
        <div className="rr-powers">
          {hud.magnet && (
            <span className="rr-pill">
              <img className="rr-ico" src={urls.magnet} alt="" /> магнит
            </span>
          )}
          {hud.shield && (
            <span className="rr-pill">
              <img className="rr-ico" src={urls.shield} alt="" /> щит
            </span>
          )}
          {hud.double && (
            <span className="rr-pill">
              <img className="rr-ico" src={urls.double} alt="" /> x2
            </span>
          )}
        </div>
      )}

      {confirmExit && (
        <div className="rr-confirm">
          <div className="rr-confirm-card">
            <p className="rr-confirm-title">Выйти из игры?</p>
            <p className="rr-confirm-text">Заезд не закончен — собранные монеты ({hud.coins}) всё равно зачислятся.</p>
            <div className="rr-confirm-btns">
              <button type="button" className="rr-btn" onClick={() => setConfirmExit(false)}>Остаться</button>
              <button type="button" className="rr-btn rr-btn--ghost" onClick={handleExit}>Выйти</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <div className="rr-overlay">
          <div className="rr-card">
            <h2>Гонка мишки</h2>
            <p>Свайпай влево и вправо или тапай по краям экрана. Объезжай препятствия и собирай монетки!</p>
            <button className="rr-btn" disabled={!ready} onClick={start}>
              {ready ? 'Поехали!' : 'Загрузка…'}
            </button>
          </div>
        </div>
      )}

      {phase === 'over' && result && (
        <div className="rr-overlay">
          <div className="rr-card rr-card--over">
            <img className="rr-crash" src={CRASH_IMAGE} alt="" draggable={false} />
            <div className="rr-card-body">
            <h2>Заезд окончен</h2>
            <div className="rr-result">
              <div>
                <b>{result.coins}</b>
                <span>монет</span>
              </div>
              <div>
                <b>{result.meters}</b>
                <span>метров</span>
              </div>
            </div>
            <button
              className="rr-btn"
              onClick={() => {
                claim(result);
                start();
              }}
            >
              Забрать и ещё раз
            </button>
            <button
              className="rr-btn rr-btn--ghost"
              onClick={() => {
                claim(result);
                onExit?.();
              }}
            >
              Забрать и выйти
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
