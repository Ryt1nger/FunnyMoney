import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/lesson1/lesson-video.mov';
import scene1 from '../assets/lesson1/backgrounds/practice-1.png';
import { IconArrowLeft, IconBook } from '../components/icons';
import coinsIcon from '../assets/lesson2/items/01_coins.png';
import giftIcon from '../assets/lesson2/items/02_gift.png';
import medalIcon from '../assets/lesson2/items/03_medal_star.png';
import petBowlIcon from '../assets/lesson2/items/04_pet_bowl.png';
import circusIcon from '../assets/lesson2/items/05_circus_tent.png';
import redCarIcon from '../assets/lesson2/items/06_red_car.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void }

// Второй урок использует тот же интерфейсный каркас, что и первый (видео,
// шапка с прогрессом, кнопка "книга", нижняя панель "Подсказка/Проверить").
// Видео и первый фон временно те же, что у урока 1 — своих материалов для
// урока 2 ещё нет. Сцены будут добавляться по мере готовности следующих
// упражнений (сейчас реализовано только первое — "Доход или расход?").
const scenes = [scene1];

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

// Подсказки/обратная связь при ошибке — тексты из сценария, ключ — индекс сцены.
const sceneHints: Record<number, string> = {
  0: 'Деньги приходят — это доход. Деньги уходят за покупку — расход.',
};

function ExerciseCard({ item, selected, onSelect }: { item: (typeof incomeExpenseItems)[number]; selected: boolean; onSelect: () => void }) {
  return <div onClick={onSelect} className={`flex min-h-0 cursor-grab flex-col items-center justify-center rounded-[15px] bg-white/90 p-1 text-center shadow-[0_3px_8px_rgba(83,65,90,.12)] transition-all duration-200 active:cursor-grabbing active:scale-95 animate-[lessonItemIn_220ms_ease-out] ${selected ? 'ring-2 ring-[#675ff3] ring-offset-1' : ''}`}>
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white/70"><img src={item.image} alt="" className="h-full w-full object-contain p-1" /></div>
    <span className="mt-0.5 text-[clamp(9px,2.6vw,12px)] font-extrabold leading-tight text-[#17469d]">{item.label}</span>
    <span className={`flex items-center gap-1 text-[clamp(9px,2.7vw,12px)] font-black ${item.kind === 'income' ? 'text-[#2f9e44]' : 'text-[#e0554a]'}`}>{item.kind === 'income' ? '+' : '−'}{item.amount}</span>
  </div>;
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
  const [selected, setSelected] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [checkPulse, setCheckPulse] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => setWatched(true);
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, []);

  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); }, []);

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

  function isSceneCorrect(): boolean {
    const requiredIncome = incomeExpenseItems.filter((item) => item.kind === 'income').map((item) => item.id);
    const requiredExpense = incomeExpenseItems.filter((item) => item.kind === 'expense').map((item) => item.id);
    return requiredIncome.every((id) => income.includes(id)) && requiredExpense.every((id) => expense.includes(id)) && income.length === requiredIncome.length && expense.length === requiredExpense.length;
  }

  function goToNextScene() {
    setScene((value) => value + 1);
    setIncome([]);
    setExpense([]);
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
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${playing ? '' : 'scale-105 blur-xl opacity-60'}`}
        />
        <button aria-label="Назад" onClick={onBack} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => { setWatched(true); setPhase('practice'); }} className="absolute right-5 top-7 z-20 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">Пропустить</button>
        {!playing && !watched && <button aria-label="Воспроизвести видео" onClick={() => { setPlaying(true); void videoRef.current?.play().catch(() => setWatched(true)); }} className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#675ff3] text-5xl text-white shadow-lg">▶</button>}
        {watched && <button onClick={() => setPhase('practice')} className="absolute bottom-8 left-6 right-6 z-20 rounded-[28px] bg-[#675ff3] py-4 text-xl font-black text-white shadow-lg">Решать</button>}
      </div>
    );
  }

  const tray = incomeExpenseItems.filter((item) => !income.includes(item.id) && !expense.includes(item.id));

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

      <div key={checkPulse} className={`absolute left-[5%] right-[5%] top-[40%] bottom-[21%] z-10 grid grid-rows-[minmax(0,.72fr)_minmax(0,1.28fr)] gap-2.5 ${checkState === 'wrong' ? '[animation:lessonShake_420ms_ease-in-out]' : ''}`}>
        {/* Упражнение 1 — "Доход или расход?": две корзины сверху (клик/drop
            кладёт выбранную или перетаскиваемую карточку), лоток с 6
            карточками снизу. Тап по карточке в лотке выбирает её (подсветка
            рамкой), затем тап по корзине кладёт её туда — это же работает
            перетаскиванием для тех, кому удобнее drag. */}
        <div className="grid grid-cols-2 gap-2.5">
          <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => placeInBasket('income', event.dataTransfer.getData('text/plain') || undefined)} onClick={() => placeInBasket('income')} className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border-2 border-dashed border-[#8fd4a0] bg-[#e6f9ea] p-2">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-[#1f7a32]"><span className="text-[clamp(14px,4vw,18px)] font-black">+</span><span className="text-[clamp(11px,3.2vw,14px)] font-black">Доходы</span></div>
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
              {incomeExpenseItems.filter((item) => income.includes(item.id)).map((item) => (
                <button type="button" key={item.id} onClick={(event) => { event.stopPropagation(); returnToTray(item.id); }} className="flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-white/85 p-1 shadow-sm active:scale-95">
                  <img src={item.image} alt={item.label} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          </div>
          <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => placeInBasket('expense', event.dataTransfer.getData('text/plain') || undefined)} onClick={() => placeInBasket('expense')} className="flex min-h-0 flex-col overflow-hidden rounded-[20px] border-2 border-dashed border-[#f0a3a3] bg-[#fdeaea] p-2">
            <div className="mb-1 flex items-center justify-center gap-1.5 text-[#c23b3b]"><span className="text-[clamp(14px,4vw,18px)] font-black">−</span><span className="text-[clamp(11px,3.2vw,14px)] font-black">Расходы</span></div>
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
              {incomeExpenseItems.filter((item) => expense.includes(item.id)).map((item) => (
                <button type="button" key={item.id} onClick={(event) => { event.stopPropagation(); returnToTray(item.id); }} className="flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-white/85 p-1 shadow-sm active:scale-95">
                  <img src={item.image} alt={item.label} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-2 rounded-[22px] bg-white/55 p-2">
          {tray.map((item) => (
            <div key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}>
              <ExerciseCard item={item} selected={selected === item.id} onSelect={() => selectCard(item.id)} />
            </div>
          ))}
        </div>
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
