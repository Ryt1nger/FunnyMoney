import { useEffect, useRef, useState } from 'react';
import LessonHintBubble from '../components/LessonHintBubble';
import videoSrc from '../assets/lesson1/lesson-video.mp4';
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
import gamepadIcon from '../assets/lesson-items/gamepad.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';
import { pausePracticeMusic, startPracticeMusic } from '../services/practiceMusic';
import { playCorrectAnswerSound, playWrongAnswerSound } from '../services/answerSound';
import { usePointerDrag } from '../hooks/usePointerDrag';
import DragCardPreview from '../components/DragCardPreview';
import { shuffleArray } from '../utils/shuffle';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void; onPracticeComplete?: () => void; onFinish: (correctCount: number) => void }

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
// Упражнение 4 — "Расставь шаги!": 5 карточек-действий нужно расставить по
// порядку в пронумерованные слоты (без цены — тут порядок действий, а не
// покупка). Каждая карточка — цветная плашка с общей монеткой-лапкой, как в
// референсе (см. мокап "Расставь шаги").
const orderItems = [
  { id: 'order-balance', label: 'Посмотреть баланс', shortLabel: 'Баланс', image: coinIcon, category: 'order', bg: '#dbe9fb', fg: '#2f6fd6' },
  { id: 'order-find', label: 'Найти обязательное', shortLabel: 'Найти', image: coinIcon, category: 'order', bg: '#fdecd2', fg: '#b9781f' },
  { id: 'order-buy', label: 'Купить обязательное', shortLabel: 'Купить', image: coinIcon, category: 'order', bg: '#fde0e8', fg: '#d1497a' },
  { id: 'order-remainder', label: 'Посмотреть остаток', shortLabel: 'Остаток', image: coinIcon, category: 'order', bg: '#ece2fb', fg: '#7a54d9' },
  { id: 'order-toy', label: 'Выбрать желание, если хватает', shortLabel: 'Желание', image: coinIcon, category: 'order', bg: '#dff8d7', fg: '#3f9142' },
] as const;
// Пронумерованные слоты упражнения "Расставь шаги!" — просто 1..5, порядок
// определяется индексом (без индивидуального цвета, как в референсе).
const orderSlots = [{ slot: 0 }, { slot: 1 }, { slot: 2 }, { slot: 3 }, { slot: 4 }] as const;
// Упражнение 5 — "Появилась новая нужная трата!": план на месяц из 3 статей
// (еда/копилка/развлечения = 100 монет), затем вопрос с тремя вариантами —
// правильный ответ уменьшает "Развлечения" на 10 монет, чтобы найти деньги
// на лекарство для питомца.
const planItems = [
  { id: 'plan-food', label: 'Еда', base: 60, image: foodBowl },
  { id: 'plan-save', label: 'Отложить', base: 20, image: piggyBank },
  { id: 'plan-fun', label: 'Развлечения', base: 20, image: gamepadIcon },
] as const;
const PLAN_EXPENSE_LABEL = 'Лекарство для питомца';
const PLAN_EXPENSE_COST = 10;
const planOptions = [
  { id: 'reduce-fun', label: `Уменьшить развлечения на ${PLAN_EXPENSE_COST} монет`, image: gamepadIcon },
  { id: 'take-savings', label: `Взять из отложенных ${PLAN_EXPENSE_COST} монет`, image: piggyBank },
  { id: 'reduce-food', label: `Уменьшить расход на еду на ${PLAN_EXPENSE_COST} монет`, image: foodBowl },
] as const;

// Объединённый список карточек всех упражнений — только чтобы найти
// картинку для плавающей копии карточки во время перетаскивания (см.
// dragItemLookup ниже); id уникальны между упражнениями, так что конфликтов
// нет, а показывается за раз всегда только карточка активной сцены.
const dragItemLookup: PracticeItem[] = [...practiceItems, ...budgetItems, ...walkItems, ...orderItems];

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

// Короткая инструкция задания — что именно нужно сделать на этой сцене
// (в отличие от sceneHints выше, это не подсказка при ошибке, а постоянное
// пояснение, чтобы ребёнок понимал задачу до первой попытки).
const sceneInstructions: Record<number, string> = {
  0: 'Разложи карточки по трём коробкам: нужное каждый день, то, что хочется, и то, что стоит отложить.',
  1: 'Собери в корзину еду, лекарство и наклейки — уложись в баланс, игрушка пока подождёт.',
  [WALK_SCENE_INDEX]: 'Собери в дорогу только то, что точно понадобится на прогулке — остальное оставь дома.',
  [PLAN_SCENE_INDEX]: 'Появилась новая покупка! Перенеси 10 монет из «Развлечений» в «Подарок другу».',
  [ORDER_SCENE_INDEX]: 'Расставь карточки по порядку: с чего начать покупку и чем закончить.',
};

type PracticeItem = { id: string; label: string; price?: number; image: string; category: string };
// Тип возвращаемого usePointerDrag() — та же тройка start/move/end/cancel,
// что и в кормлении на кухне (Kitchen.tsx), но с центральным "куда бросили"
// через data-drop вместо привязки к одной цели.
type PointerDnd = ReturnType<typeof usePointerDrag>;
type DropHandler = (id: string, from: number | null, zone: string | null) => void;

function DraggableItem({ item, sourceSlot, dnd, onDrop, onClick, isDragging = false }: { item: PracticeItem; sourceSlot?: number; dnd: PointerDnd; onDrop: DropHandler; onClick: () => void; isDragging?: boolean }) {
  return <div
    onPointerDown={(e) => dnd.start(e, item.id, sourceSlot ?? null)}
    onPointerMove={dnd.move}
    onPointerUp={(e) => dnd.end(e, onDrop)}
    onPointerCancel={dnd.cancel}
    onClick={onClick}
    className={`flex min-h-0 touch-none select-none cursor-grab flex-col items-center justify-center rounded-[15px] bg-white/90 p-1 text-center shadow-[0_3px_8px_rgba(83,65,90,.12)] transition-all duration-200 active:cursor-grabbing active:scale-95 ${isDragging ? 'opacity-0' : 'animate-[lessonItemIn_220ms_ease-out]'}`}>
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white/70"><img src={item.image} alt="" className="h-full w-full object-contain p-1" /></div>
    <span className="mt-0.5 text-[clamp(10px,3vw,14px)] font-extrabold leading-none text-[#17469d]">{item.label}</span>
    {item.price !== undefined && <span className="flex items-center gap-1 text-[clamp(9px,2.7vw,12px)] font-bold text-[#17469d]"><img src={coinIcon} alt="" className="h-4 w-4 object-contain" />{item.price}</span>}
  </div>;
}

// Предупреждение перед выходом из урока, если прогресс ещё не завершён —
// показывается поверх любой фазы (видео или практика). Тот же компонент,
// что и во втором уроке.
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

/** Первый урок: видео и чистые фоновые сцены практики.
 * Интерфейс заданий будет добавляться отдельным слоем поверх этого каркаса.
 */
export default function LessonOne({ onBack, onPracticeComplete, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [placements, setPlacements] = useState<(string | null)[]>([null, null, null]);
  const [budgetCart, setBudgetCart] = useState<string[]>([]);
  const [walkCart, setWalkCart] = useState<string[]>([]);
  const [orderPlacements, setOrderPlacements] = useState<(string | null)[]>([null, null, null, null, null]);
  const [planChoice, setPlanChoice] = useState<string | null>(null);
  // Перетаскивание пальцем — та же техника, что и кормление на кухне
  // (Kitchen.tsx): Pointer Events вместо нативного HTML5 drag-and-drop,
  // который на Android почти не работает без долгого нажатия.
  const rootRef = useRef<HTMLDivElement>(null);
  const dnd = usePointerDrag(rootRef, (id, from, zone) => handleDrop(id, from, zone));
  const dragging = dnd.drag;
  // Порядок карточек в лотках перемешиваем один раз при открытии урока —
  // иначе правильные варианты всегда стоят в одних и тех же местах, и
  // ребёнок запоминает позицию, а не думает над заданием.
  const [practiceTray] = useState(() => shuffleArray(practiceItems));
  const [budgetTray] = useState(() => shuffleArray(budgetItems));
  const [walkTray] = useState(() => shuffleArray(walkItems));
  const [orderTray] = useState(() => shuffleArray(orderItems));
  // Результат последней проверки: 'correct' на короткое время перед переходом
  // к следующей сцене (показываем галочку), 'wrong' блокирует переход и
  // держит подсказку на экране, пока задание не решено верно.
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [mistakeScenes, setMistakeScenes] = useState<number[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewNotice, setReviewNotice] = useState(false);
  // Счётчик, чтобы переигрывать CSS-анимацию (тряска/галочка) даже если
  // результат проверки не изменился (два неверных подряд и т.п.).
  const [checkPulse, setCheckPulse] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lessonCompletedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Подсказка должна быть краткой обратной связью, а не постоянным
  // предупреждением: закрываем её через 3 секунды после показа/обновления.
  useEffect(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (hintText) hintTimerRef.current = setTimeout(() => setHintText(null), 3000);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [hintText]);

  useEffect(() => {
    scenes.forEach((source) => {
      const image = new Image();
      image.src = source;
    });
  }, []);

  // По окончании видео не пытаемся поймать "тот самый последний кадр" —
  // ловить живой кадр через canvas оказалось ненадёжно (WebView иногда даёт
  // пустой/чёрный результат). Вместо этого просто отматываем видео обратно
  // на самый первый кадр — тот же кадр, что и так надёжно показывается
  // блюром ДО старта воспроизведения — и показываем его тем же самым
  // блюром.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function onEnded() {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      setWatched(true);
    }
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
  }

  function returnToTray(id: string) {
    setPlacements((current) => current.map((value) => value === id ? null : value));
  }

  function addToBudgetCart(id: string) {
    setBudgetCart((current) => {
      const item = budgetItems.find((entry) => entry.id === id);
      const nextTotal = current.reduce((total, value) => total + (budgetItems.find((entry) => entry.id === value)?.price ?? 0), 0) + (item?.price ?? 0);
      return !item || current.includes(id) || current.length >= 3 || nextTotal > 100 ? current : [...current, id];
    });
  }

  function removeFromBudgetCart(id: string) {
    setBudgetCart((current) => current.filter((value) => value !== id));
  }

  // Корзина упражнения "Найди лишнее" — до 3 предметов, без денежного лимита
  // (тут проверяется не бюджет, а нужность вещи для прогулки).
  function addToWalkCart(id: string) {
    setWalkCart((current) => (current.includes(id) || current.length >= 3 ? current : [...current, id]));
  }

  function removeFromWalkCart(id: string) {
    setWalkCart((current) => current.filter((value) => value !== id));
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
  }

  function returnOrderItemToTray(id: string) {
    setOrderPlacements((current) => current.map((value) => value === id ? null : value));
  }

  // Выбор ответа на вопрос "Что сделать?" — одиночный выбор варианта, без
  // перетаскивания (см. мокап "Появилась новая нужная трата").
  function choosePlanOption(id: string) {
    setPlanChoice(id);
  }

  // Единая точка "куда бросили карточку" для всех упражнений — вызывается
  // после реального перетаскивания (см. usePointerDrag). Зона определяется
  // по атрибуту data-drop того элемента, над которым отпустили палец.
  const handleDrop: DropHandler = (id, _from, zone) => {
    if (!zone) return;
    if (zone.startsWith('cat-')) { placeItem(Number(zone.slice(4)), id); return; }
    if (zone === 'tray-categorize') { returnToTray(id); return; }
    if (zone === 'budget-tray') { if (budgetCart.includes(id)) removeFromBudgetCart(id); return; }
    if (zone === 'budget-cart') { addToBudgetCart(id); return; }
    if (zone === 'walk-tray') { if (walkCart.includes(id)) removeFromWalkCart(id); return; }
    if (zone === 'walk-cart') { addToWalkCart(id); return; }
    if (zone.startsWith('order-slot-')) { placeOrderItem(Number(zone.slice('order-slot-'.length)), id); return; }
    if (zone === 'order-tray') { returnOrderItemToTray(id); return; }
  };

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
      // "Найди лишнее": в корзину — вода, лекарство и игрушка, остальное остаётся.
      const required = ['walk-water', 'walk-medicine', 'walk-toy'];
      return walkCart.length === 3 && required.every((id) => walkCart.includes(id));
    }
    if (scene === ORDER_SCENE_INDEX) {
      // "Расставь шаги": баланс -> обязательное -> покупка -> остаток -> желание.
      return orderPlacements[0] === 'order-balance' && orderPlacements[1] === 'order-find' && orderPlacements[2] === 'order-buy' && orderPlacements[3] === 'order-remainder' && orderPlacements[4] === 'order-toy';
    }
    if (scene === PLAN_SCENE_INDEX) {
      // "Появилась новая нужная трата": находим деньги, уменьшив развлечения.
      return planChoice === 'reduce-fun';
    }
    // "Разложи расходы": еда -> обязательное, копилка -> накопления, игрушка -> желания.
    return placements[0] === 'food' && placements[1] === 'savings' && placements[2] === 'toy';
  }

  function goToNextScene() {
    setScene((value) => value + 1);
    setPlacements([null, null, null]);
    setWalkCart([]);
    setOrderPlacements([null, null, null, null, null]);
    setPlanChoice(null);
    setCheckState('idle');
    setHintText(null);
  }

  function hasAttempt(): boolean {
    if (scene === WALK_SCENE_INDEX) return walkCart.length > 0;
    if (scene === ORDER_SCENE_INDEX) return orderPlacements.some(Boolean);
    if (scene === PLAN_SCENE_INDEX) return planChoice !== null;
    if (scene === 1) return budgetCart.length > 0;
    return placements.some(Boolean);
  }

  function resetSceneInputs() {
    setPlacements([null, null, null]);
    setBudgetCart([]);
    setWalkCart([]);
    setOrderPlacements([null, null, null, null, null]);
    setPlanChoice(null);
    setCheckState('idle');
    setHintText(null);
  }

  function handleCheck() {
    if (checkState === 'correct') return;
    if (!hasAttempt()) {
      setHintText('Сначала попробуй выполнить задание.');
      return;
    }
    if (isSceneCorrect()) {
      onPracticeComplete?.();
      setHintText(null);
      setCheckState('correct');
      playCorrectAnswerSound();
      setCheckPulse((value) => value + 1);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        if (reviewMode) {
          const remaining = mistakeScenes.filter((value) => value !== scene);
          setMistakeScenes(remaining);
          if (remaining.length > 0) {
            setScene(remaining[0]);
            resetSceneInputs();
          } else {
            lessonCompletedRef.current = true;
            onFinish(scenes.length - mistakeScenes.length);
          }
        } else if (scene < scenes.length - 1) goToNextScene(); else if (mistakeScenes.length > 0) {
          setReviewNotice(true);
          advanceTimerRef.current = setTimeout(() => {
            setReviewNotice(false);
            setReviewMode(true);
            setScene(mistakeScenes[0]);
            resetSceneInputs();
          }, 1800);
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

  // Кнопка "назад"/выход из урока — прогресс не сохраняется, кроме случая,
  // когда урок уже пройден целиком (тогда onBack уже вызван выше).
  function requestExit() {
    if (lessonCompletedRef.current) {
      onBack();
      return;
    }
    setShowExitConfirm(true);
  }

  function toggleHint() {
    setHintText((current) => (current ? null : sceneHints[scene] ?? null));
  }

  if (phase === 'video') {
    // До старта и после конца видео показываем один и тот же блюр первого
    // кадра (preload="metadata"), просто отматывая видео обратно на
    // currentTime = 0 по событию 'ended' — так надёжнее, чем ловить "тот
    // самый последний кадр" через canvas (не работает в некоторых Android
    // WebView).
    const showBlurred = watched || !playing;
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#17152f]">
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${showBlurred ? 'scale-105 blur-xl opacity-60' : ''}`}
        />
        {watched && <div className="absolute inset-0 bg-[#17152f]/25 [animation:lessonFadeIn_500ms_ease-out]" />}
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
      <style>{`@keyframes lessonSceneIn{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}@keyframes lessonItemIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes lessonShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}}@keyframes lessonCheckIn{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}@keyframes lessonFadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <img key={scene} src={scenes[scene]} alt="Фон практического задания" className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center [animation:lessonSceneIn_420ms_ease-out]" />

      {/* Кнопка назад повторяет шапку разделов на главной */}
      <button aria-label="Назад к урокам" onClick={requestExit} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>

      <div className="absolute left-1/2 top-[2.8%] z-20 flex h-[6%] w-[44%] -translate-x-1/2 items-center rounded-full border border-white/30 bg-[#4d497d]/55 px-[5%] shadow-[0_4px_14px_rgba(50,42,110,.25)] backdrop-blur-md">
          <div className="relative flex w-full items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/45" />
            <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#675ff3] transition-[width] duration-500" style={{ width: `${(scene / (scenes.length - 1)) * 100}%` }} />
            {scenes.map((_, index) => (
              <span
                key={index}
                className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white/55 transition ${mistakeScenes.includes(index) ? 'bg-[#f6c84c] shadow-[0_0_0_2px_rgba(246,200,76,.4)]' : index === scene ? 'bg-white shadow-[0_0_0_2px_rgba(114,106,255,.75),0_0_10px_3px_rgba(255,255,255,.85)]' : index < scene ? 'bg-[#675ff3]' : 'bg-[#817b98]'}`}
            />
          ))}
        </div>
      </div>

      {reviewNotice && <div className="absolute left-1/2 top-[11%] z-30 -translate-x-1/2 rounded-full bg-[#fff7d6] px-4 py-2 text-center text-[12px] font-black text-[#9a6d08] shadow-[0_5px_16px_rgba(116,84,10,.2)] [animation:lessonFadeIn_220ms_ease-out]">Работа над ошибками — закрепляем навык</div>}

      {sceneInstructions[scene] && (
        <div key={`instruction-${scene}`} className="absolute left-1/2 top-[28.5%] z-10 w-[88%] -translate-x-1/2 rounded-[16px] bg-white/90 px-3 py-2 text-center shadow-[0_4px_14px_rgba(80,63,40,.14)] backdrop-blur-sm [animation:lessonFadeIn_260ms_ease-out]">
          <p className="text-[clamp(11px,3.2vw,13px)] font-bold leading-snug text-[#5a6a92]">{sceneInstructions[scene]}</p>
        </div>
      )}

      {/* Круглая кнопка книги — единственный дополнительный элемент на чистом фоне */}
      <button aria-label="Вернуться к анимационному уроку" onClick={() => { setPhase('video'); setWatched(false); setPlaying(false); if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.pause(); } }} className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5b4cf0] text-white shadow-[0_6px_18px_rgba(74,60,205,.38)] transition active:scale-95"><IconBook className="h-7 w-7" /></button>

      <div key={checkPulse} className={`absolute left-[5%] right-[5%] top-[37%] bottom-[17%] z-10 grid grid-cols-3 grid-rows-[minmax(0,1.18fr)_minmax(0,.82fr)] gap-2.5 ${checkState === 'wrong' ? '[animation:lessonShake_420ms_ease-in-out]' : ''}`}>
        {scene === 1 ? <div className="col-span-3 row-span-2 grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out]">
          <div className="mx-auto flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[#17469d] shadow-sm"><img src={coinIcon} alt="" className="h-8 w-8" /><span className="text-[clamp(13px,3.8vw,19px)] font-black">Баланс: {budgetBalance}</span></div>
          <div data-drop="budget-tray" className="grid min-h-0 grid-cols-4 gap-2">
            {budgetTray.filter((item) => !budgetCart.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} dnd={dnd} onDrop={handleDrop} isDragging={dragging?.id === item.id} onClick={() => addToBudgetCart(item.id)} />)}
          </div>
          <div data-drop="budget-cart" className="grid min-w-0 grid-cols-[1.25fr_2.8fr_auto] items-center gap-2 overflow-hidden rounded-2xl bg-[#fff3df] p-2">
            <div className="flex min-w-0 flex-col items-center text-center"><img src={basketIcon} alt="Корзина" className="h-20 w-24 object-contain" /><span className="max-w-full whitespace-nowrap text-[clamp(8px,1.8vw,10px)] font-black tracking-[-0.03em] text-[#17469d]">Твоя корзина</span></div>
            <div className="grid min-w-0 grid-cols-3 gap-1.5">{[0, 1, 2].map((slot) => { const item = budgetItems.find((entry) => entry.id === budgetCart[slot]); return <button type="button" key={slot} onPointerDown={(e) => item && dnd.start(e, item.id, null)} onPointerMove={dnd.move} onPointerUp={(e) => dnd.end(e, handleDrop)} onPointerCancel={dnd.cancel} onClick={() => item && removeFromBudgetCart(item.id)} className={`flex aspect-square min-w-0 touch-none select-none items-center justify-center rounded-xl border-2 border-dashed border-[#87cfe0] bg-[#fffaf3] p-1 ${item ? 'cursor-grab active:cursor-grabbing active:scale-95' : ''}`}>{item && <img src={item.image} alt={item.label} className="h-full w-full object-contain" />}</button>; })}</div>
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
            <div data-drop="walk-tray" className="grid min-h-0 grid-cols-3 grid-rows-2 gap-2">
              {walkTray.filter((item) => !walkCart.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} dnd={dnd} onDrop={handleDrop} isDragging={dragging?.id === item.id} onClick={() => addToWalkCart(item.id)} />)}
            </div>
            <div data-drop="walk-cart" className="grid min-w-0 grid-cols-[1fr_2.6fr_auto] items-center gap-2 overflow-hidden rounded-2xl bg-[#fff3df] p-1.5">
              <div className="flex min-w-0 items-center justify-center"><img src={basketIcon} alt="Корзина" className="h-14 w-16 object-contain" /></div>
              <div className="grid min-w-0 grid-cols-3 gap-1.5">{[0, 1, 2].map((slot) => { const item = walkItems.find((entry) => entry.id === walkCart[slot]); return <button type="button" key={slot} onPointerDown={(e) => item && dnd.start(e, item.id, null)} onPointerMove={dnd.move} onPointerUp={(e) => dnd.end(e, handleDrop)} onPointerCancel={dnd.cancel} onClick={() => item && removeFromWalkCart(item.id)} className={`flex aspect-square min-w-0 touch-none select-none items-center justify-center rounded-xl border-2 border-dashed border-[#87cfe0] bg-[#fffaf3] p-1 ${item ? 'cursor-grab active:cursor-grabbing active:scale-95' : ''}`}>{item && <img src={item.image} alt={item.label} className="h-full w-full object-contain" />}</button>; })}</div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-[clamp(13px,3.6vw,17px)] font-black text-[#17469d]">{walkCart.length}/3</div>
            </div>
          </div>
        ) : scene === ORDER_SCENE_INDEX ? (
          /* Упражнение 4 — "Расставь шаги!" (редизайн по мокапу): сверху 5
             пронумерованных пустых слотов по порядку, снизу — лоток с
             цветными плашками-действиями (полными фразами, как в
             референсе), которые перетаскиваются или тапаются по очереди. */
          <div className="col-span-3 row-span-2 mt-[3%] grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2.5 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out]">
            <div className="grid min-h-0 grid-cols-5 gap-1.5">
              {orderSlots.map((slotDef, index) => {
                const item = orderItems.find((entry) => entry.id === orderPlacements[slotDef.slot]);
                return (
                  <div key={`slot-${slotDef.slot}`} data-drop={`order-slot-${slotDef.slot}`} className="flex min-h-0 flex-col items-center gap-1">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#cbbfa0] bg-white text-[11px] font-black text-[#7a7260]">{index + 1}</span>
                    <div className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-0.5 ${item ? 'border-transparent' : 'border-[#d8cdb8] bg-white/40'}`} style={item ? { background: item.bg, borderColor: item.fg } : undefined}>
                      {item && <div onPointerDown={(e) => dnd.start(e, item.id, slotDef.slot)} onPointerMove={dnd.move} onPointerUp={(e) => dnd.end(e, handleDrop)} onPointerCancel={dnd.cancel} onClick={() => returnOrderItemToTray(item.id)} className="flex h-full w-full cursor-grab touch-none select-none flex-col items-center justify-center gap-0.5 active:cursor-grabbing active:scale-95">
                        <img src={item.image} alt="" className="h-[45%] w-[45%] object-contain" />
                        <span className="max-w-full truncate px-0.5 text-[clamp(6.5px,1.7vw,8px)] font-black leading-none" style={{ color: item.fg }}>{item.shortLabel}</span>
                      </div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div data-drop="order-tray" className="flex min-h-0 flex-col gap-1.5 overflow-y-auto rounded-[18px] bg-white/55 p-1.5">
              {orderTray.filter((item) => !orderPlacements.includes(item.id)).map((item) => (
                <div
                  key={item.id}
                  onPointerDown={(e) => dnd.start(e, item.id, null)}
                  onPointerMove={dnd.move}
                  onPointerUp={(e) => dnd.end(e, handleDrop)}
                  onPointerCancel={dnd.cancel}
                  onClick={() => placeOrderItem(orderPlacements.findIndex((value) => value === null), item.id)}
                  className={`flex min-h-0 shrink-0 touch-none select-none cursor-grab items-center gap-2 rounded-[16px] px-3 py-2 shadow-sm transition-all duration-200 active:cursor-grabbing active:scale-[.98] ${dragging?.id === item.id ? 'opacity-0' : 'animate-[lessonItemIn_220ms_ease-out]'}`}
                  style={{ background: item.bg }}
                >
                  <img src={item.image} alt="" className="h-5 w-5 shrink-0 object-contain" />
                  <span className="min-w-0 flex-1 text-[clamp(10.5px,3vw,12.5px)] font-black leading-tight" style={{ color: item.fg }}>{item.label}</span>
                  <span aria-hidden className="grid shrink-0 grid-cols-2 gap-[2px] opacity-40" style={{ color: item.fg }}>
                    {Array.from({ length: 6 }).map((_, i) => <span key={i} className="h-1 w-1 rounded-full bg-current" />)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : scene === PLAN_SCENE_INDEX ? (
          /* Упражнение 5 — "Появилась новая нужная трата!" (редизайн по
             мокапу): план на месяц из 3 статей, карточка новой траты
             (лекарство) и вопрос "Что сделать?" с тремя вариантами ответа —
             вместо перетаскивания жетона теперь выбор одного варианта. */
          <div className="col-span-3 row-span-2 mt-[1%] flex min-h-0 flex-col gap-1.5 overflow-y-auto rounded-[22px] border border-white/70 bg-[#fffaf3] p-2.5 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out]">
            <div className="flex shrink-0 items-center justify-between px-0.5">
              <span className="text-[clamp(11px,3.2vw,13px)] font-black text-[#17469d]">Мой план на месяц</span>
              <span className="flex items-center gap-1 text-[clamp(12px,3.5vw,14px)] font-black text-[#c9862a]"><img src={coinIcon} alt="" className="h-4 w-4 object-contain" />{planItems.reduce((total, cat) => total + cat.base, 0)}</span>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-1.5">
              {planItems.map((cat) => (
                <div key={cat.id} className="flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-white/85 p-1.5 shadow-sm">
                  <img src={cat.image} alt="" className="h-7 w-7 object-contain" />
                  <span className="max-w-full truncate text-[clamp(7.5px,1.9vw,9px)] font-black leading-none text-[#5a4a3a]">{cat.label}</span>
                  <span className="flex items-center gap-0.5 text-[clamp(8px,2vw,10px)] font-black text-[#17469d]"><img src={coinIcon} alt="" className="h-3 w-3 object-contain" />{cat.base}</span>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-[14px] border border-[#f3b8c6] bg-[#fdeaef] px-2.5 py-1.5">
              <img src={medicineIcon} alt="" className="h-9 w-9 shrink-0 object-contain" />
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-[clamp(8px,2.2vw,9.5px)] font-black uppercase tracking-wide text-[#d1497a]">Новая нужная трата</span>
                <span className="truncate text-[clamp(10px,2.9vw,12px)] font-black text-[#5a3a45]">{PLAN_EXPENSE_LABEL}</span>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 text-[clamp(11px,3.2vw,13px)] font-black text-[#17469d]"><img src={coinIcon} alt="" className="h-3.5 w-3.5 object-contain" />{PLAN_EXPENSE_COST}</span>
            </div>
            <span className="shrink-0 px-0.5 text-[clamp(10.5px,3vw,12.5px)] font-black text-[#5a6a92]">Что сделать?</span>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              {planOptions.map((option) => {
                const selected = planChoice === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => choosePlanOption(option.id)}
                    className={`flex min-h-0 flex-1 items-center gap-2.5 rounded-[14px] bg-white/85 px-2.5 shadow-sm transition active:scale-[.98] ${selected ? 'ring-[3px] ring-[#675ff3]' : ''}`}
                  >
                    <img src={option.image} alt="" className="h-8 w-8 shrink-0 object-contain" />
                    <span className="min-w-0 flex-1 text-left text-[clamp(10.5px,3vw,12.5px)] font-black leading-tight text-[#17469d]">{option.label}</span>
                  </button>
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
          return <div key={category.label} data-drop={`cat-${category.slot}`} className={`flex min-h-0 flex-col items-center overflow-hidden rounded-[20px] ${category.color} p-2 shadow-[0_4px_12px_rgba(85,71,100,.14)] animate-[lessonItemIn_220ms_ease-out]`}>
            <div className="flex min-w-0 max-w-full flex-col items-center gap-1 text-center" style={{ color: category.titleColor }}><img src={category.icon} alt="" className="h-12 w-12 shrink-0 object-contain" /><span className="block max-w-full whitespace-nowrap text-[clamp(8px,2.2vw,10px)] font-black leading-none tracking-[-0.03em]">{category.label}</span></div>
            <div className="mt-2 flex aspect-square w-[88%] flex-none items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-white/10 p-1" style={{ borderColor: category.border }}>
              {item && <div onPointerDown={(e) => dnd.start(e, item.id, category.slot)} onPointerMove={dnd.move} onPointerUp={(e) => dnd.end(e, handleDrop)} onPointerCancel={dnd.cancel} onClick={() => returnToTray(item.id)} className="flex h-full w-full cursor-grab touch-none select-none items-center justify-center overflow-hidden rounded-lg bg-white/80 active:cursor-grabbing active:scale-95"><img src={item.image} alt={item.label} className="h-full w-full object-contain p-1" /></div>}
            </div>
          </div>;
        })}
        <div data-drop="tray-categorize" className="col-span-3 grid min-h-0 grid-cols-3 gap-2 rounded-[22px] bg-white/55 p-2">
          {practiceTray.filter((item) => !placements.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} dnd={dnd} onDrop={handleDrop} isDragging={dragging?.id === item.id} onClick={() => placeItem(placements.findIndex((value) => value === null), item.id)} />)}
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
      <LessonHintBubble text={hintText} />

      <div className="absolute bottom-[3.5%] left-[4%] right-[4%] z-20 flex items-center gap-[6%]">
        <button type="button" aria-label="Подсказка" onClick={toggleHint} className="flex h-14 w-[45%] min-w-0 shrink-0 items-center justify-center gap-3 rounded-[30px] bg-white/95 px-3 text-[clamp(14px,4.2vw,16px)] font-extrabold text-[#16449b] shadow-[0_6px_18px_rgba(80,63,120,.16)] backdrop-blur-sm transition active:scale-[.98]">
          <span className="flex h-[clamp(36px,10vw,41px)] w-[clamp(36px,10vw,41px)] shrink-0 items-center justify-center rounded-full bg-[#6355f0] text-[clamp(21px,6vw,25px)] shadow-[0_3px_8px_rgba(72,58,200,.35)]">💡</span>
          <span className="whitespace-nowrap">Подсказка</span>
        </button>
        <button type="button" aria-label="Проверить" disabled={checkState === 'correct'} onClick={handleCheck} className="h-14 min-w-0 flex-1 rounded-[30px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] px-2 text-[clamp(18px,5.8vw,22px)] font-extrabold text-white shadow-[0_7px_18px_rgba(80,65,215,.38)] transition active:scale-[.98] disabled:opacity-70">Проверить</button>
      </div>

      {showExitConfirm && <ExitConfirm onStay={() => setShowExitConfirm(false)} onExit={onBack} />}

      {/* Плавающая копия карточки — следует за пальцем поверх экрана, та же
          техника, что и у еды на кухне (Kitchen.tsx). Показывается только
          когда палец реально сдвинулся (dragging.moved), иначе это простой
          тап и работает обычный onClick карточки. */}
      {dragging?.moved && (() => {
        const dragged = dragItemLookup.find((entry) => entry.id === dragging.id);
        if (dragged) {
          return (
            <DragCardPreview
              image={dragged.image}
              label={dragged.label}
              detail={dragged.price !== undefined ? `${dragged.price} монет` : undefined}
              x={dragging.x}
              y={dragging.y}
            />
          );
        }
        return null;
      })()}
    </div>
  );
}
