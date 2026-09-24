import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/lesson2/lesson-video.mp4';
import scene1 from '../assets/lesson1/backgrounds/practice-1.png';
import { IconArrowLeft, IconBook } from '../components/icons';
import coinsIcon from '../assets/lesson2/items/01_coins.png';
import giftIcon from '../assets/lesson2/items/02_gift.png';
import medalIcon from '../assets/lesson2/items/03_medal_star.png';
import petBowlIcon from '../assets/lesson2/items/04_pet_bowl.png';
import circusIcon from '../assets/lesson2/items/05_circus_tent.png';
import redCarIcon from '../assets/lesson2/items/06_red_car.png';
import medicineIcon from '../assets/lesson2/items/07_medicine.png';
import artSetIcon from '../assets/lesson2/items/08_art_set.png';
import consoleIcon from '../assets/lesson2/items/09_game_console.png';
import scalesIcon from '../assets/lesson2/items/10_scales.png';
import basketIcon from '../assets/lesson2/basket.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void }

// Второй урок использует тот же интерфейсный каркас, что и первый (видео,
// шапка с прогрессом, кнопка "книга", нижняя панель "Подсказка/Проверить").
// Фон сцены временно переиспользует фон первого упражнения урока 1 — своих
// материалов для урока 2 ещё нет (у practice-2.png/3.png и т.д. есть свой
// "зашитый" в картинку сюжет из другого упражнения урока 1, который будет
// конфликтовать с содержанием, поэтому переиспользуем именно practice-1 —
// нейтральную комнату без сюжетных элементов). Сцены будут добавляться по
// мере готовности следующих упражнений (сейчас реализованы первые два —
// "Доход или расход?" и "Балансир бюджета").
const scenes = [scene1, scene1];

// Заголовок и краткая инструкция упражнения — речевой пузырь у питомца
// над карточкой практики, как в макете.
const sceneIntro: Record<number, { title: string; description: string }> = {
  0: { title: 'Доход или расход?', description: 'Разложи карточки: что приносит монеты, а что их тратит?' },
  1: { title: 'Балансир бюджета', description: 'Выбери покупки так, чтобы не превысить доход 100 монет и сначала закрыть обязательное.' },
};

// Упражнение 1 — "Доход или расход?": разложить карточки по двум корзинам —
// Доходы (+) и Расходы (-). Из сценария (уроки практика.pdf, Урок 2):
// доходы — карманные деньги +30, подарок +50, награда за помощь +10;
// расходы — корм -20, цирк -15, игрушка -25.
const incomeExpenseItems = [
  { id: 'income-pocket', label: 'Карманные деньги', amount: 30, image: coinsIcon, kind: 'income' as const },
  { id: 'income-gift', label: 'Подарок', amount: 50, image: giftIcon, kind: 'income' as const },
  { id: 'income-reward', label: 'Награда за помощь', amount: 10, image: medalIcon, kind: 'income' as const },
  { id: 'expense-food', label: 'Корм', amount: 20, image: petBowlIcon, kind: 'expense' as const },
  { id: 'expense-circus', label: 'Цирк', amount: 15, image: circusIcon, kind: 'expense' as const },
  { id: 'expense-toy', label: 'Игрушка', amount: 25, image: redCarIcon, kind: 'expense' as const },
] as const;

// Упражнение 2 — "Балансир бюджета": выбрать до 3 покупок в корзину так,
// чтобы сумма не превышала доход (100 монет) и обязательная покупка
// (лекарство) была закрыта первой.
const BUDGET_INCOME = 100;
const BUDGET_MAX_ITEMS = 3;
const budgetItems = [
  { id: 'budget-medicine', label: 'Лекарство', amount: 30, image: medicineIcon, mandatory: true },
  { id: 'budget-food', label: 'Еда', amount: 40, image: petBowlIcon, mandatory: false },
  { id: 'budget-art', label: 'Набор для рисования', amount: 30, image: artSetIcon, mandatory: false },
  { id: 'budget-console', label: 'Приставка', amount: 50, image: consoleIcon, mandatory: false },
] as const;

// Подсказки/обратная связь при ошибке — тексты из сценария, ключ — индекс сцены.
const sceneHints: Record<number, string> = {
  0: 'Деньги приходят — это доход. Деньги уходят за покупку — расход.',
  1: 'Сначала купи обязательное — лекарство. И следи, чтобы сумма покупок не превышала доход 100 монет.',
};

function ExerciseCard({ item, selected, onSelect }: { item: (typeof incomeExpenseItems)[number]; selected: boolean; onSelect: () => void }) {
  return <div onClick={onSelect} className={`flex h-full w-full min-h-0 min-w-0 cursor-grab flex-col items-center justify-between gap-1 rounded-[15px] bg-white/90 p-1 text-center shadow-[0_3px_8px_rgba(83,65,90,.12)] transition-all duration-200 active:cursor-grabbing active:scale-95 animate-[lessonItemIn_220ms_ease-out] ${selected ? 'ring-2 ring-[#675ff3] ring-offset-1' : ''}`}>
    <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-xl bg-white/70"><img src={item.image} alt="" className="h-full w-full object-contain p-0.5" /></div>
    <span className="line-clamp-2 w-full shrink-0 text-[clamp(9px,2.6vw,11.5px)] font-extrabold leading-[1.15] text-[#17469d]">{item.label}</span>
    <span className={`flex shrink-0 items-center gap-1 text-[clamp(9.5px,2.9vw,12.5px)] font-black ${item.kind === 'income' ? 'text-[#2f9e44]' : 'text-[#e0554a]'}`}>{item.kind === 'income' ? '+' : '−'}{item.amount}</span>
  </div>;
}

function BudgetCard({ item, inBasket, onToggle }: { item: (typeof budgetItems)[number]; inBasket: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      draggable={!inBasket}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
      onClick={onToggle}
      className={`flex h-full w-full min-h-0 min-w-0 cursor-grab flex-col items-center justify-between gap-0.5 rounded-[15px] bg-white/90 p-1 text-center shadow-[0_3px_8px_rgba(83,65,90,.12)] transition-all duration-200 active:cursor-grabbing active:scale-95 animate-[lessonItemIn_220ms_ease-out] ${inBasket ? 'opacity-40' : ''}`}
    >
      <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-xl bg-white/70"><img src={item.image} alt="" className="h-full w-full object-contain p-0.5" /></div>
      <span className="line-clamp-2 w-full shrink-0 text-[clamp(8.5px,2.4vw,11px)] font-extrabold leading-[1.15] text-[#17469d]">{item.label}</span>
      <span className="flex shrink-0 items-center gap-1 text-[clamp(9.5px,2.8vw,12px)] font-black text-[#c9862a]"><img src={coinsIcon} alt="" className="h-3 w-3 object-contain" />{item.amount}</span>
      {item.mandatory && <span className="shrink-0 rounded-full bg-[#fde3e3] px-1.5 py-[1px] text-[clamp(6.5px,1.9vw,8px)] font-black text-[#d1453f]">✓ Обязательно</span>}
    </button>
  );
}

/** Второй урок: видео и практика. Шаблон интерфейса общий с уроком 1 —
 * меняется только содержимое секции практики под конкретное упражнение.
 */
export default function LessonTwo({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [income, setIncome] = useState<string[]>([]);
  const [expense, setExpense] = useState<string[]>([]);
  const [basket, setBasket] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [checkPulse, setCheckPulse] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Подсказка/обратная связь сама появляется и исчезает через 3 секунды —
  // и при ошибке, и при ручном открытии кнопкой "Подсказка".
  useEffect(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (hintText) hintTimerRef.current = setTimeout(() => setHintText(null), 3000);
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, [hintText]);

  // Перенос карточки в корзину "Доходы" или "Расходы" — работает и от
  // перетаскивания (drag), и как цель для карточки, выбранной тапом.
  function placeInBasket(kind: 'income' | 'expense', draggedId?: string) {
    const id = draggedId ?? selected;
    if (!id) return;
    setIncome((current) => (kind === 'income' ? (current.includes(id) ? current : [...current, id]) : current.filter((value) => value !== id)));
    setExpense((current) => (kind === 'expense' ? (current.includes(id) ? current : [...current, id]) : current.filter((value) => value !== id)));
    setSelected(null);
  }

  function returnToTray(id: string) {
    setIncome((current) => current.filter((value) => value !== id));
    setExpense((current) => current.filter((value) => value !== id));
    setSelected(null);
  }

  function selectCard(id: string) {
    setSelected((current) => (current === id ? null : id));
  }

  // Добавить/убрать покупку из корзины бюджета (упражнение 2) — тап по
  // карточке или по занятой корзине, либо перетаскивание карточки в корзину.
  function toggleBudgetItem(id: string) {
    setBasket((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= BUDGET_MAX_ITEMS) return current;
      return [...current, id];
    });
  }

  function isBudgetCorrect(): boolean {
    if (basket.length === 0) return false;
    const total = basket.reduce((sum, id) => sum + (budgetItems.find((item) => item.id === id)?.amount ?? 0), 0);
    const hasMandatory = budgetItems.filter((item) => item.mandatory).every((item) => basket.includes(item.id));
    return hasMandatory && total <= BUDGET_INCOME;
  }

  function isSceneCorrect(): boolean {
    if (scene === 1) return isBudgetCorrect();
    const requiredIncome = incomeExpenseItems.filter((item) => item.kind === 'income').map((item) => item.id);
    const requiredExpense = incomeExpenseItems.filter((item) => item.kind === 'expense').map((item) => item.id);
    return requiredIncome.every((id) => income.includes(id)) && requiredExpense.every((id) => expense.includes(id)) && income.length === requiredIncome.length && expense.length === requiredExpense.length;
  }

  function goToNextScene() {
    setScene((value) => value + 1);
    setIncome([]);
    setExpense([]);
    setBasket([]);
    setSelected(null);
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
          <button onClick={() => setPhase('practice')} className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full bg-[#675ff3] px-9 py-5 text-xl font-black text-white shadow-[0_10px_30px_rgba(74,60,205,.5)] transition active:scale-95 [animation:lessonCheckIn_420ms_cubic-bezier(.34,1.56,.64,1)]">
            Решать
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M13 5l7 7-7 7v-4H4v-6h9V5z" /></svg>
          </button>
        )}
        <style>{`@keyframes lessonCheckIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}60%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
      </div>
    );
  }

  const tray = incomeExpenseItems.filter((item) => !income.includes(item.id) && !expense.includes(item.id));
  const budgetTotal = basket.reduce((sum, id) => sum + (budgetItems.find((item) => item.id === id)?.amount ?? 0), 0);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fbefe1]">
      <style>{`@keyframes lessonSceneIn{from{opacity:0;transform:scale(1.015)}to{opacity:1;transform:scale(1)}}@keyframes lessonItemIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes lessonShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}}@keyframes lessonCheckIn{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}`}</style>
      <img key={scene} src={scenes[scene]} alt="Фон практического задания" className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center [animation:lessonSceneIn_420ms_ease-out]" />

      {/* Кнопка назад повторяет шапку разделов на главной */}
      <button aria-label="Назад к урокам" onClick={onBack} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>

      <div className="absolute left-1/2 top-[2.8%] z-20 flex h-[6%] w-[44%] -translate-x-1/2 items-center rounded-full border border-white/30 bg-[#4d497d]/55 px-[5%] shadow-[0_4px_14px_rgba(50,42,110,.25)] backdrop-blur-md">
          <div className="relative flex w-full items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/45" />
            <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#675ff3] transition-[width] duration-500" style={{ width: `${scenes.length > 1 ? (scene / (scenes.length - 1)) * 100 : 0}%` }} />
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

      {/* Речевой пузырь с названием и краткой инструкцией упражнения — как в макете. */}
      {sceneIntro[scene] && (
        <div key={`intro-${scene}`} className="absolute right-[5%] top-[9%] z-20 max-w-[62%] rounded-[24px] bg-white/95 px-4 py-3 shadow-[0_8px_22px_rgba(50,40,90,.2)] [animation:lessonItemIn_320ms_ease-out]">
          <div className="absolute -bottom-2 left-9 h-4 w-4 rotate-45 bg-white/95" />
          <p className="text-[clamp(14px,4.2vw,17px)] font-black leading-tight text-[#1b3f8f]">{sceneIntro[scene].title}</p>
          <p className="mt-1 text-[clamp(11px,3.2vw,13px)] font-semibold leading-snug text-[#5a6a92]">{sceneIntro[scene].description}</p>
        </div>
      )}

      <div key={checkPulse} className={`absolute left-[5%] right-[5%] top-[37%] bottom-[17%] z-10 flex flex-col gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out] ${checkState === 'wrong' ? '[animation:lessonShake_420ms_ease-in-out]' : ''}`}>
        {scene === 0 && (
          <>
            {/* Упражнение 1 — "Доход или расход?": две корзины сверху (клик/drop
                кладёт выбранную или перетаскиваемую карточку), лоток с 6
                карточками снизу. Тап по карточке в лотке выбирает её (подсветка
                рамкой), затем тап по корзине кладёт её туда — это же работает
                перетаскиванием для тех, кому удобнее drag. */}
            <div className="grid min-h-0 flex-[0.48] grid-cols-2 gap-2">
              <div className="flex min-h-0 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-1.5 rounded-2xl bg-[#dbf1ee] px-2 py-1.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/85 shadow-sm"><img src={coinsIcon} alt="" className="h-[18px] w-[18px] object-contain" /></div>
                  <div className="flex min-w-0 flex-col items-start leading-tight">
                    <span className="truncate text-[clamp(10.5px,3vw,12.5px)] font-black text-[#146b5c]">Доходы (+)</span>
                    <span className="truncate text-[clamp(7.5px,2.2vw,9.5px)] font-bold text-[#4d938a]">Монетки приходят</span>
                  </div>
                </div>
                <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => placeInBasket('income', event.dataTransfer.getData('text/plain') || undefined)} onClick={() => placeInBasket('income')} className="min-h-0 flex-1 overflow-hidden rounded-[20px] border-2 border-dashed border-[#8fd6c9] bg-[#eaf9f6] p-2">
                  <div className="grid h-full min-h-0 grid-cols-3 gap-1.5">
                    {incomeExpenseItems.filter((item) => income.includes(item.id)).map((item) => (
                      <button type="button" key={item.id} onClick={(event) => { event.stopPropagation(); returnToTray(item.id); }} className="flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-white/85 p-1 shadow-sm active:scale-95">
                        <img src={item.image} alt={item.label} className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex min-h-0 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-1.5 rounded-2xl bg-[#fbe3d2] px-2 py-1.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/85 shadow-sm"><img src={coinsIcon} alt="" className="h-[18px] w-[18px] object-contain" /></div>
                  <div className="flex min-w-0 flex-col items-start leading-tight">
                    <span className="truncate text-[clamp(10.5px,3vw,12.5px)] font-black text-[#b8571e]">Расходы (−)</span>
                    <span className="truncate text-[clamp(7.5px,2.2vw,9.5px)] font-bold text-[#c98a5e]">Монетки уходят</span>
                  </div>
                </div>
                <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => placeInBasket('expense', event.dataTransfer.getData('text/plain') || undefined)} onClick={() => placeInBasket('expense')} className="min-h-0 flex-1 overflow-hidden rounded-[20px] border-2 border-dashed border-[#f0b98a] bg-[#fdf0e4] p-2">
                  <div className="grid h-full min-h-0 grid-cols-3 gap-1.5">
                    {incomeExpenseItems.filter((item) => expense.includes(item.id)).map((item) => (
                      <button type="button" key={item.id} onClick={(event) => { event.stopPropagation(); returnToTray(item.id); }} className="flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-white/85 p-1 shadow-sm active:scale-95">
                        <img src={item.image} alt={item.label} className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-[1.52] grid-cols-3 grid-rows-2 gap-2 rounded-[18px] bg-[#f3ede0] p-2">
              {tray.map((item) => (
                <div key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)} className="min-h-0 min-w-0">
                  <ExerciseCard item={item} selected={selected === item.id} onSelect={() => selectCard(item.id)} />
                </div>
              ))}
            </div>
          </>
        )}

        {scene === 1 && (
          <>
            {/* Упражнение 2 — "Балансир бюджета": до 3 покупок в корзину так,
                чтобы уложиться в доход 100 монет и сначала закрыть
                обязательную покупку (лекарство). Тап по карточке — добавить,
                тап по занятой ячейке корзины — убрать; перетаскивание тоже
                работает. */}
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/70 p-1.5 shadow-sm"><img src={scalesIcon} alt="" className="h-full w-full object-contain" /></div>
              <div className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#dff3ea] px-3 py-2 shadow-sm">
                <img src={coinsIcon} alt="" className="h-6 w-6 object-contain" />
                <span className="text-[clamp(13px,3.8vw,16px)] font-black text-[#146b5c]">Доход: {BUDGET_INCOME}</span>
              </div>
            </div>

            <div className="grid min-h-0 flex-[1.5] grid-cols-4 gap-1.5">
              {budgetItems.map((item) => (
                <BudgetCard key={item.id} item={item} inBasket={basket.includes(item.id)} onToggle={() => toggleBudgetItem(item.id)} />
              ))}
            </div>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { const id = event.dataTransfer.getData('text/plain'); if (id) toggleBudgetItem(id); }}
              className="flex min-h-0 flex-[0.65] items-center gap-2 rounded-[18px] bg-[#f3ede0] p-2"
            >
              <div className="flex h-full w-[58px] shrink-0 flex-col items-center justify-center gap-0.5">
                <img src={basketIcon} alt="" className="h-9 w-9 object-contain" />
                <span className="text-center text-[clamp(7px,2vw,8.5px)] font-black leading-tight text-[#8a7a5a]">Твоя корзина</span>
              </div>
              <div className="grid h-full min-h-0 flex-1 grid-cols-3 gap-1.5">
                {[0, 1, 2].map((slot) => {
                  const item = basket[slot] ? budgetItems.find((candidate) => candidate.id === basket[slot]) : undefined;
                  return item ? (
                    <button type="button" key={slot} onClick={() => toggleBudgetItem(item.id)} className="flex h-full min-h-0 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-white/90 p-1 shadow-sm transition active:scale-95 animate-[lessonItemIn_200ms_ease-out]">
                      <img src={item.image} alt={item.label} className="h-full w-full object-contain" />
                    </button>
                  ) : (
                    <div key={slot} className="h-full min-h-0 rounded-xl border-2 border-dashed border-[#c9bfa0] bg-white/30" />
                  );
                })}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[clamp(11px,3.2vw,13px)] font-black shadow-sm ${budgetTotal > BUDGET_INCOME ? 'bg-[#fde3e3] text-[#c23b3b]' : 'bg-white/85 text-[#4a3f2c]'}`}>{basket.length}/{BUDGET_MAX_ITEMS}</span>
            </div>
          </>
        )}
      </div>

      {/* Галочка при верном ответе — общий оверлей поверх зоны упражнения. */}
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
