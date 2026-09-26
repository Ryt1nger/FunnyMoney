import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/lesson2/lesson-video.mp4';
import scene1 from '../assets/lesson4/practice-1.jpg';
import scene2 from '../assets/lesson4/practice-2.jpg';
import scene3 from '../assets/lesson4/practice-3.jpg';
import scene4 from '../assets/lesson4/practice-4.jpg';
import scene5 from '../assets/lesson4/practice-5.jpg';
import { IconArrowLeft, IconBook } from '../components/icons';
// Общие UI-элементы (монеты, радио, чекбокс, лампочка) — те же, что в уроке 3
import coinIcon from '../assets/lesson3/ui/coin.png';
import coinsIcon from '../assets/lesson3/ui/coins.png';
import bulbIcon from '../assets/lesson3/ui/bulb.png';
import radioIcon from '../assets/lesson3/ui/radio.png';
import radioOnIcon from '../assets/lesson3/ui/radio-on.png';
import checkboxIcon from '../assets/lesson3/ui/checkbox.png';
import bowlIcon from '../assets/lesson4/items/bowl.png';
import jarIcon from '../assets/lesson4/items/jar.png';
import ballIcon from '../assets/lesson4/items/ball.png';
import carIcon from '../assets/lesson4/items/car.png';
import canIcon from '../assets/lesson4/items/can.png';
import shampooIcon from '../assets/lesson4/items/shampoo-yellow.png';
import stickersIcon from '../assets/lesson4/items/stickers.png';
import toysTwoIcon from '../assets/lesson4/items/toys-two.png';
import checkIcon from '../assets/lesson4/items/check.png';
import badgeIcon from '../assets/lesson4/items/badge-10.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void; onPracticeComplete?: () => void }

// Четвёртый урок — «Скидки и акции: настоящая выгода». Каркас тот же, что у
// уроков 1–3. Видео пока то же, что во втором уроке. Диалоговые облачка рядом
// с медведем не верстаются — фон сцены это готовая картинка. Все упражнения
// тап-выбор (перетаскивания в этом уроке нет).
const scenes = [scene1, scene2, scene3, scene4, scene5];

interface Good { id: string; label: string; price: number; image: string; promo?: boolean }

// Экран 1 — «Собери по списку»: бюджет 40, в списке корм и витамины.
const LIST_BUDGET = 40;
const food: Good = { id: 'food', label: 'Корм', price: 20, image: bowlIcon };
const vitamins: Good = { id: 'vitamins', label: 'Витамины', price: 20, image: jarIcon };
const listGoods: Good[] = [
  food,
  vitamins,
  { id: 'toy', label: 'Игрушка', price: 30, image: ballIcon },
  { id: 'two-toys', label: 'Две игрушки', price: 40, image: toysTwoIcon, promo: true },
];
const shoppingList = [food, vitamins];

// Экран 2 — «Выгодно или просто ярко?»: игрушки нет в списке, скидка не делает её нужной.
const CAR_PRICE = 30;
const CAR_SALE_PRICE = 20;
const CAR_SAVED = CAR_PRICE - CAR_SALE_PRICE;

// Экран 3 — «Умная выгода»: корм по акции дешевле обычного.
const REGULAR_FOOD_PRICE = 30;
const SALE_FOOD_PRICE = 20;
const FOOD_OPTIONS = [
  { id: 'regular', title: 'Обычный', price: REGULAR_FOOD_PRICE, sale: false },
  { id: 'sale', title: 'Акционный', price: SALE_FOOD_PRICE, sale: true },
] as const;
const BEST_FOOD = FOOD_OPTIONS.reduce((best, option) => (option.price < best.price ? option : best)).id;

// Экран 4 — «Возврат лишнего»: лимит 30, три товара по 15, лишние наклейки — убрать.
const RETURN_LIMIT = 30;
const returnGoods: Good[] = [
  { id: 'soup', label: 'Суп', price: 15, image: canIcon },
  { id: 'shampoo', label: 'Шампунь', price: 15, image: shampooIcon },
  { id: 'stickers', label: 'Наклейки (акция)', price: 15, image: stickersIcon, promo: true },
];
const RETURN_KEEP = ['soup', 'shampoo'];

// Экран 5 — «Сколько сэкономил?»: 30 → 20, экономия 10.
const SAVED_OPTIONS = [5, 10, 20];
const SAVED_RIGHT = REGULAR_FOOD_PRICE - SALE_FOOD_PRICE;

const sceneHints = [
  `Бери только то, что в списке: корм и витамины. Вместе они стоят ${LIST_BUDGET} монет — ровно твой бюджет. «Акция» не делает товар нужным.`,
  'Игрушки нет в списке. Даже со скидкой это лишняя трата — экономия только когда покупаешь нужное.',
  'Посмотри на цены: акционный корм стоит меньше обычного. Значит, он выгоднее.',
  `Сейчас в корзине больше ${RETURN_LIMIT} монет. Убери лишнее — то, чего не было в списке: наклейки.`,
  'Вычти новую цену из обычной: 30 минус 20 — сколько монет осталось у тебя?',
];

const SELECTED_RING = 'ring-[3px] ring-[#675ff3]';

function Coin({ className = '' }: { className?: string }) {
  return <img src={coinIcon} alt="" draggable={false} className={`h-[1.15em] w-[1.15em] shrink-0 object-contain ${className}`} />;
}

function Price({ value, strike = false, className = '' }: { value: number; strike?: boolean; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center gap-1 font-black ${strike ? 'text-[#c23b3b] line-through decoration-2' : 'text-[#c9862a]'} ${className}`}>
      <Coin />{value}
    </span>
  );
}

function Radio({ on }: { on: boolean }) {
  return <img src={on ? radioOnIcon : radioIcon} alt="" draggable={false} className="h-[clamp(24px,7vw,32px)] w-[clamp(24px,7vw,32px)] shrink-0 object-contain" />;
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <span className="relative h-[clamp(26px,7.5vw,34px)] w-[clamp(26px,7.5vw,34px)] shrink-0">
      <img src={checkboxIcon} alt="" draggable={false} className="h-full w-full object-contain" />
      {on && <img src={checkIcon} alt="" draggable={false} className="absolute inset-[18%] h-[64%] w-[64%] object-contain" />}
    </span>
  );
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

// Пилюля с монетами и крупным числом (бюджет / лимит)
function LimitPill({ label, value, note, over }: { label: string; value: number; note?: string; over?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#e3f1fb] px-3 py-1 shadow-sm">
      <img src={coinsIcon} alt="" draggable={false} className="h-[clamp(26px,7.5vw,34px)] w-[clamp(26px,7.5vw,34px)] object-contain" />
      <div className="flex flex-1 items-center justify-between gap-2">
        <span className="text-[clamp(10px,2.9vw,12px)] font-black leading-tight text-[#3a6ea8]">{label}</span>
        {note && <span className={`text-[clamp(10px,2.9vw,12px)] font-black ${over ? 'text-[#d1364e]' : 'text-[#3a8a5a]'}`}>{note}</span>}
        <span className="text-[clamp(20px,6vw,26px)] font-black leading-none text-[#1b3f8f]">{value}</span>
      </div>
    </div>
  );
}

// Два блока цен: «Обычная цена» (зачёркнута) и «Новая цена»
function PricePair({ regularLabel, saleLabel, regular, sale }: { regularLabel: string; saleLabel: string; regular: number; sale: number }) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-1.5">
      <div className="flex flex-col items-center rounded-xl bg-white/85 px-1 py-0.5">
        <span className="text-[clamp(8.5px,2.5vw,10.5px)] font-extrabold leading-tight text-[#4d6aa3]">{regularLabel}</span>
        <Price value={regular} strike className="text-[clamp(14px,4.2vw,18px)]" />
      </div>
      <div className="flex flex-col items-center rounded-xl bg-white/85 px-1 py-0.5">
        <span className="text-[clamp(8.5px,2.5vw,10.5px)] font-extrabold leading-tight text-[#d1364e]">{saleLabel}</span>
        <Price value={sale} className="text-[clamp(14px,4.2vw,18px)] !text-[#1b3f8f]" />
      </div>
    </div>
  );
}

/** Четвёртый урок: видео и практика (5 экранов). */
export default function LessonFour({ onBack, onPracticeComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [picked, setPicked] = useState<string[]>([]); // экран 1 — выбранные товары
  const [choice, setChoice] = useState<string | null>(null); // экраны 2, 3, 5 — один вариант
  const [kept, setKept] = useState<string[]>(returnGoods.map((good) => good.id)); // экран 4 — что осталось в корзине
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
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

  const returnTotal = returnGoods.filter((good) => kept.includes(good.id)).reduce((sum, good) => sum + good.price, 0);

  function togglePicked(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }
  function toggleKept(id: string) {
    setKept((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function isSceneCorrect(): boolean {
    if (scene === 0) {
      const need = shoppingList.map((good) => good.id);
      const total = listGoods.filter((good) => picked.includes(good.id)).reduce((sum, good) => sum + good.price, 0);
      return picked.length === need.length && need.every((id) => picked.includes(id)) && total <= LIST_BUDGET;
    }
    if (scene === 1) return choice === 'spent';
    if (scene === 2) return choice === BEST_FOOD;
    if (scene === 3) return kept.length === RETURN_KEEP.length && RETURN_KEEP.every((id) => kept.includes(id)) && returnTotal <= RETURN_LIMIT;
    return choice === String(SAVED_RIGHT);
  }

  function goToNextScene() {
    setScene((value) => value + 1);
    setPicked([]);
    setChoice(null);
    setKept(returnGoods.map((good) => good.id));
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

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fbefe1]">
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
          // Экран 1 — «Собери по списку»: бюджет 40, выбрать товары из списка
          <>
            <LimitPill label="Бюджет на покупки" value={LIST_BUDGET} />
            <div className="flex shrink-0 flex-col gap-1 rounded-[16px] bg-[#e3f1fb] px-2 py-1.5">
              <span className="text-[clamp(10px,2.9vw,12px)] font-black text-[#1b3f8f]">Список покупок:</span>
              {shoppingList.map((good) => (
                <div key={good.id} className="flex items-center gap-2 rounded-xl bg-white/85 px-2 py-0.5">
                  <img src={good.image} alt="" draggable={false} className="h-[clamp(20px,6vw,28px)] w-[clamp(20px,6vw,28px)] shrink-0 object-contain" />
                  <span className="flex-1 text-[clamp(10px,3vw,12.5px)] font-extrabold text-[#17469d]">{good.label}</span>
                  <Price value={good.price} className="text-[clamp(11px,3.2vw,13.5px)]" />
                </div>
              ))}
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-1.5">
              {listGoods.map((good) => {
                const on = picked.includes(good.id);
                return (
                  <button key={good.id} type="button" onClick={() => togglePicked(good.id)} className={`relative flex min-h-0 min-w-0 flex-col items-center justify-between gap-0.5 rounded-[15px] p-1 shadow-[0_3px_8px_rgba(83,65,90,.12)] transition active:scale-95 ${on ? SELECTED_RING : ''} ${good.promo ? 'bg-[#fdeaf0]' : 'bg-white/90'}`}>
                    <div className="flex min-h-0 w-full flex-1 items-center justify-center"><img src={good.image} alt="" draggable={false} className="h-full w-full object-contain p-0.5" /></div>
                    <span className="line-clamp-1 w-full text-[clamp(10px,3vw,12.5px)] font-extrabold leading-tight text-[#17469d]">{good.label}</span>
                    <Price value={good.price} className="text-[clamp(12px,3.6vw,15px)]" />
                    {good.promo && <span className="absolute right-1 top-1 rounded-full bg-[#e0364e] px-1.5 py-[1px] text-[clamp(8px,2.4vw,10px)] font-black text-white shadow">Акция!</span>}
                    {on && <img src={checkIcon} alt="выбрано" draggable={false} className="absolute left-1 top-1 h-[clamp(18px,5vw,24px)] w-[clamp(18px,5vw,24px)] object-contain drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {scene === 1 && (
          // Экран 2 — «Выгодно или просто ярко?»: игрушка со скидкой, которой нет в списке
          <>
            <div className="relative flex min-h-0 flex-[1.5] flex-col gap-1 rounded-[18px] bg-[#fdeaea] p-2">
              <div className="relative flex min-h-0 flex-1 items-center justify-center">
                <img src={carIcon} alt="Машинка" draggable={false} className="h-full max-w-[70%] object-contain" />
                <img src={badgeIcon} alt="Скидка 10%" draggable={false} className="absolute right-[8%] top-0 h-[clamp(22px,6.5vw,30px)] object-contain" />
              </div>
              <PricePair regularLabel="Обычная цена" saleLabel="Цена со скидкой" regular={CAR_PRICE} sale={CAR_SALE_PRICE} />
            </div>
            {([
              { id: 'saved', label: 'Сэкономил', value: CAR_SAVED, image: coinsIcon, bg: '#e2f5e6', fg: '#1f8a3f' },
              { id: 'spent', label: 'Потратил лишнее', value: CAR_SALE_PRICE, image: coinIcon, bg: '#fde3e6', fg: '#c23b3b' },
            ] as const).map((option) => (
              <button key={option.id} type="button" onClick={() => setChoice(option.id)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[18px] px-3 shadow-sm transition active:scale-[.98] ${choice === option.id ? SELECTED_RING : ''}`} style={{ background: option.bg }}>
                <img src={option.image} alt="" draggable={false} className="h-[70%] max-h-[56px] w-[22%] shrink-0 object-contain" />
                <div className="flex flex-1 flex-col items-start leading-tight">
                  <span className="text-[clamp(13px,4vw,17px)] font-black" style={{ color: option.fg }}>{option.label}</span>
                  <span className="flex items-center gap-1.5 text-[clamp(18px,5.6vw,24px)] font-black" style={{ color: option.fg }}><Coin />{option.value}</span>
                </div>
                <Radio on={choice === option.id} />
              </button>
            ))}
          </>
        )}

        {scene === 2 && (
          // Экран 3 — «Умная выгода»: обычный или акционный корм
          <>
            <div className="flex shrink-0 flex-col gap-1 rounded-[16px] bg-[#e3f1fb] px-2 py-1.5">
              <span className="text-center text-[clamp(11px,3.2vw,13px)] font-black text-[#1b3f8f]">Список покупок:</span>
              <div className="flex items-center gap-2 rounded-xl bg-white/85 px-3 py-1">
                <img src={bowlIcon} alt="" draggable={false} className="h-[clamp(24px,7vw,32px)] w-[clamp(24px,7vw,32px)] shrink-0 object-contain" />
                <span className="text-[clamp(12px,3.6vw,15px)] font-extrabold text-[#17469d]">Корм</span>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
              {FOOD_OPTIONS.map((option) => (
                <button key={option.id} type="button" onClick={() => setChoice(option.id)} className={`relative flex min-h-0 min-w-0 flex-col items-center gap-1 rounded-[20px] p-2 shadow-sm transition active:scale-[.98] ${choice === option.id ? SELECTED_RING : ''} ${option.sale ? 'bg-[#fdeaf0]' : 'bg-[#eef2fb]'}`}>
                  <span className="text-[clamp(13px,3.9vw,16px)] font-black leading-none text-[#1b4ea3]">{option.title}</span>
                  <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
                    <img src={bowlIcon} alt="" draggable={false} className="h-full w-full object-contain" />
                    {option.sale && <img src={badgeIcon} alt="Скидка 10%" draggable={false} className="absolute -right-1 -top-1 h-[clamp(20px,6vw,28px)] object-contain" />}
                  </div>
                  <Price value={option.price} className="text-[clamp(16px,5vw,21px)] !text-[#1b4ea3]" />
                  <Radio on={choice === option.id} />
                </button>
              ))}
            </div>
          </>
        )}

        {scene === 3 && (
          // Экран 4 — «Возврат лишнего»: убрать лишний товар, чтобы уложиться в лимит 30
          <>
            <LimitPill label="Лимит на покупки" value={RETURN_LIMIT} note={`Сейчас ${returnTotal}`} over={returnTotal > RETURN_LIMIT} />
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              {returnGoods.map((good) => {
                const on = kept.includes(good.id);
                return (
                  <button key={good.id} type="button" aria-label={`${good.label}: ${on ? 'убрать из корзины' : 'вернуть в корзину'}`} onClick={() => toggleKept(good.id)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[16px] px-3 shadow-sm transition active:scale-[.98] ${good.promo ? 'bg-[#fde3e6]' : 'bg-white/90'}`}>
                    <img src={good.image} alt="" draggable={false} className={`h-[78%] max-h-[56px] w-[18%] shrink-0 object-contain transition ${on ? '' : 'opacity-35 grayscale'}`} />
                    <div className={`flex flex-1 flex-col items-start leading-tight transition ${on ? '' : 'opacity-50'}`}>
                      <span className={`text-[clamp(12px,3.6vw,15px)] font-black ${good.promo ? 'text-[#c23b3b]' : 'text-[#17469d]'}`}>{good.label}</span>
                      <Price value={good.price} className="text-[clamp(13px,4vw,17px)]" />
                    </div>
                    <CheckBox on={on} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {scene === 4 && (
          // Экран 5 — «Сколько сэкономил?»: 30 → 20
          <>
            <div className="flex min-h-0 flex-[1.4] flex-col gap-1 rounded-[18px] bg-[#fdeaea] p-2">
              <div className="flex min-h-0 flex-1 items-center justify-center"><img src={bowlIcon} alt="Корм" draggable={false} className="h-full max-w-[60%] object-contain" /></div>
              <PricePair regularLabel="Обычная цена" saleLabel="Новая цена" regular={REGULAR_FOOD_PRICE} sale={SALE_FOOD_PRICE} />
            </div>
            <div className="flex min-h-0 flex-[1.6] flex-col gap-1.5">
              {SAVED_OPTIONS.map((value) => (
                <button key={value} type="button" onClick={() => setChoice(String(value))} className={`flex min-h-0 flex-1 items-center gap-4 rounded-[16px] bg-white/90 px-4 shadow-sm transition active:scale-[.98] ${choice === String(value) ? SELECTED_RING : ''}`}>
                  <Radio on={choice === String(value)} />
                  <span className="flex flex-1 items-center justify-center gap-3 text-[clamp(20px,6.4vw,28px)] font-black text-[#1b3f8f]">
                    <img src={coinIcon} alt="" draggable={false} className="h-[1.3em] w-[1.3em] object-contain" />{value}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {checkState === 'correct' && (
        <div key={checkPulse} className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
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

      {showExitConfirm && <ExitConfirm onStay={() => setShowExitConfirm(false)} onExit={onBack} />}
    </div>
  );
}
