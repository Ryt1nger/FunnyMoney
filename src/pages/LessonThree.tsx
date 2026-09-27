import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/lesson2/lesson-video.mp4';
import scene1 from '../assets/lesson3/practice-1.jpg';
import scene2 from '../assets/lesson3/practice-2.jpg';
import scene3 from '../assets/lesson3/practice-3.jpg';
import scene4 from '../assets/lesson3/practice-4.jpg';
import scene5 from '../assets/lesson3/practice-5.jpg';
import { IconArrowLeft, IconBook } from '../components/icons';
import coinIcon from '../assets/lesson3/ui/coin.png';
import coinsIcon from '../assets/lesson3/ui/coins.png';
import bulbIcon from '../assets/lesson3/ui/bulb.png';
import radioIcon from '../assets/lesson3/ui/radio.png';
import radioOnIcon from '../assets/lesson3/ui/radio-on.png';
import checkboxIcon from '../assets/lesson3/ui/checkbox.png';
import slotPlusIcon from '../assets/lesson3/ui/slot-plus.png';
import scaleBarImg from '../assets/lesson3/ui/scale-bar.png';
import basketIcon from '../assets/lesson3/items/basket.png';
import foodDogIcon from '../assets/lesson3/items/food-dog.png';
import foodCatIcon from '../assets/lesson3/items/food-cat.png';
import vitaminsIcon from '../assets/lesson3/items/vitamins.png';
import brushIcon from '../assets/lesson3/items/brush.png';
import chocolateIcon from '../assets/lesson3/items/chocolate.png';
import canIcon from '../assets/lesson3/items/can.png';
import shampooIcon from '../assets/lesson3/items/shampoo.png';
import ballIcon from '../assets/lesson3/items/ball.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';
import { usePointerDrag } from '../hooks/usePointerDrag';
import DragCardPreview from '../components/DragCardPreview';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void; onPracticeComplete?: () => void }

// Третий урок — «Планируем покупку и сравниваем варианты». Каркас тот же, что
// у уроков 1–2 (видео → практика, шапка с прогрессом, кнопка «книга», нижняя
// панель «Подсказка / Проверить»). Видео пока то же, что во втором уроке.
// Диалоговые облачка рядом с медведем не верстаются — фон каждой сцены это
// готовая картинка (см. assets/lesson3/practice-N.jpg).
const scenes = [scene1, scene2, scene3, scene4, scene5];

interface Good { id: string; label: string; price: number; image: string }

// Упражнение 1 — «Сравнение по карточкам»: какой корм дешевле.
const foodCards = [
  { id: 'a', label: 'Корм A', weight: '1 кг', price: 20, image: foodDogIcon, tint: '#e2f2fb' },
  { id: 'b', label: 'Корм B', weight: '1 кг', price: 35, image: foodCatIcon, tint: '#fdeaf0' },
] as const;
const CHEAPER_FOOD = foodCards.reduce((min, card) => (card.price < min.price ? card : min)).id;

// Упражнение 2 — «Покупки по списку»: бюджет 40, в списке витамины и расчёска,
// шоколадка — лишняя.
const LIST_BUDGET = 40;
const CART_SLOTS = 3;
const vitamins: Good = { id: 'vitamins', label: 'Витамины', price: 15, image: vitaminsIcon };
const brush: Good = { id: 'brush', label: 'Расчёска', price: 20, image: brushIcon };
const chocolate: Good = { id: 'chocolate', label: 'Шоколадка', price: 15, image: chocolateIcon };
const shoppingList = [vitamins, brush];
const listGoods = [vitamins, brush, chocolate];

// Упражнение 3 — «Сравни две корзины»: где итого меньше.
const food: Good = { id: 'food', label: 'Корм', price: 20, image: foodDogIcon };
const basketA: Good[] = [food, { id: 'shampoo-a', label: 'Шампунь', price: 25, image: shampooIcon }];
const basketB: Good[] = [food, { id: 'shampoo-b', label: 'Шампунь', price: 15, image: shampooIcon }];
const sumPrices = (goods: Good[]) => goods.reduce((sum, good) => sum + good.price, 0);
const CHEAPER_BASKET = sumPrices(basketA) <= sumPrices(basketB) ? 'a' : 'b';

// Упражнение 4 — «Шкала корзины»: лимит 30 монет.
const SCALE_LIMIT = 30;
const scaleGoods: Good[] = [
  { id: 'soup', label: 'Суп', price: 15, image: canIcon },
  { id: 'shampoo', label: 'Шампунь', price: 10, image: shampooIcon },
  { id: 'toy', label: 'Игрушка', price: 20, image: ballIcon },
];

// Упражнение 5 — «Проверка перед кассой»: в корзине лишняя игрушка.
const checkoutList: Good[] = [
  { id: 'food', label: 'Корм', price: 20, image: foodDogIcon },
  { id: 'shampoo', label: 'Шампунь', price: 15, image: shampooIcon },
];
const checkoutBasket: Good[] = [...checkoutList, { id: 'toy', label: 'Игрушка', price: 20, image: ballIcon }];

const sceneHints = [
  'Сравни цены: какой корм стоит меньше монет? Он выгоднее.',
  `Покупай только то, что в списке: витамины и расчёску. Шоколадки в списке нет. Бюджет — ${LIST_BUDGET} монет.`,
  'Сложи цены в каждой корзине. Где «Итого» меньше — там покупки дешевле.',
  `Следи за шкалой: сумма покупок не должна быть больше ${SCALE_LIMIT} монет. Положи в корзину хотя бы один товар.`,
  'В списке только корм и шампунь. Найди в корзине лишний товар и убери его.',
];

const dragLookup: Good[] = [...listGoods, ...scaleGoods];

function Price({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center gap-1 font-black text-[#c9862a] ${className}`}>
      <img src={coinIcon} alt="" className="h-[1.15em] w-[1.15em] object-contain" />{value}
    </span>
  );
}

function Radio({ on }: { on: boolean }) {
  return <img src={on ? radioOnIcon : radioIcon} alt="" className="h-[clamp(26px,7.5vw,34px)] w-[clamp(26px,7.5vw,34px)] shrink-0 object-contain" />;
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

/** Третий урок: видео и практика (5 экранов). */
export default function LessonThree({ onBack, onPracticeComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [pick, setPick] = useState<string | null>(null); // сцены 1 и 3
  const [cart, setCart] = useState<string[]>([]); // сцены 2 и 4
  const [removed, setRemoved] = useState<string[]>([]); // сцена 5
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [checkPulse, setCheckPulse] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lessonCompletedRef = useRef(false);
  const lastDragEndRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const dnd = usePointerDrag(rootRef);
  const videoRef = useRef<HTMLVideoElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pauseBackgroundMusic();
    return () => startBackgroundMusic();
  }, []);

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

  const cartLimit = CART_SLOTS;
  const goodsOfScene = scene === 1 ? listGoods : scaleGoods;
  const cartGoods = cart.map((id) => goodsOfScene.find((good) => good.id === id)).filter((good): good is Good => Boolean(good));
  const cartTotal = sumPrices(cartGoods);

  function addToCart(id: string) {
    setCart((current) => (current.includes(id) || current.length >= cartLimit ? current : [...current, id]));
  }
  function removeFromCart(id: string) {
    setCart((current) => current.filter((value) => value !== id));
  }
  function toggleCart(id: string) {
    // тап сразу после перетаскивания — это то же самое действие, второй раз не повторяем
    if (Date.now() - lastDragEndRef.current < 350) return;
    setCart((current) => (current.includes(id) ? current.filter((value) => value !== id) : current.length >= cartLimit ? current : [...current, id]));
  }
  function toggleRemoved(id: string) {
    setRemoved((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function handleDrop(id: string, _from: number | null, zone: string | null) {
    if (zone === 'cart') addToCart(id);
  }

  function isSceneCorrect(): boolean {
    if (scene === 0) return pick === CHEAPER_FOOD;
    if (scene === 1) {
      const need = shoppingList.map((good) => good.id);
      return cart.length === need.length && need.every((id) => cart.includes(id)) && cartTotal <= LIST_BUDGET;
    }
    if (scene === 2) return pick === CHEAPER_BASKET;
    if (scene === 3) return cart.length > 0 && cartTotal <= SCALE_LIMIT;
    const kept = checkoutBasket.filter((good) => !removed.includes(good.id)).map((good) => good.id);
    const need = checkoutList.map((good) => good.id);
    return kept.length === need.length && need.every((id) => kept.includes(id));
  }

  function goToNextScene() {
    setScene((value) => value + 1);
    setPick(null);
    setCart([]);
    setRemoved([]);
    setCheckState('idle');
    setHintText(null);
  }

  function handleCheck() {
    if (checkState === 'correct') return;
    if (isSceneCorrect()) {
      onPracticeComplete?.();
      setHintText(null);
      setCheckState('correct');
      setCheckPulse((value) => value + 1);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        if (scene < scenes.length - 1) goToNextScene(); else { lessonCompletedRef.current = true; onBack(); }
      }, 700);
    } else {
      setCheckState('wrong');
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

  // Это функции-рендеры, а не вложенные компоненты: иначе карточка перемонтируется
  // на каждом движении пальца и перетаскивание обрывается.
  // Карточка товара, которую можно тапнуть или перетащить в корзину (сцены 2 и 4)
  function renderGoodCard(good: Good) {
    const inCart = cart.includes(good.id);
    return (
      <button
        key={good.id}
        type="button"
        onPointerDown={(e) => !inCart && dnd.start(e, good.id, null)}
        onPointerMove={dnd.move}
        onPointerUp={(e) => { if (dnd.drag?.moved) lastDragEndRef.current = Date.now(); dnd.end(e, handleDrop); }}
        onPointerCancel={dnd.cancel}
        onClick={() => toggleCart(good.id)}
        className={`flex h-full w-full min-h-0 min-w-0 touch-none select-none cursor-grab flex-col items-center justify-between gap-0.5 rounded-[15px] bg-white/90 p-1 text-center shadow-[0_3px_8px_rgba(83,65,90,.12)] transition-all duration-200 active:scale-95 animate-[lessonItemIn_220ms_ease-out] ${inCart ? 'opacity-40' : ''}`}
      >
        <div className="flex min-h-0 w-full flex-1 items-center justify-center"><img src={good.image} alt="" draggable={false} className="h-full w-full object-contain p-0.5" /></div>
        <span className="line-clamp-1 w-full shrink-0 text-[clamp(9px,2.6vw,11.5px)] font-extrabold leading-[1.15] text-[#17469d]">{good.label}</span>
        <Price value={good.price} className="text-[clamp(10px,3vw,13px)]" />
      </button>
    );
  }

  // Корзина с тремя слотами (сцены 2 и 4); справа — подпись-счётчик
  function renderCartRow(title: string, counter: string, over?: boolean) {
    return (
      <div data-drop="cart" className="flex min-h-0 flex-[0.85] items-center gap-2 rounded-[18px] bg-[#fdeaea] p-2">
        <div className="flex h-full w-[22%] shrink-0 flex-col items-center justify-center gap-0.5">
          <img src={basketIcon} alt="" className="min-h-0 w-full flex-1 object-contain" />
          <span className="w-full text-center text-[clamp(7.5px,2.1vw,9.5px)] font-black leading-tight text-[#d1364e]">{title}</span>
        </div>
        <div className="grid h-full min-h-0 flex-1 grid-cols-3 gap-1.5">
          {Array.from({ length: CART_SLOTS }, (_, slot) => {
            const good = cartGoods[slot];
            return good ? (
              <button type="button" key={good.id} onClick={() => removeFromCart(good.id)} className="flex h-full min-h-0 min-w-0 items-center justify-center rounded-xl bg-white/90 p-1 shadow-sm transition active:scale-95 animate-[lessonItemIn_200ms_ease-out]">
                <img src={good.image} alt={good.label} draggable={false} className="h-full w-full object-contain" />
              </button>
            ) : (
              <img key={`empty-${slot}`} src={slotPlusIcon} alt="" draggable={false} className="h-full w-full min-h-0 object-contain" />
            );
          })}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[clamp(10.5px,3.1vw,13px)] font-black shadow-sm ${over ? 'bg-[#fde3e3] text-[#c23b3b]' : 'bg-white/90 text-[#4a3f2c]'}`}>{counter}</span>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden bg-[#fbefe1]">
      <style>{`@keyframes lessonSceneIn{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}@keyframes lessonItemIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes lessonShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}}@keyframes lessonCheckIn{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}@keyframes lessonFadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <img key={scene} src={scenes[scene]} alt="" className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-top [animation:lessonSceneIn_420ms_ease-out]" />

      <button aria-label="Назад к урокам" onClick={requestExit} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>

      <div className="absolute left-1/2 top-[2.8%] z-20 flex h-[6%] w-[44%] -translate-x-1/2 items-center rounded-full border border-white/30 bg-[#4d497d]/55 px-[5%] shadow-[0_4px_14px_rgba(50,42,110,.25)] backdrop-blur-md">
        <div className="relative flex w-full items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/45" />
          <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#675ff3] transition-[width] duration-500" style={{ width: `${(scene / (scenes.length - 1)) * 100}%` }} />
          {scenes.map((_, index) => (
            <span key={index} className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white/55 transition ${index === scene ? 'bg-white shadow-[0_0_0_2px_rgba(114,106,255,.75),0_0_10px_3px_rgba(255,255,255,.85)]' : index < scene ? 'bg-[#675ff3]' : 'bg-[#817b98]'}`} />
          ))}
        </div>
      </div>

      <button aria-label="Вернуться к анимационному уроку" onClick={() => { setPhase('video'); setWatched(false); setPlaying(false); if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.pause(); } }} className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5b4cf0] text-white shadow-[0_6px_18px_rgba(74,60,205,.38)] transition active:scale-95"><IconBook className="h-7 w-7" /></button>

      <div key={checkPulse} className={`absolute left-[5%] right-[5%] top-[37%] bottom-[17%] z-10 flex flex-col gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out] ${checkState === 'wrong' ? '[animation:lessonShake_420ms_ease-in-out]' : ''}`}>
        {scene === 0 && (
          // Экран 1 — «Сравнение по карточкам»: два корма, выбрать более выгодный
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
            {foodCards.map((card) => (
              <button key={card.id} type="button" onClick={() => setPick(card.id)} className={`flex min-h-0 min-w-0 flex-col items-center gap-1 rounded-[20px] p-2 shadow-sm transition active:scale-[.98] ${pick === card.id ? 'ring-[3px] ring-[#675ff3]' : ''}`} style={{ background: card.tint }}>
                <div className="flex min-h-0 w-full flex-1 items-center justify-center"><img src={card.image} alt="" draggable={false} className="h-full w-full object-contain" /></div>
                <span className="text-[clamp(14px,4.2vw,17px)] font-black leading-none text-[#1b4ea3]">{card.label}</span>
                <span className="text-[clamp(11px,3.2vw,13px)] font-bold leading-none text-[#6b7ea6]">{card.weight}</span>
                <span className="flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1"><Price value={card.price} className="text-[clamp(15px,4.6vw,19px)] !text-[#1b4ea3]" /></span>
                <Radio on={pick === card.id} />
              </button>
            ))}
          </div>
        )}

        {scene === 1 && (
          // Экран 2 — «Покупки по списку»: бюджет, список, товары, корзина
          <>
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#e3f1fb] px-3 py-1 shadow-sm">
              <img src={coinsIcon} alt="" className="h-[clamp(26px,7.5vw,34px)] w-[clamp(26px,7.5vw,34px)] object-contain" />
              <div className="flex flex-1 items-center justify-between gap-2">
                <span className="text-[clamp(10px,2.9vw,12px)] font-black leading-tight text-[#3a6ea8]">Бюджет на покупки</span>
                <span className="text-[clamp(20px,6vw,26px)] font-black leading-none text-[#1b3f8f]">{LIST_BUDGET}</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1 rounded-[16px] bg-[#f3ede0] px-2 py-1.5">
              <span className="text-[clamp(10px,2.9vw,12px)] font-black text-[#1b3f8f]">Список покупок:</span>
              {shoppingList.map((good) => (
                <div key={good.id} className="flex items-center gap-2 rounded-xl bg-white/85 px-2 py-0.5">
                  <img src={good.image} alt="" className="h-[clamp(20px,6vw,28px)] w-[clamp(20px,6vw,28px)] shrink-0 object-contain" />
                  <span className="flex-1 text-[clamp(10px,3vw,12.5px)] font-extrabold text-[#17469d]">{good.label}</span>
                  <Price value={good.price} className="text-[clamp(10px,3vw,12.5px)]" />
                  <span className="relative h-[clamp(20px,6vw,28px)] w-[clamp(20px,6vw,28px)] shrink-0">
                    <img src={checkboxIcon} alt="" className="h-full w-full object-contain" />
                    {cart.includes(good.id) && <span className="absolute inset-0 flex items-center justify-center text-[clamp(13px,4vw,18px)] font-black text-[#3aa24a]">✓</span>}
                  </span>
                </div>
              ))}
            </div>
            <span className="-mb-1 shrink-0 text-[clamp(9.5px,2.7vw,11.5px)] font-black text-[#8a7a5a]">Доступные товары:</span>
            <div className="grid min-h-0 flex-[1.2] grid-cols-3 gap-1.5">
              {listGoods.map((good) => renderGoodCard(good))}
            </div>
            {renderCartRow('Корзина', `${cart.length}/${CART_SLOTS}`)}
          </>
        )}

        {scene === 2 && (
          // Экран 3 — «Сравни две корзины»: итого считается из цен
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
            {([['a', 'Корзина A', basketA, '#fdeaf0'], ['b', 'Корзина B', basketB, '#e2f2fb']] as const).map(([id, title, goods, tint]) => (
              <button key={id} type="button" onClick={() => setPick(id)} className={`flex min-h-0 min-w-0 flex-col items-stretch gap-1 rounded-[20px] p-2 shadow-sm transition active:scale-[.98] ${pick === id ? 'ring-[3px] ring-[#675ff3]' : ''}`} style={{ background: tint }}>
                <span className="text-center text-[clamp(13px,3.9vw,16px)] font-black leading-none text-[#c9364e]" style={id === 'b' ? { color: '#1b6fb5' } : undefined}>{title}</span>
                {goods.map((good) => (
                  <div key={good.id} className="flex min-h-0 flex-1 items-center gap-1 rounded-xl bg-white/80 px-1.5">
                    <img src={good.image} alt="" draggable={false} className="h-full max-h-[80px] w-[40%] shrink-0 object-contain py-0.5" />
                    <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                      <span className="text-[clamp(9px,2.6vw,11px)] font-extrabold text-[#17469d]">{good.label}</span>
                      <Price value={good.price} className="text-[clamp(10px,3vw,12.5px)]" />
                    </div>
                  </div>
                ))}
                <div className="flex shrink-0 flex-col items-center border-t-2 border-dashed border-[#b9c4dd] pt-1">
                  <span className="text-[clamp(10px,2.9vw,12px)] font-black text-[#1b3f8f]">Итого:</span>
                  <Price value={sumPrices([...goods])} className="text-[clamp(17px,5.2vw,22px)] !text-[#1b3f8f]" />
                </div>
                <div className="flex shrink-0 justify-center"><Radio on={pick === id} /></div>
              </button>
            ))}
          </div>
        )}

        {scene === 3 && (
          // Экран 4 — «Шкала корзины»: набрать товары в пределах лимита 30
          <>
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#e3f1fb] px-3 py-1 shadow-sm">
              <img src={coinsIcon} alt="" className="h-[clamp(26px,7.5vw,34px)] w-[clamp(26px,7.5vw,34px)] object-contain" />
              <div className="flex flex-1 items-center justify-between gap-2">
                <span className="text-[clamp(10px,2.9vw,12px)] font-black leading-tight text-[#3a6ea8]">Лимит на покупки</span>
                <span className="text-[clamp(20px,6vw,26px)] font-black leading-none text-[#1b3f8f]">{SCALE_LIMIT}</span>
              </div>
            </div>
            <div className="shrink-0 px-2">
              <div className="relative">
                <img src={scaleBarImg} alt="" draggable={false} className="block w-full" />
                <span
                  className={`absolute top-1/2 h-[140%] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_#fff] transition-[left] duration-300 ${cartTotal > SCALE_LIMIT ? 'bg-[#d1364e]' : 'bg-[#1b3f8f]'}`}
                  style={{ left: `${Math.min(cartTotal / SCALE_LIMIT, 1) * 100}%` }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[clamp(9px,2.6vw,11px)] font-black text-[#5a6a92]">
                {[0, 10, 20, 30].map((tick) => <span key={tick}>{tick}</span>)}
              </div>
            </div>
            <span className="-mb-1 shrink-0 text-[clamp(9.5px,2.7vw,11.5px)] font-black text-[#8a7a5a]">Доступные товары:</span>
            <div className="grid min-h-0 flex-[1.2] grid-cols-3 gap-1.5">
              {scaleGoods.map((good) => renderGoodCard(good))}
            </div>
            {renderCartRow('Корзина', `${cartTotal} / ${SCALE_LIMIT}`, cartTotal > SCALE_LIMIT)}
          </>
        )}

        {scene === 4 && (
          // Экран 5 — «Проверка перед кассой»: убрать из корзины лишний товар
          <>
            <div className="flex shrink-0 flex-col gap-1 rounded-[16px] bg-[#f3ede0] px-2 py-1.5">
              <span className="text-[clamp(10px,2.9vw,12px)] font-black text-[#1b3f8f]">Список покупок:</span>
              {checkoutList.map((good) => (
                <div key={good.id} className="flex items-center gap-2 rounded-xl bg-white/85 px-2 py-0.5">
                  <img src={good.image} alt="" className="h-[clamp(22px,6.5vw,30px)] w-[clamp(22px,6.5vw,30px)] shrink-0 object-contain" />
                  <span className="flex-1 text-[clamp(11px,3.2vw,13.5px)] font-extrabold text-[#17469d]">{good.label}</span>
                  <Radio on={!removed.includes(good.id)} />
                </div>
              ))}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1 rounded-[18px] bg-[#fdeaea] p-2">
              <span className="text-center text-[clamp(11px,3.2vw,13px)] font-black text-[#d1364e]">Твоя корзина:</span>
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
                {checkoutBasket.map((good) => {
                  const isRemoved = removed.includes(good.id);
                  return (
                    <div key={good.id} className="flex min-h-0 min-w-0 flex-col items-center gap-0.5 rounded-[14px] bg-white/90 p-1 shadow-sm">
                      <div className={`flex min-h-0 w-full flex-1 items-center justify-center transition ${isRemoved ? 'opacity-30 grayscale' : ''}`}><img src={good.image} alt="" draggable={false} className="h-full w-full object-contain" /></div>
                      <span className={`line-clamp-1 text-[clamp(9px,2.6vw,11.5px)] font-extrabold text-[#17469d] ${isRemoved ? 'line-through opacity-50' : ''}`}>{good.label}</span>
                      <Price value={good.price} className="text-[clamp(10px,3vw,12.5px)]" />
                      <button type="button" aria-label={isRemoved ? `Вернуть: ${good.label}` : `Убрать: ${good.label}`} onClick={() => toggleRemoved(good.id)} className={`flex h-[clamp(26px,7.5vw,32px)] w-[clamp(26px,7.5vw,32px)] shrink-0 items-center justify-center rounded-full text-[clamp(14px,4.2vw,18px)] font-black text-white shadow-md transition active:scale-90 ${isRemoved ? 'bg-[#675ff3]' : 'bg-[#e0364e]'}`}>{isRemoved ? '↺' : '✕'}</button>
                    </div>
                  );
                })}
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

      {hintText && (
        <div className="absolute bottom-[22%] left-[6%] right-[6%] z-20 rounded-2xl bg-[#fff3cd] px-4 py-2 text-center text-[clamp(11px,3.2vw,13px)] font-bold text-[#7a5b13] shadow-[0_4px_12px_rgba(120,90,20,.2)] [animation:lessonItemIn_200ms_ease-out]">
          💡 {hintText}
        </div>
      )}

      <div className="absolute bottom-[3.5%] left-[4%] right-[4%] z-20 flex items-center gap-[6%]">
        <button type="button" aria-label="Подсказка" onClick={toggleHint} className="flex h-14 w-[45%] min-w-0 shrink-0 items-center justify-center gap-2 rounded-[30px] bg-white/95 px-3 text-[clamp(14px,4.2vw,16px)] font-extrabold text-[#16449b] shadow-[0_6px_18px_rgba(80,63,120,.16)] backdrop-blur-sm transition active:scale-[.98]">
          <img src={bulbIcon} alt="" className="h-[clamp(38px,10.5vw,44px)] w-[clamp(38px,10.5vw,44px)] shrink-0 object-contain" />
          <span className="whitespace-nowrap">Подсказка</span>
        </button>
        <button type="button" aria-label="Проверить" disabled={checkState === 'correct'} onClick={handleCheck} className="h-14 min-w-0 flex-1 rounded-[30px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] px-2 text-[clamp(18px,5.8vw,22px)] font-extrabold text-white shadow-[0_7px_18px_rgba(80,65,215,.38)] transition active:scale-[.98] disabled:opacity-70">Проверить</button>
      </div>

      {dnd.drag?.moved && (() => {
        const dragged = dragLookup.find((entry) => entry.id === dnd.drag?.id);
        if (!dragged || !dnd.drag) return null;
        return (
          <DragCardPreview
            image={dragged.image}
            label={dragged.label}
            detail={`${dragged.price} монет`}
            x={dnd.drag.x}
            y={dnd.drag.y}
          />
        );
      })()}

      {showExitConfirm && <ExitConfirm onStay={() => setShowExitConfirm(false)} onExit={onBack} />}
    </div>
  );
}
