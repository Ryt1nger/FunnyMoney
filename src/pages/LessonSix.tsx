import { useEffect, useRef, useState } from 'react';
import LessonHintBubble from '../components/LessonHintBubble';
import videoSrc from '../assets/lesson6/lesson-video.mp4';
import scene1 from '../assets/lesson6/practice-1.jpg';
import scene2 from '../assets/lesson6/practice-2.jpg';
import scene3 from '../assets/lesson6/practice-3.jpg';
import scene4 from '../assets/lesson6/practice-4.jpg';
import scene5 from '../assets/lesson6/practice-5.jpg';
import { IconArrowLeft, IconBook } from '../components/icons';
// Общие UI-элементы (радио, лампочка, монета) — те же, что и в уроках 3–5
import bulbIcon from '../assets/lesson3/ui/bulb.png';
import radioIcon from '../assets/lesson3/ui/radio.png';
import radioOnIcon from '../assets/lesson3/ui/radio-on.png';
import coinIcon from '../assets/lesson5/items/coin.png';
import carIcon from '../assets/lesson6/items/car.png';
import appleIcon from '../assets/lesson6/items/apple.png';
import piggyIcon from '../assets/lesson6/items/piggy.png';
import teddyIcon from '../assets/lesson6/items/teddy.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';
import { pausePracticeMusic, startPracticeMusic } from '../services/practiceMusic';
import { playCorrectAnswerSound, playWrongAnswerSound } from '../services/answerSound';
import { shuffleArray } from '../utils/shuffle';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void; onPracticeComplete?: () => void }

// Шестой урок — «План и факт: учимся на решениях». Каркас тот же, что у
// уроков 1–5. Видео пока то же, что во втором уроке. Фон каждой сцены —
// готовая картинка с медведем и мысле-облаком, верстается только карточка
// с заданием поверх неё.
const scenes = [scene1, scene2, scene3, scene4, scene5];

// Общие данные по «Игрушке», вокруг которой построены сцены 1, 2 и 4.
const TOY_PLAN = 30;
const TOY_FACT = 40;
const OVERSPEND = TOY_FACT - TOY_PLAN;

// Экран 1 — «Найди отклонение»: три категории плана/факта, отклонение — у игрушки.
const DEVIATION_ROWS = [
  { id: 'food', label: 'Еда', plan: 50, fact: 50, image: appleIcon },
  { id: 'toy', label: 'Игрушка', plan: TOY_PLAN, fact: TOY_FACT, image: carIcon },
  { id: 'piggy', label: 'Копилка', plan: 20, fact: 10, image: piggyIcon },
] as const;

// Экран 2 — «Считаем перерасход»: варианты ответа.
const OVERSPEND_OPTIONS = [5, 10, 20] as const;

// Экран 3 — «Собери вывод»: два пропуска в предложении.
const BLANK_WORDS = ['внимательнее', 'дешевле', 'дороже', 'забуду про цель'] as const;
const CORRECT_BLANK_1 = 'внимательнее';
const CORRECT_BLANK_2 = 'дешевле';

// Экран 4 — «Почему план изменился?»
const REASON_OPTIONS = [
  { id: 'price', title: 'Цена оказалась выше', icon: 'coins' as const },
  { id: 'gift', title: 'Получил больше денег', icon: 'gift' as const },
  { id: 'food', title: 'Еда стала дешевле', icon: 'apple' as const },
] as const;

// Экран 5 — «Новая попытка»: собрать бюджет ровно на 100 монет.
const BUDGET_TOTAL = 100;
const BUDGET_ITEMS = [
  { id: 'food', label: 'Еда', price: 50, image: appleIcon },
  { id: 'piggy', label: 'Копилка', price: 20, image: piggyIcon },
  { id: 'toyA', label: 'Игрушка А', price: 40, image: carIcon },
  { id: 'toyB', label: 'Игрушка Б', price: 30, image: teddyIcon },
] as const;
const BUDGET_CORRECT = ['food', 'piggy', 'toyB'];

const sceneHints = [
  'Сравни план и факт по каждой категории. У «Игрушки» план был 30, а потратили 40 — вот где отклонение.',
  `Посчитай: ${TOY_FACT} − ${TOY_PLAN} = ${OVERSPEND}. Это и есть перерасход.`,
  'Если в следующий раз быть внимательнее и выбрать игрушку подешевле — план и факт совпадут.',
  'План был 30, а потратили 40 — скорее всего, цена на игрушку оказалась выше, чем ожидалось.',
  `Сложи монеты: Еда 50 + Копилка 20 + Игрушка Б 30 = ${BUDGET_TOTAL}. Обе игрушки сразу не поместятся в бюджет.`,
];

const SELECTED_RING = 'ring-[3px] ring-[#675ff3]';

function Coin({ className = '' }: { className?: string }) {
  return <img src={coinIcon} alt="" draggable={false} className={`h-[1.15em] w-[1.15em] shrink-0 object-contain ${className}`} />;
}

function Radio({ on }: { on: boolean }) {
  return <img src={on ? radioOnIcon : radioIcon} alt="" draggable={false} className="h-[clamp(24px,7vw,32px)] w-[clamp(24px,7vw,32px)] shrink-0 object-contain" />;
}

function GiftIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8.5" width="18" height="11.5" rx="1.5" fill="#ffe3ef" stroke="#e0568f" />
      <path d="M3 12.5h18" stroke="#e0568f" />
      <path d="M12 8.5v11.5" stroke="#e0568f" />
      <path d="M12 8.5c-1.6 0-4-1-4-3 0-1.4 1.1-2 2-2 1.6 0 2 2.6 2 5z" fill="#ffb6d5" stroke="#e0568f" />
      <path d="M12 8.5c1.6 0 4-1 4-3 0-1.4-1.1-2-2-2-1.6 0-2 2.6-2 5z" fill="#ffb6d5" stroke="#e0568f" />
    </svg>
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

// Пилюля с монетами и крупным числом
function CoinsPill({ value, label }: { value: number; label?: string }) {
  return (
    <div className="mx-auto flex shrink-0 items-center gap-2 rounded-full bg-[#e3f1fb] px-4 py-0.5 shadow-sm">
      {label && <span className="text-[clamp(10px,2.9vw,12px)] font-black text-[#3a6ea8]">{label}</span>}
      <span className="flex items-center gap-1.5 text-[clamp(22px,6.6vw,28px)] font-black leading-none text-[#1b3f8f]"><Coin />{value}</span>
    </div>
  );
}

// Карточка «План / Факт» по игрушке — используется на экранах 2 и 4.
function PlanFactCard() {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-[18px] bg-white/90 px-3 py-2 shadow-sm">
      <img src={carIcon} alt="" draggable={false} className="h-[clamp(48px,14vw,64px)] w-[clamp(48px,14vw,64px)] shrink-0 object-contain" />
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-[clamp(14px,4.3vw,18px)] font-black text-[#1b3f8f]">Игрушка</span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 rounded-lg bg-[#e3f1fb] px-2 py-0.5 text-[clamp(12px,3.6vw,15px)] font-black text-[#1b4ea3]">План <Coin />{TOY_PLAN}</span>
          <span className="flex items-center gap-1 rounded-lg bg-[#fde3ea] px-2 py-0.5 text-[clamp(12px,3.6vw,15px)] font-black text-[#c23b5c]">Факт <Coin />{TOY_FACT}</span>
        </div>
      </div>
    </div>
  );
}

/** Шестой урок: видео и практика (5 экранов). */
export default function LessonSix({ onBack, onPracticeComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [deviation, setDeviation] = useState<string | null>(null); // экран 1
  const [overspend, setOverspend] = useState<number | null>(null); // экран 2
  const [blank1, setBlank1] = useState<string | null>(null); // экран 3
  const [blank2, setBlank2] = useState<string | null>(null); // экран 3
  const [activeBlank, setActiveBlank] = useState<1 | 2>(1); // экран 3
  const [reason, setReason] = useState<string | null>(null); // экран 4
  const [budgetPicks, setBudgetPicks] = useState<string[]>([]); // экран 5
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
  const [deviationRowsTray] = useState(() => shuffleArray(DEVIATION_ROWS));
  const [overspendOptionsTray] = useState(() => shuffleArray(OVERSPEND_OPTIONS));
  const [blankWordsTray] = useState(() => shuffleArray(BLANK_WORDS));
  const [reasonOptionsTray] = useState(() => shuffleArray(REASON_OPTIONS));
  const [budgetItemsTray] = useState(() => shuffleArray(BUDGET_ITEMS));

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

  const budgetTotal = budgetPicks.reduce((sum, id) => sum + (BUDGET_ITEMS.find((item) => item.id === id)?.price ?? 0), 0);

  function pickBlankWord(word: string) {
    if (activeBlank === 1) {
      setBlank1(word);
      if (!blank2) setActiveBlank(2);
    } else {
      setBlank2(word);
      if (!blank1) setActiveBlank(1);
    }
  }

  function toggleBudgetItem(id: string) {
    setBudgetPicks((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function isSceneCorrect(): boolean {
    if (scene === 0) return deviation === 'toy';
    if (scene === 1) return overspend === OVERSPEND;
    if (scene === 2) return blank1 === CORRECT_BLANK_1 && blank2 === CORRECT_BLANK_2;
    if (scene === 3) return reason === 'price';
    return budgetTotal === BUDGET_TOTAL && BUDGET_CORRECT.every((id) => budgetPicks.includes(id)) && budgetPicks.length === BUDGET_CORRECT.length;
  }

  function goToNextScene() {
    setScene((value) => value + 1);
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
          advanceTimerRef.current = setTimeout(() => { lessonCompletedRef.current = true; onBack(); }, 1800);
        } else { lessonCompletedRef.current = true; onBack(); }
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
            <span key={index} className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white/55 transition ${mistakeScenes.includes(index) ? 'bg-[#f6c84c] shadow-[0_0_0_2px_rgba(246,200,76,.4)]' : index === scene ? 'bg-white shadow-[0_0_0_2px_rgba(114,106,255,.75),0_0_10px_3px_rgba(255,255,255,.85)]' : index < scene ? 'bg-[#675ff3]' : 'bg-[#817b98]'}`} />
          ))}
        </div>
      </div>

      {reviewNotice && <div className="absolute left-1/2 top-[11%] z-30 -translate-x-1/2 rounded-full bg-[#fff7d6] px-4 py-2 text-center text-[12px] font-black text-[#9a6d08] shadow-[0_5px_16px_rgba(116,84,10,.2)] [animation:lessonFadeIn_220ms_ease-out]">Работа над ошибками — закрепляем навык</div>}

      <button aria-label="Вернуться к анимационному уроку" onClick={() => { setPhase('video'); setWatched(false); setPlaying(false); if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.pause(); } }} className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5b4cf0] text-white shadow-[0_6px_18px_rgba(74,60,205,.38)] transition active:scale-95"><IconBook className="h-7 w-7" /></button>

      <div key={checkPulse} className={`absolute left-[5%] right-[5%] top-[37%] bottom-[17%] z-10 flex flex-col gap-2 rounded-[22px] border border-white/70 bg-[#fffaf3] p-2 shadow-[0_4px_16px_rgba(102,75,50,.12)] animate-[lessonItemIn_260ms_ease-out] ${checkState === 'wrong' ? '[animation:lessonShake_420ms_ease-in-out]' : ''}`}>
        {scene === 0 && (
          // Экран 1 — «Найди отклонение»
          <>
            <p className="shrink-0 text-center text-[clamp(12px,3.6vw,14.5px)] font-bold leading-snug text-[#5a6a92]">Сравни план и факт расходов. По какой категории есть отклонение?</p>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              {deviationRowsTray.map((row) => (
                <button key={row.id} type="button" onClick={() => setDeviation(row.id)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[16px] bg-white/90 px-3 shadow-sm transition active:scale-[.98] ${deviation === row.id ? SELECTED_RING : ''}`}>
                  <img src={row.image} alt="" draggable={false} className="h-[72%] w-[15%] shrink-0 object-contain" />
                  <span className="flex-1 text-left text-[clamp(13px,4vw,16px)] font-black text-[#1b3f8f]">{row.label}</span>
                  <span className="flex items-center gap-1 rounded-lg bg-[#e3f1fb] px-2 py-0.5 text-[clamp(11px,3.3vw,13.5px)] font-black text-[#1b4ea3]">План <Coin />{row.plan}</span>
                  <span className="flex items-center gap-1 rounded-lg bg-[#fde3ea] px-2 py-0.5 text-[clamp(11px,3.3vw,13.5px)] font-black text-[#c23b5c]">Факт <Coin />{row.fact}</span>
                  <Radio on={deviation === row.id} />
                </button>
              ))}
            </div>
          </>
        )}

        {scene === 1 && (
          // Экран 2 — «Считаем перерасход»
          <>
            <p className="shrink-0 text-center text-[clamp(12px,3.6vw,14.5px)] font-bold leading-snug text-[#5a6a92]">План был {TOY_PLAN} монет, а потратили {TOY_FACT}. На сколько монет получился перерасход?</p>
            <PlanFactCard />
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              {overspendOptionsTray.map((value) => (
                <button key={value} type="button" onClick={() => setOverspend(value)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[16px] bg-white/90 px-3 shadow-sm transition active:scale-[.98] ${overspend === value ? SELECTED_RING : ''}`}>
                  <span className="flex flex-1 items-center gap-1.5 text-[clamp(18px,5.6vw,23px)] font-black text-[#1b3f8f]"><Coin />{value}</span>
                  <Radio on={overspend === value} />
                </button>
              ))}
            </div>
          </>
        )}

        {scene === 2 && (
          // Экран 3 — «Собери вывод»
          <>
            <p className="shrink-0 text-center text-[clamp(12px,3.6vw,14.5px)] font-bold leading-snug text-[#5a6a92]">Заполни пропуски, чтобы получился умный вывод по результатам покупки.</p>
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-1.5 gap-y-2 rounded-[16px] bg-white/90 px-3 py-3 text-[clamp(13px,4vw,16px)] font-bold leading-snug text-[#1b3f8f]">
              <span>В следующий раз я буду</span>
              <button type="button" onClick={() => setActiveBlank(1)} className={`rounded-lg border-2 border-dashed px-2.5 py-0.5 font-black transition ${activeBlank === 1 ? 'border-[#675ff3] bg-[#eeecff]' : 'border-[#b9c3e0] bg-[#f4f6fb]'} ${blank1 ? 'text-[#1b3f8f]' : 'text-[#a9b3d6]'}`}>
                {blank1 ?? '…'}
              </button>
              <span>и выберу игрушку</span>
              <button type="button" onClick={() => setActiveBlank(2)} className={`rounded-lg border-2 border-dashed px-2.5 py-0.5 font-black transition ${activeBlank === 2 ? 'border-[#675ff3] bg-[#eeecff]' : 'border-[#b9c3e0] bg-[#f4f6fb]'} ${blank2 ? 'text-[#1b3f8f]' : 'text-[#a9b3d6]'}`}>
                {blank2 ?? '…'}
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              {blankWordsTray.map((word) => {
                const on = blank1 === word || blank2 === word;
                return (
                  <button key={word} type="button" onClick={() => pickBlankWord(word)} className={`flex min-h-0 flex-1 items-center rounded-[14px] bg-white/90 px-3 shadow-sm transition active:scale-[.98] ${on ? SELECTED_RING : ''}`}>
                    <span className="flex-1 text-left text-[clamp(13px,4vw,16px)] font-bold text-[#1b3f8f]">{word}</span>
                    <Radio on={on} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {scene === 3 && (
          // Экран 4 — «Почему план изменился?»
          <>
            <p className="shrink-0 text-center text-[clamp(12px,3.6vw,14.5px)] font-bold leading-snug text-[#5a6a92]">План был {TOY_PLAN} монет, а потратили {TOY_FACT}. Как ты думаешь, почему это произошло?</p>
            <PlanFactCard />
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              {reasonOptionsTray.map((option) => (
                <button key={option.id} type="button" onClick={() => setReason(option.id)} className={`flex min-h-0 flex-1 items-center gap-3 rounded-[16px] bg-white/90 px-3 shadow-sm transition active:scale-[.98] ${reason === option.id ? SELECTED_RING : ''}`}>
                  {option.icon === 'gift' ? (
                    <GiftIcon className="h-[60%] w-[13%] shrink-0" />
                  ) : (
                    <img src={option.icon === 'coins' ? coinIcon : appleIcon} alt="" draggable={false} className="h-[60%] w-[13%] shrink-0 object-contain" />
                  )}
                  <span className="flex-1 text-left text-[clamp(12.5px,3.8vw,15.5px)] font-black text-[#1b3f8f]">{option.title}</span>
                  <Radio on={reason === option.id} />
                </button>
              ))}
            </div>
          </>
        )}

        {scene === 4 && (
          // Экран 5 — «Новая попытка»: собрать бюджет ровно на 100 монет
          <>
            <p className="shrink-0 text-center text-[clamp(12px,3.6vw,14.5px)] font-bold leading-snug text-[#5a6a92]">Составь новый план расходов на {BUDGET_TOTAL} монет. Выбери подходящие категории и уложись в бюджет.</p>
            <CoinsPill value={BUDGET_TOTAL} label="Мой бюджет" />
            <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5">
              {budgetItemsTray.map((item) => {
                const on = budgetPicks.includes(item.id);
                return (
                  <button key={item.id} type="button" onClick={() => toggleBudgetItem(item.id)} className={`flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-[16px] bg-white/90 p-1.5 shadow-sm transition active:scale-[.98] ${on ? SELECTED_RING : ''}`}>
                    <img src={item.image} alt="" draggable={false} className="h-[52%] w-auto max-w-[70%] object-contain" />
                    <span className="text-[clamp(11px,3.3vw,13.5px)] font-black leading-tight text-[#1b3f8f]">{item.label}</span>
                    <span className="flex items-center gap-1 text-[clamp(12px,3.6vw,14.5px)] font-black text-[#c9862a]"><Coin />{item.price}</span>
                  </button>
                );
              })}
            </div>
            <CoinsPill value={budgetTotal} label="Итого" />
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

      {showExitConfirm && <ExitConfirm onStay={() => setShowExitConfirm(false)} onExit={onBack} />}
    </div>
  );
}
