import { useEffect, useState } from 'react';
import heroImg from '../assets/heroes/hero-lessons.jpg';
import coinIcon from '../assets/icons/coin.png';
import xpIcon from '../assets/icons/xp-star.png';
import { lessonCards } from '../data/lessonsData';
import { IconArrowLeft, IconPlus, IconStar, IconLock } from '../components/icons';
import bookHero from '../assets/icons/book-3d.png';
import LessonOne from './LessonOne';
import LessonTwo from './LessonTwo';
import LessonThree from './LessonThree';
import LessonFour from './LessonFour';
import LessonFive from './LessonFive';
import LessonSix from './LessonSix';
import { useEconomyStore } from '../features/economy/economyStore';
import { usePeriodStore } from '../features/economy/periodStore';
import { usePetStore } from '../features/pet/petStore';
import { useLessonProgressStore } from '../features/progress/lessonProgressStore';
import { ECONOMY_RULES } from '../core/economy';


const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const GREEN = 'linear-gradient(180deg, #62d67d 0%, #40bd61 50%, #2fa64f 100%)';
// 3 темы курса ↔ 3 игровых периода: тема periodId открывается вместе с
// периодом того же номера (usePeriodStore().id) — тема текущего и уже
// пройденных периодов доступна, темы будущих периодов заблокированы
// (серым + иконка замка), как и сами будущие периоды в разделе "Периоды".
const LESSON_THEMES: { title: string; periodId: 1 | 2 | 3; lessonIds: string[] }[] = [
  { title: 'Выбор', periodId: 1, lessonIds: ['what-is-money', 'needs-vs-wants'] },
  { title: 'Покупки', periodId: 2, lessonIds: ['piggy-bank', 'impulse-buying'] },
  { title: 'Накопления', periodId: 3, lessonIds: ['financial-goal', 'plan-and-fact'] },
];

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  level: number;
  xp: number;
  xpToNext: number;
  onClose: () => void;
  /** плюсик у баланса — то же окно "как заработать монеты", что и на главной */
  onOpenEarnModal?: () => void;
  onFullScreenChange?: (hidden: boolean) => void;
  onLessonTransition?: (direction: 'enter' | 'exit') => void;
}

export default function Lessons({ bottomInset = 0, coins, level, xp, xpToNext, onClose, onOpenEarnModal, onFullScreenChange, onLessonTransition }: Props) {
  const [entered, setEntered] = useState(false);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  // Тот же currentId, что в разделе "Периоды" (Period.tsx): период 1..3,
  // зажатый в диапазон, чтобы не выйти за последнюю тему курса.
  const currentPeriodId = usePeriodStore((s) => Math.min(3, Math.max(1, s.id)));
  const completedLessonIds = useLessonProgressStore((s) => s.completedLessonIds);

  // фото проявляется, кремовый лист выезжает снизу — вместо резкого показа
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => () => onFullScreenChange?.(false), [onFullScreenChange]);
  const xpPercent = Math.min(100, Math.round((xp / xpToNext) * 100));
  const list = lessonCards;

  // Награда за практику — лимит на каждый урок (5 верных ответов по +монеты/+XP),
  // повторное прохождение уже выданных наград не даёт. Что выдано (или что
  // лимит исчерпан) показывается всплывашкой поверх урока.
  const [reward, setReward] = useState<{ key: number; paid: boolean } | null>(null);
  useEffect(() => {
    if (!reward) return;
    const id = setTimeout(() => setReward(null), 1700);
    return () => clearTimeout(id);
  }, [reward]);

  function rewardPractice(lessonId: string): boolean {
    const progress = useLessonProgressStore.getState();
    progress.completeLesson(lessonId);
    const paid = progress.claimPracticeReward(lessonId, ECONOMY_RULES.maxPracticeRewardXp / ECONOMY_RULES.practiceRewardXp);
    if (paid) {
      useEconomyStore.getState().applyCoinsDelta(ECONOMY_RULES.practiceRewardCoins, 'Награда за практику', {
        periodId: usePeriodStore.getState().id,
        category: 'reward',
      });
      usePetStore.getState().addXp(ECONOMY_RULES.practiceRewardXp);
    }
    setReward({ key: Date.now(), paid });
    return paid;
  }

  const rewardToast = reward ? (
    <div key={reward.key} className="pointer-events-none absolute inset-x-0 top-[17%] z-[60] flex justify-center">
      <style>{`@keyframes lessonRewardPop{0%{opacity:0;transform:translateY(12px) scale(.9)}15%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-14px) scale(1)}}`}</style>
      <div className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-2 shadow-[0_8px_22px_rgba(60,45,120,.28)] [animation:lessonRewardPop_1700ms_ease-out_forwards]">
        {reward.paid ? (
          <>
            <span className="flex items-center gap-1.5 text-[17px] font-black text-[#c9862a]"><img src={coinIcon} alt="" className="h-6 w-6" />+{ECONOMY_RULES.practiceRewardCoins}</span>
            <span className="flex items-center gap-1.5 text-[17px] font-black text-[#5d57c9]"><img src={xpIcon} alt="" className="h-6 w-6" />+{ECONOMY_RULES.practiceRewardXp} XP</span>
          </>
        ) : (
          <span className="text-[13px] font-extrabold text-[#7b7a8c]">Награда за этот урок уже получена</span>
        )}
      </div>
    </div>
  ) : null;

  if (activeLesson === 'what-is-money') {
    return <><LessonOne onPracticeComplete={() => rewardPractice('what-is-money')} onBack={() => { onLessonTransition?.('exit'); setActiveLesson(null); onFullScreenChange?.(false); }} />{rewardToast}</>;
  }
  if (activeLesson === 'needs-vs-wants') {
    return <><LessonTwo onPracticeComplete={() => rewardPractice('needs-vs-wants')} onBack={() => { onLessonTransition?.('exit'); setActiveLesson(null); onFullScreenChange?.(false); }} />{rewardToast}</>;
  }
  if (activeLesson === 'piggy-bank') {
    return <><LessonThree onPracticeComplete={() => rewardPractice('piggy-bank')} onBack={() => { onLessonTransition?.('exit'); setActiveLesson(null); onFullScreenChange?.(false); }} />{rewardToast}</>;
  }
  if (activeLesson === 'impulse-buying') {
    return <><LessonFour onPracticeComplete={() => rewardPractice('impulse-buying')} onBack={() => { onLessonTransition?.('exit'); setActiveLesson(null); onFullScreenChange?.(false); }} />{rewardToast}</>;
  }
  if (activeLesson === 'financial-goal') {
    return <><LessonFive onPracticeComplete={() => rewardPractice('financial-goal')} onBack={() => { onLessonTransition?.('exit'); setActiveLesson(null); onFullScreenChange?.(false); }} />{rewardToast}</>;
  }
  if (activeLesson === 'plan-and-fact') {
    return <><LessonSix onPracticeComplete={() => rewardPractice('plan-and-fact')} onBack={() => { onLessonTransition?.('exit'); setActiveLesson(null); onFullScreenChange?.(false); }} />{rewardToast}</>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка с иллюстрацией */}
      <div
        className="relative h-[170px] shrink-0 overflow-hidden bg-[#7d6270] transition-opacity duration-500"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '62% 38%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(70,52,66,0.92) 0%, rgba(70,52,66,0.72) 38%, rgba(70,52,66,0) 62%)',
          }}
        />

        <div
          className="safe-area-topbar relative flex items-start justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        >
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-1.5 backdrop-blur-md"
            style={{
              background: 'rgba(26,20,40,0.30)',
              borderColor: 'rgba(255,255,255,0.30)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            }}
          >
            <img src={coinIcon} alt="" className="h-6 w-6" />
            <span className="text-[15px] font-bold leading-none text-white">{coins}</span>
            <button
              onClick={onOpenEarnModal}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition active:scale-95"
              style={{ background: VIOLET }}
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-3 px-4">
          <div className="flex items-center gap-2">
            <img src={bookHero} alt="" className="h-7 w-7" />
            <h1
              className="text-[26px] font-extrabold leading-none text-white"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}
            >
              Уроки
            </h1>
          </div>
          <p
            className="mt-1.5 whitespace-pre-line text-[13px] font-semibold leading-tight text-white/95"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {'6 уроков и практика\nпро настоящие финансовые решения!'}
          </p>
        </div>
      </div>

      {/* Кремовый лист поверх шапки */}
      <div
        className="-mt-5 flex-1 overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-4 pt-4 transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Карточка уровня */}
        <div className="relative rounded-[22px] bg-white/70 p-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <IconStar className="h-9 w-9 shrink-0 drop-shadow" />
            <div className="min-w-0 flex-1">
              <div
                className="w-fit rounded-full px-3 py-1 text-[13px] font-bold text-white"
                style={{ background: VIOLET }}
              >
                Уровень {level}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="h-[9px] flex-1 overflow-hidden rounded-full"
                  style={{ background: 'rgba(120,110,150,0.22)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${xpPercent}%`, background: VIOLET }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-bold" style={{ color: '#5c5876' }}>
                  {xp} / {xpToNext} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Курс «Монетки под контролем»
        </h2>

        {/* Три короткие темы по два урока — тема заблокирована, пока не
            наступил её период (см. LESSON_THEMES выше). В открытой теме
            уроки всё равно проходятся строго по порядку: пока предыдущий
            не завершён, кнопка "Начать" у следующего урока серая. */}
        <div className="mt-2.5 flex flex-col gap-4">
          {LESSON_THEMES.map((theme) => {
            const themeLocked = theme.periodId > currentPeriodId;
            return (
            <section key={theme.title}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[13px] font-extrabold" style={{ color: themeLocked ? '#a7a2b8' : '#5d57c9' }}>
                  {theme.title}
                </h3>
                {themeLocked && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8e5f0] text-[#9a95ae]">
                    <IconLock className="h-3 w-3" />
                  </span>
                )}
                <div className="h-px flex-1 bg-[#ded8ef]" />
                {themeLocked && (
                  <span className="shrink-0 text-[9.5px] font-bold text-[#a7a2b8]">С периода {theme.periodId}</span>
                )}
              </div>
              <div className="flex flex-col gap-2.5">
              {list.filter((lesson) => theme.lessonIds.includes(lesson.id)).map((lesson) => (
            (() => {
              const lessonCompleted = completedLessonIds.includes(lesson.id);
              const previousLesson = list.find((item) => item.step === lesson.step - 1);
              const waitingForPreviousLesson = !lessonCompleted
                && previousLesson !== undefined
                && !completedLessonIds.includes(previousLesson.id);
              return (
            <div
              key={lesson.id}
              data-tour={lesson.id === 'what-is-money' ? 'lessons-first' : undefined}
              aria-disabled={themeLocked}
              className={`relative flex min-h-[100px] gap-3 rounded-[22px] p-2.5 shadow-sm transition ${
                themeLocked ? 'bg-white/50 grayscale' : 'bg-white/80'
              }`}
            >
              <div className="relative h-[70px] w-[70px] shrink-0">
                <img
                  src={lesson.image}
                  alt=""
                  className={`h-full w-full rounded-[16px] object-cover ${themeLocked ? 'opacity-60' : ''}`}
                />
                {lessonCompleted && (
                  <span
                    aria-label="Урок пройден"
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-white shadow-md"
                    style={{ background: GREEN }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                )}
              </div>
              <div className={`min-w-0 flex-1 pr-24 ${themeLocked ? 'opacity-60' : ''}`}>
                <div className="line-clamp-2 text-[13px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                  {lesson.title}
                </div>
                <p
                  className="mt-1 truncate text-[10.5px] leading-tight"
                  style={{ color: '#7b7a8c' }}
                >
                  {lesson.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <img src={coinIcon} alt="" className="h-4 w-4" />
                    <span className="text-[11px] font-bold" style={{ color: '#4a4560' }}>
                      +{ECONOMY_RULES.practiceRewardCoins}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <img src={xpIcon} alt="" className="h-4 w-4" />
                    <span className="text-[11px] font-bold" style={{ color: '#4a4560' }}>
                      +{ECONOMY_RULES.practiceRewardXp} XP × 5
                    </span>
                  </span>
                </div>
              </div>

              <span
                className="absolute right-2.5 top-2.5 rounded-full px-2 py-[3px] text-[10px] font-bold"
                style={{ background: 'rgba(120,110,150,0.18)', color: '#7b7a8c' }}
              >
                {lesson.step}/{lesson.total}
              </span>
              {themeLocked ? (
                <span className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#d9d4c6] text-[#8a8579]">
                  <IconLock className="h-4 w-4" />
                </span>
              ) : (
                <button
                  disabled={waitingForPreviousLesson}
                  aria-disabled={waitingForPreviousLesson}
                  onClick={() => { if (lesson.id === 'what-is-money' || lesson.id === 'needs-vs-wants' || lesson.id === 'piggy-bank' || lesson.id === 'impulse-buying' || lesson.id === 'financial-goal' || lesson.id === 'plan-and-fact') { onLessonTransition?.('enter'); setActiveLesson(lesson.id); onFullScreenChange?.(true); } }}
                  className={`absolute bottom-2.5 right-2.5 rounded-full px-4 py-1.5 text-[13px] font-bold text-white transition ${
                    waitingForPreviousLesson
                      ? 'cursor-not-allowed'
                      : 'active:translate-y-[2px] active:scale-[0.98]'
                  }`}
                  style={waitingForPreviousLesson ? {
                    background: 'linear-gradient(180deg, #c9c6cf 0%, #aaa6b1 100%)',
                    boxShadow:
                      'inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(112,108,120,0.45), 0 3px 8px rgba(85,80,95,0.16)',
                  } : lessonCompleted ? {
                    background: GREEN,
                    boxShadow:
                      'inset 0 2px 0 rgba(170,240,185,0.6), inset 0 -2px 0 rgba(30,120,58,0.8), 0 4px 10px rgba(47,166,79,0.28)',
                  } : {
                    background: VIOLET,
                    boxShadow:
                      'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
                  }}
                >
                  {lessonCompleted ? 'Пройдено' : 'Начать'}
                </button>
              )}
            </div>
              );
            })()
              ))}
              </div>
            </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}
