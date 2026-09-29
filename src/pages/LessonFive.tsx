import { useEffect, useRef, useState } from 'react';
import LessonHintBubble from '../components/LessonHintBubble';
import videoSrc from '../assets/lesson5/lesson-video.mp4';
import scene1 from '../assets/lesson5/practice-1.jpg';
import scene2 from '../assets/lesson5/practice-2.jpg';
import scene3 from '../assets/lesson5/practice-3.jpg';
import scene4 from '../assets/lesson5/practice-4.jpg';
import scene5 from '../assets/lesson5/practice-5.jpg';
import { IconArrowLeft, IconBook } from '../components/icons';
// Общие UI-элементы (радио, лампочка) — те же, что в уроках 3–4
import bulbIcon from '../assets/lesson3/ui/bulb.png';
import radioIcon from '../assets/lesson3/ui/radio.png';
import radioOnIcon from '../assets/lesson3/ui/radio-on.png';
import coinIcon from '../assets/lesson5/items/coin.png';
import coinsIcon from '../assets/lesson5/items/coins.png';
import carIcon from '../assets/lesson5/items/car.png';
import barrelIcon from '../assets/lesson5/items/barrel.png';
import bikeIcon from '../assets/lesson5/items/bike.png';
import piggyIcon from '../assets/lesson5/items/piggy.png';
import piggyCoinIcon from '../assets/lesson5/items/piggy-coin.png';
import walletIcon from '../assets/lesson5/items/wallet.png';
import bowIcon from '../assets/lesson5/items/bow.png';
import snowglobeIcon from '../assets/lesson5/items/snowglobe.png';
import { usePointerDrag } from '../hooks/usePointerDrag';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';
import { pausePracticeMusic, startPracticeMusic } from '../services/practiceMusic';
import { playCorrectAnswerSound, playWrongAnswerSound } from '../services/answerSound';
import { shuffleArray } from '../utils/shuffle';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void; onPracticeComplete?: () => void; onFinish: (correctCount: number) => void }

// Пятый урок — «Финансовая цель и регулярные накопления». Каркас тот же, что у
// уроков 1–4. Видео пока то же, что во втором уроке. Диалоговые облачка рядом
// с медведем не верстаются — фон сцены это готовая картинка.
const scenes = [scene1, scene2, scene3, scene4, scene5];

// Экран 1 — «Выбери цель»: подойдёт любая из трёх целей.
const GOALS = [
  { id: 'car', label: 'Игрушка', price: 100, image: carIcon, bg: '#e3f1fb', fg: '#1b4ea3' },
  { id: 'honey', label: 'Бочонок мёда', price: 300, image: barrelIcon, bg: '#fdeedd', fg: '#a55a14' },
  { id: 'bike', label: 'Велосипед', price: 500, image: bikeIcon, bg: '#fde3ea', fg: '#c23b5c' },
] as const;

// Экран 2 — «Первый взнос»: 30 монет = 6 монет по 5; в копилку 10 (2 монеты), остальное — в расходы.
const COIN_VALUE = 5;
const COIN_IDS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'];
const WALLET_TOTAL = COIN_IDS.length * COIN_VALUE;
const FIRST_DEPOSIT = 10;
type Place = 'pool' | 'piggy' | 'wallet';
const initialPlacement = (): Record<string, Place> => Object.fromEntries(COIN_IDS.map((id) => [id, 'pool'])) as Record<string, Place>;

// Экран 3 — «План накоплений»: цель 60, накоплено 20, по 10 монет в неделю.
const PLAN_GOAL = 60;
const PLAN_SAVED = 20;
const WEEK_AMOUNT = 10;
const WEEKS = [
  { n: 1, color: '#e0364e' },
  { n: 2, color: '#e85d9b' },
  { n: 3, color: '#39b54a' },
  { n: 4, color: '#7a5ce0' },
];
const PLAN_MARKS = [20, 30, 40, 50, 60];

// Экран 4 — «Цель или мелочь»: 10 монет, разумный вариант — копилка.
const SMALL_COINS = 10;
const IMPULSE_OPTIONS = [
  { id: 'bow', title: 'Бантик', note: 'Красивая заколка для волос.', image: bowIcon, bg: 'bg-white/90', fg: 'text-[#1b3f8f]' },
  { id: 'souvenir', title: 'Сувенир', note: 'Маленький сувенир на память.', image: snowglobeIcon, bg: 'bg-white/90', fg: 'text-[#1b3f8f]' },
  { id: 'piggy', title: 'Положить в копилку на цель', note: 'Стать ближе к своей цели!', image: piggyCoinIcon, bg: 'bg-[#e2f5e6]', fg: 'text-[#1f6f3a]' },
] as const;

// Экран 5 — «Финальный шаг»: 290/300, последние 10 монет — в копилку.
const BIKE_GOAL = 300;
const BIKE_SAVED = 290;

const sceneHints = [
  'Выбери любую цель, на которую хочешь накопить: игрушку, бочонок мёда или велосипед.',
  `У тебя ${WALLET_TOTAL} монет, а каждая монета — ${COIN_VALUE}. В копилку нужно положить ${FIRST_DEPOSIT} монет (две монеты), остальные — на текущие расходы.`,
  `Цель — ${PLAN_GOAL}, уже накоплено ${PLAN_SAVED}. Осталось ${PLAN_GOAL - PLAN_SAVED}: отметь все 4 недели по ${WEEK_AMOUNT} монет — так копилка дойдёт до цели. А в конце периода накопления получают +20%.`,
  'Бантик и сувенир — это мелочи, они уведут монеты от цели. Разумный выбор — тот, что приближает к цели: копилка.',
  `Не хватает совсем немного! Положи последние ${SMALL_COINS} монет в копилку: перетащи монету на копилку или просто коснись её.`,
];

const SELECTED_RING = 'ring-[3px] ring-[#675ff3]';

function Coin({ className = '' }: { className?: string }) {
  return <img src={coinIcon} alt="" draggable={false} className={`h-[1.15em] w-[1.15em] shrink-0 object-contain ${className}`} />;
}

function Price({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center gap-1 font-black text-[#c9862a] ${className}`}>
      <Coin />{value}
    </span>
  );
}

function Radio({ on }: { on: boolean }) {
  return <img src={on ? radioOnIcon : radioIcon} alt="" draggable={false} className="h-[clamp(24px,7vw,32px)] w-[clamp(24px,7vw,32px)] shrink-0 object-contain" />;
}

function ExitConfirm({ onStay, onExit }: { onStay: () => void; onExit: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 p-6 [animation:lessonFadeIn_200ms_ease-out]">
      <div className="w-full max-w-[320px] rounded-[24px] bg-white p-5 text-center shadow-[0_16px_40px_rgba(0,0,0,.3)]">
        <p className="text-[clamp(16px,4.6vw,19px)] font-black text-[#1b3f8f]">Выйти из урока?</p>
        <p className="mt-1.5 text-[clamp(12.5px,3.6vw,14px)] font-semibold leading-snug text-[#5a6a92]">Задание не завершено — прогресс не сохранится.</p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={onStay} className="h-12 w-full rounded-[20px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] text-[clamp(14.5px,4.2vw,16px)] font-extrabold text-white shadow-[0_6px_16px_rgba(80,65,215,.35)] transition active:scale-[.98]">Остаться</button>
          <button type="button" onClick={onExit} className="h-12 w-full rounded-[20px] bg-[#f1eef8] text-[clamp(14.5px,4.2vw,16px)] font-extrabold text-[#6a5f8f] transition active:scale-[.98]">Выйти без сохранения</button>
        </div>
      </div>
    </div>
  );
}

// Пилюля с монетами и крупным числом
function CoinsPill({ value, label }: { value: number; label?: string }) {
  return (
    <div className="mx-auto flex shrink-0 items-center gap-2 rounded-full bg-[#e3f1fb] px-4 py-0.5 shadow-sm">
      <img src={coinsIcon} alt="" draggable={false} className="h-[clamp(28px,8vw,36px)] w-[clamp(28px,8vw,36px)] object-contain" />
      {label && <span className="text-[clamp(10px,2.9vw,12px)] font-black text-[#3a6ea8]">{label}</span>}
      <span className="text-[clamp(22px,6.6vw,28px)] font-black leading-none text-[#1b3f8f]">{value}</span>
    </div>
  );
}

// Полоса прогресса копилки: зелёная заливка и подпись «текущее/цель»
function GoalBar({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="h-[clamp(12px,3.4vw,16px)] flex-1 overflow-hidden rounded-full bg-[#e6e2ee] shadow-inner">
        <div className="h-full rounded-full bg-gradient-to-b from-[#7fdc6a] to-[#2fa84a] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[clamp(11px,3.2vw,13px)] font-black text-[#1b3f8f]">{value} / {goal}</span>
    </div>
  );
}

/** Пятый урок: видео и практика (5 экранов). */
export default function LessonFive({ onBack, onPracticeComplete, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [goal, setGoal] = useState<string | null>(null); // экран 1
  const [placement, setPlacement] = useState<Record<string, Place>>(initialPlacement); // экран 2
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null); // экран 2 — монета, выбранная тапом
  const [weeks, setWeeks] = useState<number[]>([]); // экран 3
  const [impulse, setImpulse] = useState<string | null>(null); // экран 4
  const [deposited, setDeposited] = useState(false); // экран 5
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [mistakeScenes, setMistakeScenes] = useState<number[]>([]);
  const [reviewNotice, setReviewNotice] = useState(false);
  const [checkPulse, setCheckPulse] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lessonCompletedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragEndRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const dnd = usePointerDrag(rootRef, handleDrop);
  const [goalsTray] = useState(() => shuffleArray(GOALS));
  const [impulseOptionsTray] = useState(() => shuffleArray(IMPULSE_OPTIONS));

  useEffect(() => {
    pauseBackgroundMusic();
    return () => startBackgroundMusic();
  }, []);

  // Тихая фоновая музыка играет только во время практики — в видео-части
  // свой закадровый голос, а общий трек приложения и так на паузе (см. выше).
  useEffect(() => {
    if (phase === 'practice') {
      startPracticeMusic();
      return () => pausePracticeMusic();
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    scenes.forEach((source) => { const image = new Image(); image.src = source; });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function onEnded() {
      if (video) { video.pause(); video.currentTime = 0; }
      setWatched(true);
    }
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, []);

  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); }, []);

  useEffect(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (hintText) hintTimerRef.current = setTimeout(() => setHintText(null), 3000);
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, [hintText]);

  const coinsIn = (place: Place) => COIN_IDS.filter((id) => placement[id] === place);
  const piggyCoins = coinsIn('piggy');
  const walletCoins = coinsIn('wallet');
  const poolCoins = coinsIn('pool');
  const planReached = PLAN_SAVED + weeks.length * WEEK_AMOUNT;

  function moveCoin(id: string, to: Place) {
    setPlacement((current) => (current[id] === to ? current : { ...current, [id]: to }));
    setSelectedCoin(null);
  }

  function handleDrop(id: string, _from: number | null, zone: string | null) {
    if (scene === 1 && COIN_IDS.includes(id) && (zone === 'piggy' || zone === 'wallet' || zone === 'pool')) moveCoin(id, zone);
    if (scene === 4 && id === 'final' && zone === 'piggy') setDeposited(true);
  }

  // Тап по монете: в зоне — вернуть в кучку, в кучке — выбрать (потом тап по зоне)
  function tapCoin(id: string) {
    if (Date.now() - lastDragEndRef.current < 350) return;
    if (placement[id] !== 'pool') { moveCoin(id, 'pool'); return; }
    setSelectedCoin((current) => (current === id ? null : id));
  }
  function tapZone(zone: 'piggy' | 'wallet') {
    if (Date.now() - lastDragEndRef.current < 350) return;
    if (selectedCoin) moveCoin(selectedCoin, zone);
  }
  function toggleWeek(n: number) {
    setWeeks((current) => (current.includes(n) ? current.filter((value) => value !== n) : [...current, n]));
  }

  function isSceneCorrect(): boolean {
    if (scene === 0) return goal !== null;
    if (scene === 1) return poolCoins.length === 0 && piggyCoins.length * COIN_VALUE === FIRST_DEPOSIT;
    if (scene === 2) return weeks.length === WEEKS.length;
    if (scene === 3) return impulse === 'piggy';
    return deposited;
  }

  function goToNextScene() {
    setScene((value) => value + 1);
    setPlacement(initialPlacement());
    setSelectedCoin(null);
    setCheckState('idle');
    setHintText(null);
  }

  function handleCheck() {
    if (checkState === 'correct') return;
    if (isSceneCorrect()) {
      onPracticeComplete?.();
      setHintText(null);
      setCheckState('correct');
      playCorrectAnswerSound();
      setCheckPulse((value) => value + 1);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        if (scene < scenes.length - 1) goToNextScene(); else if (mistakeScenes.length > 0) {
          setReviewNotice(true);
          advanceTimerRef.current = setTimeout(() => { lessonCompletedRef.current = true; onFinish(scenes.length - mistakeScenes.length); }, 1800);
        } else { lessonCompletedRef.current = true; onFinish(scenes.length); }
      }, 700);
    } else {
      setMistakeScenes((current) => current.includes(scene) ? current : [...current, scene]);
      setCheckState('wrong');
      playWrongAnswerSound();
      setCheckPulse((value) => value + 1);
      setHintText(sceneHints[scene] ?? 'Попробуй ещё раз.');
    }
  }

  function requestExit() {
    if (lessonCompletedRef.current) { onBack(); return; }
    setShowExitConfirm(true);
  }

  function toggleHint() {
    setHintText((current) => (current ? null : sceneHints[scene] ?? null));
  }

  // Это функция-рендер, а не вложенный компонент: иначе монета перемонтируется на
  // каждом движении пальца и перетаскивание обрывается.
  function renderCoin(id: string, sizeClass: string) {
    const dragging = dnd.drag?.moved && dnd.drag.id === id;
    const selected = selectedCoin === id;
    return (
      <button
        key={id}
        type="button"
        aria-label="Монета"
        onPointerDown={(e) => dnd.start(e, id, null)}
        onPointerMove={dnd.move}
        onPointerUp={(e) => { if (dnd.drag?.moved) lastDragEndRef.current = Date.now(); dnd.end(e, handleDrop); }}
        onPointerCancel={dnd.cancel}
        onClick={(e) => { e.stopPropagation(); if (scene === 1) tapCoin(id); else if (Date.now() - lastDragEndRef.current >= 350) setDeposited(true); }}
        className={`touch-none select-none cursor-grab rounded-full transition active:scale-95 ${sizeClass} ${dragging ? 'opacity-30' : ''} ${selected ? 'scale-110 drop-shadow-[0_0_8px_rgba(103,95,243,.9)]' : ''}`}
      >
        <img src={coinIcon} alt="" draggable={false} className="h-full w-full object-contain" />
      </button>
    );
  }

  // Зона для монет (копилка / текущие расходы)
  function renderZone(zone: 'piggy' | 'wallet', title: string, image: string, bg: string, dash: string, coins: string[]) {
    return (
      <div data-drop={zone} onClick={() => tapZone(zone)} className={`flex min-h-0 flex-1 flex-col items-center gap-1 rounded-[18px] p-1.5 ${bg} ${selectedCoin ? 'ring-2 ring-[#675ff3]/50' : ''}`}>
        <img src={image} alt="" draggable={false} className="h-[38%] min-h-0 w-full object-contain" />
        <span className="text-center text-[clamp(11px,3.3vw,14px)] font-black leading-tight text-[#1b3f8f]">{title}</span>
        <div className={`flex min-h-0 w-full flex-1 flex-wrap content-center items-center justify-center gap-1 rounded-[14px] border-2 border-dashed p-1 ${dash}`}>
          {coins.length === 0
            ? <span className="text-[clamp(24px,7vw,32px)] font-black leading-none text-[#a9a3c9]">+</span>
            : coins.map((id) => renderCoin(id, 'h-[clamp(26px,7.5vw,34px)] w-[clamp(26px,7.5vw,34px)]'))}
        </div>
      </div>
    );
  }

  if (phase === 'video') {
    const showBlurred = watched || !playing;
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#17152f]">
        <style>{`@keyframes lessonFadeIn{from{opacity:0}to{opacity:1}}`}</style>
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${showBlurred ? 'scale-105 blur-xl opacity-60' : ''}`}
        />
        {watched && <div className="absolute inset-0 bg-[#17152f]/25 transition duration-500 [animation:lessonFadeIn_500ms_ease-out]" />}
        <button aria-label="Назад" onClick={requestExit} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => { setWatched(true); setPhase('practice'); }} className="absolute right-5 top-7 z-20 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">Пропустить</button>
        {!playing && !watched && (
          <button aria-label="Воспроизвести видео" onClick={() => { setPlaying(true); void videoRef.current?.play().catch(() => setWatched(true)); }} className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#675ff3] text-white shadow-lg transition active:scale-95">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-[3px] h-9 w-9"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
        {watched && (
          <button onClick={() => setPhase('practice')} className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full bg-[#675ff3] px-9 py-5 text-xl font-black text-white shadow-[0_10px_30px_rgba(74,60,205,.5)] transition active:scale-95 [animation:lessonFadeIn_500ms_ease-out]">
            Решать
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M13 5l7 7-7 7v-4H4v-6h9V5z" /></svg>
          </button>
        )}
        {showExitConfirm && <ExitConfirm onStay={() => setShowExitConfirm(false)} onExit={onBack} />}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-[#fbefe1]">
      <style>{`@keyframes lessonSceneIn{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}@keyframes lessonItemIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes lessonShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}}@keyframes lessonCheckIn{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}@keyframes lessonFadeIn{from{opacity:0}to{opacity:1}}@keyframes lessonPiggyBounce{0%{transform:scale(1)}40%{transform:scale(1.14) rotate(-3deg)}100%{transform:scale(1)}}`}</style>
      <img key={scene} src={scenes[scene]} alt="" className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-top [animation:lessonSceneIn_420ms_ease-out]" />

      <button aria-label="Назад к урокам" onClick={requestExit} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>

      <div className="absolute left-1/2 top-[2.8%] z-20 flex h-[6%] w-[44%] -translate-x-1/2 items-center rounded-full border border-white/30 bg-[#4d497d]/55 px-[5%] shadow-[0_4px_14px_rgba(50,42,110,.25)] backdrop-blur-md">
        <div className="relative flex w-full items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/45" />
          <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#675ff3] transition-[width] duration-500" style={{ width: `${(scene / (scenes.length - 1)) * 100}%` }} />
          {scenes.map((_, index) => (
            <span key={index} className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white/55 transition ${mistakeScenes.includes(index) ? 'bg-[#f6c84c] shadow-[0_0_0_2px_rgba(246,200,76,.4)]' : index === scene ? 'bg-white shadow-[0_0_0_2px_rgba(114,106,255,.75),0_0_10px_3px_rgba(255,255,255,.85)]' : index < scene ? 'bg-[#675ff3]' : 'bg-[#817b98]'}`} />
          ))}
        </div>
      </div>

      {reviewNotice && <div className="absolute left-1/2 top-[11%] z-30 -translate-x-1/2 rounded-full bg-[#fff7d6] px-4 py-2 text-center text-[12px] font-black text-[#9a6d08] shadow-[0_5px_16px_rgba(116,84,10,.2)] [animation:lessonFadeIn_220ms_ease-out]">Работа над ошибками — закрепляем навык</div>}

      <button aria-label="Вернуться к анимационному уроку" onClick={() => { setPhase('video'); setWatched(false); setPlaying(false); if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.pause(); } }} className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5b4cf0] text-white shadow-[0_6px_18px_rgba(74,60,205,.38)] transition active:scale-95"><IconBook className="h-7 w-7" /></button>

      <div key={checkPulse} className={`absolute left-[5%] right-[5%] top-[37%] bottom-[17%] z-10 flex flex-col gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out] ${checkState === 'wrong' ? '[animation:lessonShake_420ms_ease-in-out]' : ''}`}>
        {scene === 0 && (
          // Экран 1 — «Выбери цель»
          <>
            <p className="shrink-0 text-center text-[clamp(11px,3.2vw,13px)] font-bold leading-snug text-[#5a6a92]">Выбери финансовую цель, на которую будешь копить монеты.</p>
            {goalsTray.map((item) => (
              <button key={item.id} type="button" onClick={() => setGoal(item.id)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[18px] px-3 shadow-sm transition active:scale-[.98] ${goal === item.id ? SELECTED_RING : ''}`} style={{ background: item.bg }}>
                <img src={item.image} alt="" draggable={false} className="h-[82%] w-[34%] shrink-0 object-contain" />
                <div className="flex flex-1 flex-col items-start leading-tight">
                  <span className="text-[clamp(15px,4.8vw,20px)] font-black" style={{ color: item.fg }}>{item.label}</span>
                  <span className="flex items-center gap-1.5 text-[clamp(20px,6.4vw,28px)] font-black text-[#1b3f8f]"><Coin />{item.price}</span>
                </div>
                <Radio on={goal === item.id} />
              </button>
            ))}
          </>
        )}

        {scene === 1 && (
          // Экран 2 — «Первый взнос»: разложить монеты по двум зонам
          <>
            <p className="shrink-0 text-center text-[clamp(11px,3.2vw,13px)] font-bold leading-snug text-[#5a6a92]">Раздели монеты: часть — в копилку на цель, часть — на текущие расходы.</p>
            <CoinsPill value={WALLET_TOTAL} />
            <div className="flex min-h-0 flex-[1.7] gap-2">
              {renderZone('piggy', 'В копилку на цель', piggyIcon, 'bg-[#fde3ea]', 'border-[#f0a3b8]', piggyCoins)}
              {renderZone('wallet', 'На текущие расходы', walletIcon, 'bg-[#e3f1fb]', 'border-[#8fbde6]', walletCoins)}
            </div>
            <div data-drop="pool" className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 place-items-center gap-1 rounded-[16px] bg-white/70 p-1">
              {poolCoins.map((id) => renderCoin(id, 'h-full max-h-[52px] aspect-square'))}
            </div>
          </>
        )}

        {scene === 2 && (
          // Экран 3 — «План накоплений»: отметить недели, чтобы дойти до цели
          <>
            <p className="shrink-0 text-center text-[clamp(11px,3.2vw,13px)] font-bold leading-snug text-[#5a6a92]">Отметь недели, чтобы накопления дошли до цели.</p>
            <div className="flex shrink-0 items-center gap-3 rounded-[18px] bg-[#fde3ea] px-3 py-1.5">
              <img src={piggyCoinIcon} alt="" draggable={false} className="h-[clamp(38px,11vw,50px)] w-[clamp(34px,10vw,44px)] shrink-0 object-contain" />
              <div className="flex flex-1 flex-col gap-0.5 leading-tight">
                <span className="flex items-center gap-1.5 text-[clamp(13px,4vw,17px)] font-black text-[#1b3f8f]">Цель: <Coin /><span className="text-[clamp(16px,5vw,21px)]">{PLAN_GOAL}</span></span>
                <span className="flex items-center gap-1.5 text-[clamp(10px,3vw,12.5px)] font-extrabold text-[#4d6aa3]">Уже накоплено: <Coin />{PLAN_SAVED}</span>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1">
              {WEEKS.map((week) => {
                const on = weeks.includes(week.n);
                return (
                  <button key={week.n} type="button" onClick={() => toggleWeek(week.n)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[14px] bg-white/90 px-2 shadow-sm transition active:scale-[.98] ${on ? SELECTED_RING : ''}`}>
                    <span className="flex h-[88%] max-h-[44px] aspect-[1/1] shrink-0 flex-col overflow-hidden rounded-lg bg-white shadow-[0_2px_5px_rgba(0,0,0,.18)]">
                      <span className="h-[26%] w-full" style={{ background: week.color }} />
                      <span className="flex flex-1 flex-col items-center justify-center leading-none">
                        <span className="text-[clamp(13px,4vw,17px)] font-black text-[#1b3f8f]">{week.n}</span>
                        <span className="text-[clamp(6px,1.8vw,8px)] font-extrabold text-[#6a7aa3]">неделя</span>
                      </span>
                    </span>
                    <Price value={WEEK_AMOUNT} className="flex-1 justify-start text-[clamp(16px,5vw,21px)] !text-[#1b3f8f]" />
                    <Radio on={on} />
                  </button>
                );
              })}
            </div>
            <div className="relative shrink-0 rounded-[14px] bg-white/80 px-1 pb-0.5 pt-1.5">
              <div className="absolute left-[10%] right-[10%] top-[18px] h-[3px] rounded-full bg-[#d5dcf0]" />
              <div className="absolute left-[10%] top-[18px] h-[3px] rounded-full bg-[#39b54a] transition-[width] duration-500" style={{ width: `${(weeks.length / WEEKS.length) * 80}%` }} />
              <div className="relative flex">
                {PLAN_MARKS.map((mark) => {
                  const reached = mark <= planReached;
                  return (
                    <div key={mark} className="flex flex-1 flex-col items-center gap-0.5">
                      <span className={`flex h-[clamp(20px,6vw,26px)] w-[clamp(20px,6vw,26px)] items-center justify-center rounded-full border-2 transition ${reached ? 'border-[#2f9e44] bg-[#39b54a] text-white' : 'border-dashed border-[#9db8e6] bg-[#eef4ff]'}`}>
                        {reached && <svg viewBox="0 0 24 24" className="h-[70%] w-[70%]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                      </span>
                      <span className="text-[clamp(10px,3vw,12px)] font-black text-[#1b3f8f]">{mark}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {scene === 3 && (
          // Экран 4 — «Цель или мелочь»
          <>
            <p className="shrink-0 text-center text-[clamp(11px,3.2vw,13px)] font-bold leading-snug text-[#5a6a92]">У тебя есть немного монет — выбери вариант, который приблизит тебя к цели.</p>
            <CoinsPill value={SMALL_COINS} />
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              {impulseOptionsTray.map((option) => (
                <button key={option.id} type="button" onClick={() => setImpulse(option.id)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[16px] px-3 shadow-sm transition active:scale-[.98] ${option.bg} ${impulse === option.id ? SELECTED_RING : ''}`}>
                  <img src={option.image} alt="" draggable={false} className="h-[82%] w-[22%] shrink-0 object-contain" />
                  <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                    <span className={`text-[clamp(11.5px,3.5vw,14.5px)] font-black ${option.fg}`}>{option.title}</span>
                    <Price value={SMALL_COINS} className="text-[clamp(13px,4vw,17px)]" />
                    <span className="text-[clamp(8.5px,2.5vw,10.5px)] font-bold text-[#6a7aa3]">{option.note}</span>
                  </div>
                  <Radio on={impulse === option.id} />
                </button>
              ))}
            </div>
          </>
        )}

        {scene === 4 && (
          // Экран 5 — «Финальный шаг»: последние 10 монет в копилку
          <>
            <p className="shrink-0 text-center text-[clamp(11px,3.2vw,13px)] font-bold leading-snug text-[#5a6a92]">Осталось совсем немного! Положи последние монеты в копилку, чтобы достичь цели.</p>
            <div className="flex shrink-0 items-center gap-3 rounded-[16px] bg-[#fde3ea] px-3 py-1.5">
              <img src={piggyCoinIcon} alt="" draggable={false} className="h-[clamp(34px,10vw,44px)] w-[clamp(30px,9vw,38px)] shrink-0 object-contain" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[clamp(11px,3.3vw,14px)] font-black leading-tight text-[#1b3f8f]">Копилка на велосипед</span>
                <GoalBar value={deposited ? BIKE_GOAL : BIKE_SAVED} goal={BIKE_GOAL} />
              </div>
            </div>
            <div className="flex min-h-0 flex-[1.1] items-center gap-2">
              <div className="flex h-full w-[34%] shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] bg-[#fdeedd] p-1.5">
                <span className="flex items-center gap-1 text-[clamp(16px,5vw,21px)] font-black text-[#1b3f8f]"><Coin />{SMALL_COINS}</span>
                <div className="flex min-h-0 w-full flex-1 items-center justify-center rounded-[12px] border-2 border-dashed border-[#f0b07a]">
                  {deposited ? <span className="text-[clamp(22px,6.5vw,30px)] font-black leading-none text-[#a9a3c9]">+</span> : renderCoin('final', 'h-[clamp(36px,10vw,48px)] w-[clamp(36px,10vw,48px)]')}
                </div>
              </div>
              <svg viewBox="0 0 40 24" className="h-[clamp(20px,6vw,28px)] w-[clamp(26px,8vw,36px)] shrink-0 text-[#ea6f9a]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14c8-10 20-10 32 0M35 14l-3-8M35 14l-9 1" /></svg>
              <div data-drop="piggy" onClick={() => !deposited && Date.now() - lastDragEndRef.current >= 350 && setDeposited(true)} className="flex h-full min-w-0 flex-1 items-center justify-center rounded-[16px] bg-white/60">
                <img key={String(deposited)} src={piggyIcon} alt="Копилка" draggable={false} className={`h-[86%] max-w-[92%] object-contain ${deposited ? '[animation:lessonPiggyBounce_450ms_ease-out]' : ''}`} />
              </div>
            </div>
            <div className="relative flex min-h-0 flex-[1.25] flex-col items-center justify-end overflow-hidden rounded-[18px] bg-gradient-to-b from-[#ffe1ea] via-[#fff1d6] to-[#ffe6ef] px-2 pb-1.5 pt-1">
              <span className="absolute left-[12%] top-[14%] h-2 w-2 rotate-12 bg-[#ff5d8f]" />
              <span className="absolute right-[14%] top-[10%] h-2.5 w-2.5 -rotate-12 bg-[#7a5ce0]" />
              <span className="absolute left-[22%] top-[52%] h-2 w-2 rotate-45 bg-[#ffcb2f]" />
              <span className="absolute right-[10%] top-[48%] h-2 w-2 rotate-6 bg-[#2fb5e0]" />
              <img src={bikeIcon} alt="Велосипед" draggable={false} className="min-h-0 w-[64%] flex-1 object-contain drop-shadow-[0_6px_10px_rgba(190,60,80,.25)]" />
              <div className="mt-0.5 flex shrink-0 items-center gap-2 rounded-full bg-white/90 px-4 py-0.5 shadow-sm">
                <span className="text-[clamp(11px,3.3vw,14px)] font-black text-[#c23b5c]">Твоя цель:</span>
                <Price value={BIKE_GOAL} className="text-[clamp(15px,4.6vw,19px)]" />
              </div>
            </div>
          </>
        )}
      </div>

      {checkState === 'correct' && (
        <div key={`ok-${checkPulse}`} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#4caf50] text-5xl text-white shadow-[0_8px_24px_rgba(76,175,80,.5)] [animation:lessonCheckIn_400ms_cubic-bezier(.34,1.56,.64,1)]">✓</div>
        </div>
      )}

      <LessonHintBubble text={hintText} />

      <div className="absolute bottom-[3.5%] left-[4%] right-[4%] z-20 flex items-center gap-[6%]">
        <button type="button" aria-label="Подсказка" onClick={toggleHint} className="flex h-14 w-[45%] min-w-0 shrink-0 items-center justify-center gap-2 rounded-[30px] bg-white/95 px-3 text-[clamp(14px,4.2vw,16px)] font-extrabold text-[#16449b] shadow-[0_6px_18px_rgba(80,63,120,.16)] backdrop-blur-sm transition active:scale-[.98]">
          <img src={bulbIcon} alt="" className="h-[clamp(38px,10.5vw,44px)] w-[clamp(38px,10.5vw,44px)] shrink-0 object-contain" />
          <span className="whitespace-nowrap">Подсказка</span>
        </button>
        <button type="button" aria-label="Проверить" disabled={checkState === 'correct'} onClick={handleCheck} className="h-14 min-w-0 flex-1 rounded-[30px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] px-2 text-[clamp(18px,5.8vw,22px)] font-extrabold text-white shadow-[0_7px_18px_rgba(80,65,215,.38)] transition active:scale-[.98] disabled:opacity-70">Проверить</button>
      </div>

      {dnd.drag?.moved && (
        <img
          src={coinIcon}
          alt=""
          draggable={false}
          className="pointer-events-none absolute z-[999] h-[52px] w-[52px] object-contain drop-shadow-2xl"
          style={{ left: dnd.drag.x - 26, top: dnd.drag.y - 58, transform: 'scale(1.1)' }}
        />
      )}

      {showExitConfirm && <ExitConfirm onStay={() => setShowExitConfirm(false)} onExit={onBack} />}
    </div>
  );
}
