import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/lesson1/lesson-video.mov';
import scene1 from '../assets/lesson1/backgrounds/practice-1.png';
import scene3 from '../assets/lesson1/backgrounds/practice-3.png';
import scene4 from '../assets/lesson1/backgrounds/practice-4.png';
import scene5 from '../assets/lesson1/backgrounds/practice-5.png';
import { IconArrowLeft, IconBook } from '../components/icons';
import foodBowl from '../assets/lesson-items/food.png';
import piggyBank from '../assets/lesson-items/piggy-bank.png';
import starIcon from '../assets/lesson-items/star.png';
import coinIcon from '../assets/lesson-items/coin.png';
import medicineIcon from '../assets/lesson-items/medicine.png';
import stickersIcon from '../assets/lesson-items/stickers.png';
import basketIcon from '../assets/lesson-items/basket.png';
import toyCar from '../assets/lesson-items/toy-car.png';
import waterIcon from '../assets/lesson-items/water.png';
import leashIcon from '../assets/lesson-items/leash.png';
import ballIcon from '../assets/lesson-items/ball.png';
import bowIcon from '../assets/lesson-items/bow.png';
import candyIcon from '../assets/lesson-items/candy.png';
import laptopIcon from '../assets/lesson-items/laptop.png';
import checklistIcon from '../assets/lesson-items/checklist.png';
import groceriesIcon from '../assets/lesson-items/groceries.png';
import gamepadIcon from '../assets/lesson-items/gamepad.png';
import giftIcon from '../assets/lesson-items/gift.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void }

// Пять сцен практики — один и тот же интерфейсный каркас (шапка с прогрессом,
// кнопка "книга", нижняя панель) поверх разных фоновых иллюстраций (те же 4
// фона, что и раньше — фон с машинкой (practice-2) больше не используется).
// Сцена 2 ("Найди лишнее", фон practice-3) — третье упражнение, см.
// WALK_SCENE_INDEX ниже.
const scenes = [scene1, scene4, scene3, scene5, scene1];
// Индекс сцены с упражнением "Найди лишнее" — вынесен отдельной константой,
// чтобы не терять смысл magic-number 2 при условных рендерах ниже.
const WALK_SCENE_INDEX = 2;
// Индекс сцены с упражнением "Расставь шаги!" — четвёртая сцена дублирует
// фон первой (practice-1), как и в новом референсе.
const ORDER_SCENE_INDEX = 4;
// Индекс сцены с упражнением "Появилась новая покупка!" — третья сцена
// (фон practice-5) была единственной без своего упражнения.
const PLAN_SCENE_INDEX = 3;

const practiceItems = [
  { id: 'food', label: 'Еда', price: 60, image: foodBowl, category: 'must' },
  { id: 'toy', label: 'Игрушка', price: 50, image: toyCar, category: 'want' },
  { id: 'savings', label: 'Копилка', price: 20, image: piggyBank, category: 'save' },
] as const;
const budgetItems = [
  { id: 'budget-food', label: 'Еда', price: 50, image: foodBowl, category: 'budget' },
  { id: 'budget-medicine', label: 'Лекарство', price: 30, image: medicineIcon, category: 'budget' },
  { id: 'budget-stickers', label: 'Наклейки', price: 20, image: stickersIcon, category: 'budget' },
  { id: 'budget-toy', label: 'Игрушка', price: 40, image: toyCar, category: 'budget' },
] as const;
// Упражнение 3 — "Найди лишнее": среди 6 предметов для прогулки с собакой
// нужно перетащить в корзину только необходимое (без цены — тут не покупка,
// а выбор нужных/ненужных вещей).
const walkItems = [
  { id: 'walk-water', label: 'Вода', image: waterIcon, category: 'walk' },
  { id: 'walk-leash', label: 'Поводок', image: leashIcon, category: 'walk' },
  { id: 'walk-medicine', label: 'Лекарство', image: medicineIcon, category: 'walk' },
  { id: 'walk-toy', label: 'Игрушка', image: ballIcon, category: 'walk' },
  { id: 'walk-bow', label: 'Бантик', image: bowIcon, category: 'walk' },
  { id: 'walk-candy', label: 'Конфета', image: candyIcon, category: 'walk' },
] as const;
// Упражнение 4 — "Расставь шаги!": 4 карточки-действия нужно расставить по
// порядку в пронумерованные слоты (без цены — тут порядок действий, а не
// покупка).
const orderItems = [
  { id: 'order-balance', label: 'Баланс', image: laptopIcon, category: 'order' },
  { id: 'order-find', label: 'Найти', image: checklistIcon, category: 'order' },
  { id: 'order-buy', label: 'Купить', image: groceriesIcon, category: 'order' },
  { id: 'order-toy', label: 'Игрушка', image: toyCar, category: 'order' },
] as const;
// Цвета пронумерованных слотов упражнения "Расставь шаги!" (зелёный →
// бирюзовый → фиолетовый → розовый, как в референсе).
const orderSlots = [
  { slot: 0, color: '#4fb35a' },
  { slot: 1, color: '#2bb0b8' },
  { slot: 2, color: '#8a5cf0' },
  { slot: 3, color: '#ef5da8' },
] as const;
// Упражнение 5 — "Появилась новая покупка!": 4 статьи плана. Меняются
// только "Развлечения" (60→ уменьшить на 10) и "Подарок другу" (+10) —
// еда и копилка остаются без изменений.
const planCategories = [
  { id: 'plan-food', label: 'Еда', base: 60, image: foodBowl, color: '#dff8d7', border: '#83cf7a' },
  { id: 'plan-save', label: 'Копилка', base: 20, image: piggyBank, color: '#d8f7f5', border: '#78cacc' },
  { id: 'plan-fun', label: 'Развлечения', base: 20, image: gamepadIcon, color: '#eedfff', border: '#b18de9' },
  { id: 'plan-gift', label: 'Подарок другу', base: 10, image: giftIcon, color: '#fff3d6', border: '#e8c363' },
] as const;

// Подсказки/обратная связь при ошибке — тексты из сценария (уроки практика.pdf),
// ключ — индекс сцены. Показываются и по кнопке "Подсказка", и после
// неверной проверки (правило: ошибка не отнимает монеты, а объясняет
// следующий шаг).
const sceneHints: Record<number, string> = {
  0: 'Еда нужна каждый день. Игрушка радует. Копилка помогает накопить на цель.',
  1: 'Сначала добавь еду и лекарство. Потом посмотри, сколько осталось.',
  [WALK_SCENE_INDEX]: 'Можно ли обойтись без этого сегодня?',
  [PLAN_SCENE_INDEX]: 'Ищи экономию в желаниях, не в еде и здоровье.',
  [ORDER_SCENE_INDEX]: 'Игрушку выбираем только после обязательного.',
};

type PracticeItem = { id: string; label: string; price?: number; image: string; category: string };

function DraggableItem({ item, sourceSlot, setDragging, onClick, isDragging = false }: { item: PracticeItem; sourceSlot?: number; setDragging: (value: { id: string; from: number | null } | null) => void; onClick: () => void; isDragging?: boolean }) {
  return <div draggable onDragStart={() => setDragging({ id: item.id, from: sourceSlot ?? null })} onDragEnd={() => setDragging(null)} onClick={onClick} className={`flex min-h-0 cursor-grab flex-col items-center justify-center rounded-[15px] bg-white/90 p-1 text-center shadow-[0_3px_8px_rgba(83,65,90,.12)] transition-all duration-200 active:cursor-grabbing active:scale-95 ${isDragging ? 'opacity-0' : 'animate-[lessonItemIn_220ms_ease-out]'}`}>
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white/70"><img src={item.image} alt="" className="h-full w-full object-contain p-1" /></div>
    <span className="mt-0.5 text-[clamp(10px,3vw,14px)] font-extrabold leading-none text-[#17469d]">{item.label}</span>
    {item.price !== undefined && <span className="flex items-center gap-1 text-[clamp(9px,2.7vw,12px)] font-bold text-[#17469d]"><img src={coinIcon} alt="" className="h-4 w-4 object-contain" />{item.price}</span>}
  </div>;
}

/** Первый урок: видео и чистые фоновые сцены практики.
 * Интерфейс заданий будет добавляться отдельным слоем поверх этого каркаса.
 */
export default function LessonOne({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [placements, setPlacements] = useState<(string | null)[]>([null, null, null]);
  const [budgetCart, setBudgetCart] = useState<string[]>([]);
  const [walkCart, setWalkCart] = useState<string[]>([]);
  const [orderPlacements, setOrderPlacements] = useState<(string | null)[]>([null, null, null, null]);
  const [planApplied, setPlanApplied] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; from: number | null } | null>(null);
  // Результат последней проверки: 'correct' на короткое время перед переходом
  // к следующей сцене (показываем галочку), 'wrong' блокирует переход и
  // держит подсказку на экране, пока задание не решено верно.
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  // Счётчик, чтобы переигрывать CSS-анимацию (тряска/галочка) даже если
  // результат проверки не изменился (два неверных подряд и т.п.).
  const [checkPulse, setCheckPulse] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pauseBackgroundMusic();
    return () => startBackgroundMusic();
  }, []);

  useEffect(() => {
    scenes.forEach((source) => {
      const image = new Image();
      image.src = source;
    });
  }, []);

  // По окончании видео захватываем его последний кадр в canvas — вместо
  // того чтобы полагаться на застывший кадр самого <video> (на части
  // устройств это даёт чёрный экран), показываем размытый снимок сразу и
  // синхронно, без мигания.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => {
      const canvas = canvasRef.current;
      if (canvas && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      setWatched(true);
    };
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, []);

  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); }, []);

  function placeItem(slot: number, id: string) {
    setPlacements((current) => {
      const next = [...current];
      const from = next.indexOf(id);
      const replaced = next[slot];
      if (from >= 0) next[from] = replaced ?? null;
      next[slot] = id;
      return next;
    });
    setDragging(null);
  }

  function returnToTray(id: string) {
    setPlacements((current) => current.map((value) => value === id ? null : value));
    setDragging(null);
  }

  function addToBudgetCart(id: string) {
    setBudgetCart((current) => {
      const item = budgetItems.find((entry) => entry.id === id);
      const nextTotal = current.reduce((total, value) => total + (budgetItems.find((entry) => entry.id === value)?.price ?? 0), 0) + (item?.price ?? 0);
      return !item || current.includes(id) || current.length >= 3 || nextTotal > 100 ? current : [...current, id];
    });
    setDragging(null);
  }

  function removeFromBudgetCart(id: string) {
    setBudgetCart((current) => current.filter((value) => value !== id));
    setDragging(null);
  }

  // Корзина упражнения "Найди лишнее" — до 3 предметов, без денежного лимита
  // (тут проверяется не бюджет, а нужность вещи для прогулки).
  function addToWalkCart(id: string) {
    setWalkCart((current) => (current.includes(id) || current.length >= 3 ? current : [...current, id]));
    setDragging(null);
  }

  function removeFromWalkCart(id: string) {
    setWalkCart((current) => current.filter((value) => value !== id));
    setDragging(null);
  }

  function placeOrderItem(slot: number, id: string) {
    setOrderPlacements((current) => {
      const next = [...current];
      const from = next.indexOf(id);
      const replaced = next[slot];
      if (from >= 0) next[from] = replaced ?? null;
      next[slot] = id;
      return next;
    });
    setDragging(null);
  }

  function returnOrderItemToTray(id: string) {
    setOrderPlacements((current) => current.map((value) => value === id ? null : value));
    setDragging(null);
  }

  // Перенос 10 монет из "Развлечения" в "Подарок другу" — единое действие
  // (перетащить жетон в "Новый план" или кликнуть по нему на мобильном).
  function applyPlanAdjustment() {
    setPlanApplied(true);
    setDragging(null);
  }

  function undoPlanAdjustment() {
    setPlanApplied(false);
    setDragging(null);
  }

  const budgetSpent = budgetCart.reduce((total, id) => total + (budgetItems.find((item) => item.id === id)?.price ?? 0), 0);
  const budgetBalance = 100 - budgetSpent;

  // Правильное решение для текущей сцены — по одному условию на упражнение,
  // взято из сценария (уроки практика.pdf).
  function isSceneCorrect(): boolean {
    if (scene === 1) {
      // "Собери корзину": еда + лекарство + наклейки = 100, игрушка остаётся на полке.
      const required = ['budget-food', 'budget-medicine', 'budget-stickers'];
      return budgetCart.length === 3 && required.every((id) => budgetCart.includes(id));
    }
    if (scene === WALK_SCENE_INDEX) {
      // "Найди лишнее": в корзину — вода, поводок и лекарство, остальное остаётся.
      const required = ['walk-water', 'walk-leash', 'walk-medicine'];
      return walkCart.length === 3 && required.every((id) => walkCart.includes(id));
    }
    if (scene === ORDER_SCENE_INDEX) {
      // "Расставь шаги": баланс -> обязательное -> покупка -> остаток и желание.
      return orderPlacements[0] === 'order-balance' && orderPlacements[1] === 'order-find' && orderPlacements[2] === 'order-buy' && orderPlacements[3] === 'order-toy';
    }
    if (scene === PLAN_SCENE_INDEX) {
      // "Появилась новая покупка": уменьшить развлечения и перевести 10 на подарок.
      return planApplied;
    }
    // "Разложи расходы": еда -> обязательное, копилка -> накопления, игрушка -> желания.
    return placements[0] === 'food' && placements[1] === 'savings' && placements[2] === 'toy';
  }

  function goToNextScene() {
    setScene((value) => value + 1);
    setPlacements([null, null, null]);
    setWalkCart([]);
    setOrderPlacements([null, null, null, null]);
    setPlanApplied(false);
    setCheckState('idle');
    setHintText(null);
  }

  function handleCheck() {
    if (checkState === 'correct') return;
    if (isSceneCorrect()) {
      setHintText(null);
      setCheckState('correct');
      setCheckPulse((value) => value + 1);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        if (scene < scenes.length - 1) goToNextScene(); else onBack();
      }, 700);
    } else {
      setCheckState('wrong');
      setCheckPulse((value) => value + 1);
      setHintText(sceneHints[scene] ?? 'Попробуй ещё раз.');
    }
  }

  function toggleHint() {
    setHintText((current) => (current ? null : sceneHints[scene] ?? null));
  }

  if (phase === 'video') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#17152f]">
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${watched ? 'opacity-0' : playing ? '' : 'scale-105 blur-xl opacity-60'}`}
        />
        {/* Снимок последнего кадра — подменяет видео после его окончания,
            чтобы не было чёрного экрана, пока UI решает, что показать. */}
        <canvas
          ref={canvasRef}
          aria-hidden
          className={`absolute inset-0 h-full w-full scale-105 object-cover blur-xl transition-opacity duration-300 ${watched ? 'opacity-70' : 'pointer-events-none opacity-0'}`}
        />
        {watched && <div className="absolute inset-0 bg-[#17152f]/20" />}
        <button aria-label="Назад" onClick={onBack} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => { setWatched(true); setPhase('practice'); }} className="absolute right-5 top-7 z-20 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">Пропустить</button>
        {!playing && !watched && (
          <button aria-label="Воспроизвести видео" onClick={() => { setPlaying(true); void videoRef.current?.play().catch(() => setWatched(true)); }} className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#675ff3] text-white shadow-lg transition active:scale-95">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-[3px] h-9 w-9"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
        {watched && (
          <button onClick={() => setPhase('practice')} className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full bg-[#675ff3] px-9 py-5 text-xl font-black text-white shadow-[0_10px_30px_rgba(74,60,205,.5)] transition active:scale-95 [animation:lessonVideoCheckIn_420ms_cubic-bezier(.34,1.56,.64,1)]">
            Решать
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M13 5l7 7-7 7v-4H4v-6h9V5z" /></svg>
          </button>
        )}
        <style>{`@keyframes lessonVideoCheckIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}60%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fbefe1]">
      <style>{`@keyframes lessonSceneIn{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}@keyframes lessonItemIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes lessonShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}}@keyframes lessonCheckIn{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}`}</style>
      <img key={scene} src={scenes[scene]} alt="Фон практического задания" className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center [animation:lessonSceneIn_420ms_ease-out]" />

      {/* Кнопка назад повторяет шапку разделов на главной */}
      <button aria-label="Назад к урокам" onClick={onBack} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>

      <div className="absolute left-1/2 top-[2.8%] z-20 flex h-[6%] w-[44%] -translate-x-1/2 items-center rounded-full border border-white/30 bg-[#4d497d]/55 px-[5%] shadow-[0_4px_14px_rgba(50,42,110,.25)] backdrop-blur-md">
          <div className="relative flex w-full items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/45" />
            <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#675ff3] transition-[width] duration-500" style={{ width: `${(scene / (scenes.length - 1)) * 100}%` }} />
            {scenes.map((_, index) => (
              <span
                key={index}
                className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white/55 transition ${index === scene ? 'bg-white shadow-[0_0_0_2px_rgba(114,106,255,.75),0_0_10px_3px_rgba(255,255,255,.85)]' : index < scene ? 'bg-[#675ff3]' : 'bg-[#817b98]'}`}
            />
          ))}
        </div>
      </div>

      {/* Круглая кнопка книги — единственный дополнительный элемент на чистом фоне */}
      <button aria-label="Вернуться к анимационному уроку" onClick={() => { setPhase('video'); setWatched(false); setPlaying(false); if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.pause(); } }} className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5b4cf0] text-white shadow-[0_6px_18px_rgba(74,60,205,.38)] transition active:scale-95"><IconBook className="h-7 w-7" /></button>

      <div key={checkPulse} className={`absolute left-[5%] right-[5%] top-[40%] bottom-[21%] z-10 grid grid-cols-3 grid-rows-[minmax(0,1.18fr)_minmax(0,.82fr)] gap-2.5 ${checkState === 'wrong' ? '[animation:lessonShake_420ms_ease-in-out]' : ''}`}>
        {scene === 1 ? <div className="col-span-3 row-span-2 grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out]">
          <div className="mx-auto flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[#17469d] shadow-sm"><img src={coinIcon} alt="" className="h-8 w-8" /><span className="text-[clamp(13px,3.8vw,19px)] font-black">Бюджет: {budgetBalance}</span></div>
          <div className="grid min-h-0 grid-cols-4 gap-2" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && budgetCart.includes(dragging.id) && removeFromBudgetCart(dragging.id)}>
            {budgetItems.filter((item) => !budgetCart.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} setDragging={setDragging} isDragging={dragging?.id === item.id} onClick={() => addToBudgetCart(item.id)} />)}
          </div>
          <div className="grid min-w-0 grid-cols-[1.25fr_2.8fr_auto] items-center gap-2 overflow-hidden rounded-2xl bg-[#fff3df] p-2" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && addToBudgetCart(dragging.id)}>
            <div className="flex min-w-0 flex-col items-center text-center"><img src={basketIcon} alt="Корзина" className="h-20 w-24 object-contain" /><span className="max-w-full whitespace-nowrap text-[clamp(8px,1.8vw,10px)] font-black tracking-[-0.03em] text-[#17469d]">Твоя корзина</span></div>
            <div className="grid min-w-0 grid-cols-3 gap-1.5">{[0, 1, 2].map((slot) => { const item = budgetItems.find((entry) => entry.id === budgetCart[slot]); return <button type="button" draggable={Boolean(item)} key={slot} onDragStart={() => item && setDragging({ id: item.id, from: null })} onDragEnd={() => setDragging(null)} onClick={() => item && removeFromBudgetCart(item.id)} className="flex aspect-square min-w-0 items-center justify-center rounded-xl border-2 border-dashed border-[#87cfe0] bg-[#fffaf3] p-1">{item && <img src={item.image} alt={item.label} className="h-full w-full object-contain" />}</button>; })}</div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/75 text-[clamp(14px,4vw,20px)] font-black text-[#17469d]">{budgetCart.length}/3</div>
          </div>
        </div> : scene === WALK_SCENE_INDEX ? (
          /* Упражнение 3 — "Найди лишнее": та же карточка-каркас, что у "Бюджета"
             (сетка предметов / строка-корзина), но без текстовой шапки — сетка
             2×3 без цены, а корзина ниже и компактнее (без подписи "Твоя
             корзина"), чтобы 6 карточек в два ряда уместились в ту же высоту
             зоны разработки, что и 4 карточки в один ряд у соседа.
             mt — своя, локальная просадка вниз именно этой карточки (не трогает
             общие top/bottom зоны разработки, общие для всех сцен). */
          <div className="col-span-3 row-span-2 mt-[3%] grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out]">
            <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-2" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && walkCart.includes(dragging.id) && removeFromWalkCart(dragging.id)}>
              {walkItems.filter((item) => !walkCart.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} setDragging={setDragging} isDragging={dragging?.id === item.id} onClick={() => addToWalkCart(item.id)} />)}
            </div>
            <div className="grid min-w-0 grid-cols-[1fr_2.6fr_auto] items-center gap-2 overflow-hidden rounded-2xl bg-[#fff3df] p-1.5" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && addToWalkCart(dragging.id)}>
              <div className="flex min-w-0 items-center justify-center"><img src={basketIcon} alt="Корзина" className="h-14 w-16 object-contain" /></div>
              <div className="grid min-w-0 grid-cols-3 gap-1.5">{[0, 1, 2].map((slot) => { const item = walkItems.find((entry) => entry.id === walkCart[slot]); return <button type="button" draggable={Boolean(item)} key={slot} onDragStart={() => item && setDragging({ id: item.id, from: null })} onDragEnd={() => setDragging(null)} onClick={() => item && removeFromWalkCart(item.id)} className="flex aspect-square min-w-0 items-center justify-center rounded-xl border-2 border-dashed border-[#87cfe0] bg-[#fffaf3] p-1">{item && <img src={item.image} alt={item.label} className="h-full w-full object-contain" />}</button>; })}</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-[clamp(13px,3.6vw,17px)] font-black text-[#17469d]">{walkCart.length}/3</div>
            </div>
          </div>
        ) : scene === ORDER_SCENE_INDEX ? (
          /* Упражнение 4 — "Расставь шаги!": тот же каркас карточки, что у
             соседних упражнений — сверху пронумерованные слоты по порядку
             (соединены стрелками), снизу лоток с карточками действий. Без
             текстовой подписи (см. правило "убери эту подпись"). */
          <div className="col-span-3 row-span-2 mt-[3%] grid min-h-0 grid-rows-[minmax(0,.68fr)_minmax(0,1fr)] gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out]">
            <div className="grid min-h-0 grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-1">
              {orderSlots.flatMap((slotDef, index) => {
                const item = orderItems.find((entry) => entry.id === orderPlacements[slotDef.slot]);
                const slotEl = (
                  <div key={`slot-${slotDef.slot}`} onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && placeOrderItem(slotDef.slot, dragging.id)} className="flex min-h-0 flex-col items-center gap-1">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ background: slotDef.color }}>{index + 1}</span>
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-white/40 p-1" style={{ borderColor: slotDef.color }}>
                      {item && <div draggable onDragStart={() => setDragging({ id: item.id, from: slotDef.slot })} onClick={() => returnOrderItemToTray(item.id)} className="flex h-full w-full cursor-grab items-center justify-center overflow-hidden rounded-lg bg-white/85 active:cursor-grabbing active:scale-95"><img src={item.image} alt={item.label} className="h-full w-full object-contain p-1" /></div>}
                    </div>
                  </div>
                );
                if (index === orderSlots.length - 1) return [slotEl];
                return [slotEl, <span key={`arrow-${slotDef.slot}`} className="text-[clamp(16px,4vw,22px)] font-black text-[#c9bfa8]">→</span>];
              })}
            </div>
            <div className="grid min-h-0 grid-cols-4 gap-2 rounded-[18px] bg-white/55 p-2" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && returnOrderItemToTray(dragging.id)}>
              {orderItems.filter((item) => !orderPlacements.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} setDragging={setDragging} isDragging={dragging?.id === item.id} onClick={() => placeOrderItem(orderPlacements.findIndex((value) => value === null), item.id)} />)}
            </div>
          </div>
        ) : scene === PLAN_SCENE_INDEX ? (
          /* Упражнение 5 — "Появилась новая покупка!": сверху статичный
             образец плана (4 статьи), снизу тот же план, куда нужно
             перенести жетон "-10 → +10", чтобы уменьшить "Развлечения" и
             увеличить "Подарок другу". Без текстовой подписи-заголовка (см.
             правило "убери эту подпись") — сами карточки статей плана это
             часть механики, а не декоративный текст. */
          <div className="col-span-3 row-span-2 mt-[1%] grid min-h-0 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-1 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out]">
            <div className="grid min-h-0 grid-cols-4 gap-1.5">
              {planCategories.map((cat) => (
                <div key={`your-${cat.id}`} className="flex min-h-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl p-1" style={{ background: cat.color }}>
                  <img src={cat.image} alt="" className="h-7 w-7 object-contain" />
                  <span className="max-w-full truncate text-[clamp(7px,1.8vw,9px)] font-black leading-none text-[#5a4a3a]">{cat.label}</span>
                  <span className="flex items-center gap-0.5 text-[clamp(8px,2vw,10px)] font-black text-[#17469d]"><img src={coinIcon} alt="" className="h-3 w-3 object-contain" />{cat.base}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 py-0.5">
              {!planApplied ? (
                <div draggable onDragStart={() => setDragging({ id: 'plan-transfer', from: null })} onDragEnd={() => setDragging(null)} onClick={applyPlanAdjustment} className="flex cursor-grab items-center gap-2 active:cursor-grabbing active:scale-95">
                  <span className="rounded-full bg-[#ef5350] px-2.5 py-1 text-[clamp(11px,3vw,13px)] font-black text-white shadow-sm">−10</span>
                  <span className="text-[clamp(14px,4vw,18px)] font-black text-[#e0785a]">→</span>
                  <span className="rounded-full bg-[#4caf50] px-2.5 py-1 text-[clamp(11px,3vw,13px)] font-black text-white shadow-sm">+10</span>
                </div>
              ) : <span className="text-[clamp(10px,2.6vw,12px)] font-bold text-[#6c9a4a]">✓ План обновлён</span>}
            </div>
            <div className="grid min-h-0 grid-cols-4 gap-1.5" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging?.id === 'plan-transfer' && applyPlanAdjustment()}>
              {planCategories.map((cat) => {
                const value = cat.id === 'plan-fun' ? (planApplied ? cat.base - 10 : cat.base) : cat.id === 'plan-gift' ? (planApplied ? cat.base + 10 : cat.base) : cat.base;
                const changed = planApplied && (cat.id === 'plan-fun' || cat.id === 'plan-gift');
                return (
                  <div key={`new-${cat.id}`} onClick={() => changed && undoPlanAdjustment()} className={`flex min-h-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border-2 p-1 transition ${changed ? 'cursor-pointer border-[#6c9a4a] bg-[#f2fbe9]' : 'border-dashed'}`} style={{ borderColor: changed ? '#6c9a4a' : cat.border, background: changed ? '#f2fbe9' : cat.color }}>
                    <img src={cat.image} alt="" className="h-7 w-7 object-contain" />
                    <span className="max-w-full truncate text-[clamp(7px,1.8vw,9px)] font-black leading-none text-[#5a4a3a]">{cat.label}</span>
                    <span className="flex items-center gap-0.5 text-[clamp(8px,2vw,10px)] font-black text-[#17469d]"><img src={coinIcon} alt="" className="h-3 w-3 object-contain" />{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : <>
        {[
          { label: 'Обязательное', hint: 'То, без чего нельзя', titleColor: '#1f7a32', color: 'bg-[#dff8d7]', border: '#83cf7a', icon: foodBowl, slot: 0 },
          { label: 'Накопления', hint: 'Откладываем на будущее', titleColor: '#167b86', color: 'bg-[#d8f7f5]', border: '#78cacc', icon: piggyBank, slot: 1 },
          { label: 'Желания', hint: 'То, что хочется', titleColor: '#5430d2', color: 'bg-[#eedfff]', border: '#b18de9', icon: starIcon, slot: 2 },
        ].map((category) => {
          const placed = placements[category.slot];
          const item = practiceItems.find((entry) => entry.id === placed);
          return <div key={category.label} onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && placeItem(category.slot, dragging.id)} className={`flex min-h-0 flex-col items-center overflow-hidden rounded-[20px] ${category.color} p-2 shadow-[0_4px_12px_rgba(85,71,100,.14)] animate-[lessonItemIn_220ms_ease-out]`}>
            <div className="flex min-w-0 max-w-full flex-col items-center gap-1 text-center" style={{ color: category.titleColor }}><img src={category.icon} alt="" className="h-12 w-12 shrink-0 object-contain" /><span className="block max-w-full whitespace-nowrap text-[clamp(8px,2.2vw,10px)] font-black leading-none tracking-[-0.03em]">{category.label}</span></div>
            <div className="mt-2 flex aspect-square w-[88%] flex-none items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-white/10 p-1" style={{ borderColor: category.border }}>
              {item && <div draggable onDragStart={() => setDragging({ id: item.id, from: category.slot })} onClick={() => returnToTray(item.id)} className="flex h-full w-full cursor-grab items-center justify-center overflow-hidden rounded-lg bg-white/80 active:cursor-grabbing active:scale-95"><img src={item.image} alt={item.label} className="h-full w-full object-contain p-1" /></div>}
            </div>
          </div>;
        })}
        <div className="col-span-3 grid min-h-0 grid-cols-3 gap-2 rounded-[22px] bg-white/55 p-2" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && returnToTray(dragging.id)}>
          {practiceItems.filter((item) => !placements.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} setDragging={setDragging} isDragging={dragging?.id === item.id} onClick={() => placeItem(placements.findIndex((value) => value === null), item.id)} />)}
        </div>
        </>}
      </div>

      {/* Галочка при верном ответе — общий оверлей поверх зоны упражнения,
          не завязан на конкретную карточку сцены. */}
      {checkState === 'correct' && (
        <div key={checkPulse} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#4caf50] text-5xl text-white shadow-[0_8px_24px_rgba(76,175,80,.5)] [animation:lessonCheckIn_400ms_cubic-bezier(.34,1.56,.64,1)]">✓</div>
        </div>
      )}

      {/* Подсказка/обратная связь при ошибке — над нижней панелью кнопок. */}
      {hintText && (
        <div className="absolute bottom-[22%] left-[6%] right-[6%] z-20 rounded-2xl bg-[#fff3cd] px-4 py-2 text-center text-[clamp(11px,3.2vw,13px)] font-bold text-[#7a5b13] shadow-[0_4px_12px_rgba(120,90,20,.2)] [animation:lessonItemIn_200ms_ease-out]">
          💡 {hintText}
        </div>
      )}

      <div className="absolute bottom-[3.5%] left-[4%] right-[4%] z-20 flex items-center gap-[6%]">
        <button type="button" aria-label="Подсказка" onClick={toggleHint} className="flex h-14 w-[45%] min-w-0 shrink-0 items-center justify-center gap-3 rounded-[30px] bg-white/95 px-3 text-[clamp(14px,4.2vw,16px)] font-extrabold text-[#16449b] shadow-[0_6px_18px_rgba(80,63,120,.16)] backdrop-blur-sm transition active:scale-[.98]">
          <span className="flex h-[clamp(36px,10vw,41px)] w-[clamp(36px,10vw,41px)] shrink-0 items-center justify-center rounded-full bg-[#6355f0] text-[clamp(21px,6vw,25px)] shadow-[0_3px_8px_rgba(72,58,200,.35)]">💡</span>
          <span className="whitespace-nowrap">Подсказка</span>
        </button>
        <button type="button" aria-label="Проверить" disabled={checkState === 'correct'} onClick={handleCheck} className="h-14 min-w-0 flex-1 rounded-[30px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] px-2 text-[clamp(18px,5.8vw,22px)] font-extrabold text-white shadow-[0_7px_18px_rgba(80,65,215,.38)] transition active:scale-[.98] disabled:opacity-70">Проверить</button>
      </div>
    </div>
  );
}
