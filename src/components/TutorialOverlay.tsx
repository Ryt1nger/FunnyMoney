import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useTutorialStore } from '../features/tutorial/tutorialStore';
import { tutorialSteps, type TutorialStep } from '../data/tutorialSteps';
import { usePetStore } from '../features/pet/petStore';
import { hapticTap } from '../services/haptics';
import bearAvatar from '../assets/pet/bear-avatar.png';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Отступ подсветки вокруг самого элемента — окошко чуть больше кнопки/карточки.
const PAD = 8;
// Тёмный полупрозрачный фон вокруг подсветки — единая константа для всех кусков.
const SCRIM = 'rgba(20,16,32,0.72)';

function unionRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

// SVG-путь скруглённого прямоугольника (вручную, без библиотек) — используется
// как "дырка" в затемнении, см. buildHoleClipPath.
function roundedRectPath(x: number, y: number, w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  return (
    `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} ` +
    `V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} ` +
    `A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`
  );
}

// Полное затемнение "минус" скруглённая дырка, одним clip-path (evenodd):
// внешний прямоугольник контейнера + внутренний скруглённый вырез. Даёт
// ровные скруглённые углы у подсветки (в отличие от четырёх прямоугольников)
// и при этом сам вырез остаётся кликабельным "мимо" затемнения — Chromium
// (в т.ч. системный Android WebView) не хит-тестит зоны, обрезанные clip-path.
function buildHoleClipPath(containerW: number, containerH: number, hole: Rect, radius: number): string {
  const outer = `M0,0 H${containerW} V${containerH} H0 Z`;
  const inner = roundedRectPath(hole.left, hole.top, hole.width, hole.height, radius);
  return `path(evenodd, "${outer} ${inner}")`;
}

/**
 * Обучение при первом входе в приложение: подсвечивает по очереди элементы
 * интерфейса (см. data/tutorialSteps.ts) и объясняет их простыми словами.
 * Смонтирован один раз внутри Home — виден поверх главного экрана и любых
 * открытых шторок (уроки/день/магазин/рейтинг/кухня/гардероб/копилка),
 * т.к. все они рендерятся внутри того же контейнера.
 *
 * "Дырка" в затемнении рисуется четырьмя прямоугольниками вокруг искомой
 * зоны — простой и надёжный приём без CSS-масок (важно для Android WebView),
 * который к тому же оставляет сам подсвеченный элемент кликабельным для
 * шагов action: 'tap'.
 */
export default function TutorialOverlay() {
  const active = useTutorialStore((s) => s.active);
  const stepIndex = useTutorialStore((s) => s.stepIndex);
  const next = useTutorialStore((s) => s.next);
  const finish = useTutorialStore((s) => s.finish);
  const petName = usePetStore((s) => s.pet?.name ?? 'Мишка');

  const step: TutorialStep | undefined = tutorialSteps[stepIndex];

  const rootRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  // Пересчитывает подсветку под текущий шаг. Целевой элемент может ещё не
  // существовать (шторка только открывается) или продолжать двигаться
  // (анимация выезда ~420-440мс, см. BottomSheet) — поэтому не берём первый
  // попавшийся кадр, а следим ещё немного кадров и дожидаемся элемента,
  // прежде чем показать карточку (иначе она мелькнёт в неверном месте).
  useLayoutEffect(() => {
    if (!active || !step) return;
    setReady(false);
    let raf = 0;
    let frames = 0;
    const targets = step.targets ?? [];

    function tick() {
      frames += 1;
      if (targets.length === 0) {
        setRect(null);
        setReady(true);
        return;
      }
      const root = rootRef.current;
      const els = targets
        .map((id) => document.querySelector<HTMLElement>(`[data-tour="${id}"]`))
        .filter((el): el is HTMLElement => !!el);

      if (root && els.length === targets.length) {
        const cRect = root.getBoundingClientRect();
        const rects = els.map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left - cRect.left, top: r.top - cRect.top, width: r.width, height: r.height };
        });
        const u = unionRects(rects);
        if (u && u.width > 0 && u.height > 0) {
          setRect(u);
          setContainerSize({ width: cRect.width, height: cRect.height });
          if (frames < 40) {
            // Ловим анимацию появления (шторка/переход) ещё немного кадров.
            raf = requestAnimationFrame(tick);
          } else {
            setReady(true);
          }
          return;
        }
      }
      if (frames < 60) {
        raf = requestAnimationFrame(tick);
      } else {
        // Не нашли элемент за отведённое время — центрированная карточка
        // вместо промаха мимо несуществующей цели.
        setRect(null);
        setReady(true);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, stepIndex, step]);

  // Шаги action: 'tap' продвигаются настоящим тапом ребёнка по подсвеченной
  // (реальной, не декоративной) кнопке — слушаем клики по всему документу
  // и сверяем, что это один из целевых элементов текущего шага.
  useEffect(() => {
    if (!active || !step || step.action !== 'tap') return;
    function onDocClick(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest?.('[data-tour]');
      const tourId = el?.getAttribute('data-tour');
      if (tourId && step?.targets?.includes(tourId)) {
        // Небольшая задержка — даём настоящему обработчику клика (переход
        // экрана/открытие шторки) отработать первым.
        window.setTimeout(() => next(), 30);
      }
    }
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [active, step, next]);

  if (!active || !step) return null;

  const scene = step.scene ? bearAvatar : null;
  const title = step.title.replace('{name}', petName);
  const text = step.text.replace('{name}', petName);

  return (
    <div ref={rootRef} className="absolute inset-0 z-[65]">
      {rect && containerSize.width > 0 ? (
        <SpotlightMask rect={rect} containerSize={containerSize} pulse={step.action === 'tap'} />
      ) : (
        <div className="pointer-events-auto absolute inset-0" style={{ background: SCRIM }} />
      )}

      <TutorialCard
        title={title}
        text={text}
        action={step.action}
        buttonLabel={step.buttonLabel}
        rect={rect}
        ready={ready}
        scene={scene}
        onNext={() => {
          hapticTap();
          next();
        }}
        onSkip={() => {
          hapticTap();
          finish();
        }}
      />
    </div>
  );
}

function SpotlightMask({
  rect,
  containerSize,
  pulse,
}: {
  rect: Rect;
  containerSize: { width: number; height: number };
  pulse: boolean;
}) {
  const HOLE_RADIUS = 20;
  const r = {
    left: rect.left - PAD,
    top: rect.top - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  return (
    <>
      {/* Затемнение со скруглённым вырезом — ТОЛЬКО визуал (pointer-events:
          none). clip-path обрезает картинку, но НЕ хит-тест: браузер (в т.ч.
          Android WebView) по-прежнему считает кликабельной всю исходную
          прямоугольную область элемента, даже там, где она визуально не
          закрашена. Поэтому кликабельность выреза обеспечивает отдельный
          прозрачный слой ниже (четыре прямоугольника без цвета) — так тап по
          дырке доходит до настоящей кнопки, а не глохнет в невидимом затемнении. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: SCRIM, clipPath: buildHoleClipPath(containerSize.width, containerSize.height, r, HOLE_RADIUS) }}
      />
      {/* Прозрачные "стены" вокруг дырки — блокируют клики снаружи, а внутри
          дырки элементов нет вовсе, поэтому тап проходит к настоящей кнопке. */}
      <div className="pointer-events-auto absolute inset-x-0 top-0" style={{ height: Math.max(0, r.top) }} />
      <div className="pointer-events-auto absolute inset-x-0 bottom-0" style={{ top: r.top + r.height }} />
      <div className="pointer-events-auto absolute left-0" style={{ top: r.top, height: r.height, width: Math.max(0, r.left) }} />
      <div className="pointer-events-auto absolute right-0" style={{ top: r.top, height: r.height, left: r.left + r.width }} />
      {/* Светящееся кольцо вокруг подсветки — притягивает взгляд ребёнка. */}
      <div
        className={`pointer-events-none absolute rounded-[20px] ${pulse ? 'animate-pulse' : ''}`}
        style={{
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height,
          boxShadow: '0 0 0 4px rgba(255,255,255,0.95), 0 0 0 10px rgba(255,255,255,0.25), 0 8px 20px rgba(0,0,0,0.35)',
        }}
      />
    </>
  );
}

interface CardProps {
  title: string;
  text: string;
  action: TutorialStep['action'];
  buttonLabel?: string;
  rect: Rect | null;
  ready: boolean;
  scene: string | null;
  onNext: () => void;
  onSkip: () => void;
}

function TutorialCard({ title, text, action, buttonLabel, rect, ready, scene, onNext, onSkip }: CardProps) {
  const CARD_WIDTH = 'min(86%, 340px)';
  const style: CSSProperties = !rect
    ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: CARD_WIDTH }
    : (() => {
        const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const spaceBelow = viewportH - (rect.top + rect.height);
        const showBelow = spaceBelow > 200;
        return showBelow
          ? { left: '50%', top: rect.top + rect.height + PAD + 16, transform: 'translateX(-50%)', width: CARD_WIDTH }
          : { left: '50%', top: Math.max(70, rect.top - PAD - 16), transform: 'translate(-50%, -100%)', width: CARD_WIDTH };
      })();

  return (
    <div
      className="pointer-events-auto absolute rounded-[26px] bg-[#fbefe1] p-4 text-center shadow-2xl transition-opacity duration-300"
      style={{ ...style, opacity: ready ? 1 : 0 }}
    >
      {scene && (
        <img
          src={scene}
          alt=""
          className="mx-auto -mt-11 mb-2 h-[76px] w-[76px] rounded-full border-4 border-white object-cover shadow-lg"
        />
      )}
      <h3 className="text-[16px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
        {title}
      </h3>
      <p className="mt-1.5 text-[13px] leading-snug" style={{ color: '#5d5770' }}>
        {text}
      </p>
      {action === 'next' ? (
        <button
          onClick={onNext}
          className="mt-3 w-full rounded-full px-4 py-2.5 text-[13.5px] font-bold text-white transition active:scale-[0.98]"
          style={{
            background: 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)',
            boxShadow:
              'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
          }}
        >
          {buttonLabel ?? 'Дальше'}
        </button>
      ) : (
        <div className="mt-3 text-[12px] font-bold" style={{ color: '#8b83a8' }}>
          Нажми на подсвеченное →
        </div>
      )}

      {/* "Пропустить" — внутри карточки, а не поверх экрана: карточка сама
          позиционируется в свободном месте (см. style выше), поэтому кнопка
          никогда не перекрывает подсвеченный элемент (например, баланс
          монет в шапке). */}
      <button
        onClick={onSkip}
        className="mt-2.5 text-[11px] font-bold underline-offset-2 transition active:opacity-60"
        style={{ color: '#a99fc4' }}
      >
        Пропустить обучение
      </button>
    </div>
  );
}
