import { useEffect, useState } from 'react';
import heroImg from '../assets/heroes/hero-day.jpg';
import coinIcon from '../assets/icons/coin.png';
import {
  IconArrowLeft,
  IconPlus,
  IconCalendar,
  IconFlame,
  IconGift,
  IconChevronRight,
  IconHeart,
  IconSmile,
  IconBowl,
  IconGamepad,
  IconBook,
  IconCart,
  IconMoon,
  IconCheck,
  IconStar,
} from '../components/icons';
import { dayTasks, type DayTask, type DayTaskIcon } from '../data/dayData';
import { useEconomyStore } from '../features/economy/economyStore';
import { usePetStore } from '../features/pet/petStore';
import { useDayProgressStore, STREAK_MILESTONE_STEP } from '../features/progress/dayProgressStore';

// Разовая награда за серию дней — тестовое значение баланса, до появления
// полноценной системы прогресса по серии (Game Core: progress).
const STREAK_BONUS_COINS = 100;

// Задания, которые можно выполнить прямо с этого экрана одной кнопкой —
// применяют награду к питомцу/экономике и отмечают задание выполненным.
// «lesson» намеренно не входит сюда (переход на урок пока вне скоупа),
// «shop» засчитывается автоматически при покупке (см. purchase.ts).
const DIRECT_ACTION_LABEL: Record<string, string> = {
  feed: 'Покормить',
  play: 'Играть',
  sleep: 'Уложить',
};

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const BTN_SHADOW =
  'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)';

export type DayTab = 'tasks' | 'rewards';
const TABS: { id: DayTab; label: string }[] = [
  { id: 'tasks', label: 'Задания дня' },
  { id: 'rewards', label: 'Награды' },
];

// Иконка + пастельный цвет квадрата под неё — свой набор на тип задания,
// чтобы ряды считывались с одного взгляда, как в референсе.
const TASK_ICON: Record<DayTaskIcon, { Icon: typeof IconBowl; bg: string; fg: string }> = {
  bowl: { Icon: IconBowl, bg: '#e0f3e3', fg: '#4a9d63' },
  game: { Icon: IconGamepad, bg: '#e7e4fb', fg: '#6a63e0' },
  book: { Icon: IconBook, bg: '#e3e0fb', fg: '#5d57e0' },
  cart: { Icon: IconCart, bg: '#e3e0fb', fg: '#5d57e0' },
  moon: { Icon: IconMoon, bg: '#2c2a5e', fg: '#e7e4fb' },
};

interface Props {
  bottomInset?: number;
  coins: number;
  /** Вкладка, с которой открывается экран — например "Награды" по ссылке из окошка "+" */
  initialTab?: DayTab;
  onClose: () => void;
  /** плюсик у баланса — то же окно "как заработать монеты", что и на главной */
  onOpenEarnModal?: () => void;
}

export default function Day({ bottomInset = 0, coins, initialTab, onClose, onOpenEarnModal }: Props) {
  const [entered, setEntered] = useState(false);
  const [tab, setTab] = useState<DayTab>(initialTab ?? 'tasks');
  const applyCoinsDelta = useEconomyStore((s) => s.applyCoinsDelta);
  const applyPetDelta = usePetStore((s) => s.applyDelta);
  const completedTaskIds = useDayProgressStore((s) => s.completedTaskIds);
  const completeTask = useDayProgressStore((s) => s.completeTask);
  const streakDays = useDayProgressStore((s) => s.streak);
  const claimedStreakMilestones = useDayProgressStore((s) => s.claimedStreakMilestones);
  const claimStreakMilestone = useDayProgressStore((s) => s.claimStreakMilestone);
  const isTaskDone = (id: string) => completedTaskIds.includes(id);
  const tasksDone = dayTasks.filter((t) => isTaskDone(t.id)).length;
  // "Текущий день" — тот же счётчик, что и серия: без выполненных заданий
  // сегодня отдельного дня-программы пока нет, это одна и та же цифра.
  const currentDay = streakDays;

  // Баннер бонуса — не постоянный, а разовое предложение на каждую веху серии
  // (каждые STREAK_MILESTONE_STEP дней подряд), см. запрос: "появляется только
  // при сериях кратных 5".
  const streakMilestoneReached = streakDays > 0 && streakDays % STREAK_MILESTONE_STEP === 0;
  const streakClaimed = claimedStreakMilestones.includes(streakDays);

  function claimStreakBonus() {
    if (streakClaimed) return;
    applyCoinsDelta(STREAK_BONUS_COINS, 'Бонус за серию дней');
    claimStreakMilestone(streakDays);
  }

  // Выполнить задание "одной кнопкой" прямо здесь: применяет награду
  // к питомцу/балансу и один раз (в день) отмечает задание сделанным.
  function completeDirectTask(task: DayTask) {
    if (isTaskDone(task.id)) return;
    if (task.rewardHeart || task.rewardSmile) {
      applyPetDelta({ health: task.rewardHeart, happiness: task.rewardSmile });
    }
    if (task.rewardCoins) {
      applyCoinsDelta(task.rewardCoins, `Задание дня: ${task.title}`);
    }
    completeTask(task.id);
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка с иллюстрацией */}
      <div
        className="relative h-[170px] shrink-0 overflow-hidden bg-[#4f5a73] transition-opacity duration-500"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '58% 35%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(40,45,64,0.88) 0%, rgba(40,45,64,0.62) 42%, rgba(40,45,64,0) 68%)',
          }}
        />

        <div className="relative flex items-start justify-between px-4 pt-4">
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
            <IconCalendar className="h-7 w-7 text-white drop-shadow" />
            <h1
              className="text-[26px] font-extrabold leading-none text-white"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}
            >
              День
            </h1>
          </div>
          <p
            className="mt-1.5 whitespace-pre-line text-[13px] font-semibold leading-tight text-white/95"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {'Выполняй задания, получай награды\nи делай своего питомца счастливее!'}
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
        {/* Текущий день + серия — один блок с акцентом на левой плашке */}
        <div className="flex items-center gap-3 rounded-[22px] bg-white/70 p-2.5 shadow-md">
          <div
            className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-[16px] px-3.5 py-2"
            style={{ background: VIOLET, boxShadow: '0 4px 10px rgba(92,90,216,0.30)' }}
          >
            <span className="whitespace-nowrap text-[9.5px] font-bold leading-none text-white/85">
              Текущий день
            </span>
            <span className="text-[22px] font-extrabold leading-none text-white">{currentDay}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <IconFlame className="h-5 w-5 shrink-0" style={streakDays === 0 ? { opacity: 0.4 } : undefined} />
              <span className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
                Серия дней
              </span>
              <span className="text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {streakDays}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-tight" style={{ color: '#7b7a8c' }}>
              {streakDays === 0
                ? 'Выполни любое задание сегодня, чтобы начать серию!'
                : 'Продолжай, чтобы получить особую награду!'}
            </p>
          </div>

          {/* Раньше у этой кнопки не было onClick вообще — визуально выглядела
              кликабельной (иконка + шеврон), но ничего не делала, что и
              создавало ощущение "случайного" поведения. Теперь явно и всегда
              ведёт на вкладку "Награды". */}
          <button
            onClick={() => setTab('rewards')}
            className="flex shrink-0 items-center gap-0.5 transition active:scale-95"
            aria-label="Награды"
          >
            <IconGift className="h-10 w-10 drop-shadow" />
            <IconChevronRight className="h-4 w-4" style={{ color: '#b5aec7' }} />
          </button>
        </div>

        {/* Переключатель вкладок */}
        <div className="mt-3 flex overflow-hidden rounded-[18px] bg-white/60 p-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 whitespace-nowrap rounded-[14px] px-1 py-2 text-[12.5px] font-bold transition"
                style={active ? { background: VIOLET, color: '#fff', boxShadow: '0 4px 10px rgba(92,90,216,0.28)' } : { color: '#7b7a8c' }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'tasks' ? (
          <>
            {/* Прогресс дня */}
            <div className="mt-3 flex items-center justify-between px-0.5">
              <span className="text-[12px] font-bold" style={{ color: '#7b7a8c' }}>
                Выполнено сегодня
              </span>
              <span className="text-[12px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {tasksDone}/{dayTasks.length}
              </span>
            </div>

            {/* Список заданий */}
            <div className="mt-2 flex flex-col gap-2.5">
              {dayTasks.map((task) => {
                const { Icon, bg, fg } = TASK_ICON[task.icon];
                const done = isTaskDone(task.id);
                // 'lesson' намеренно не выполняется прямо здесь (переход на урок вне
                // скоупа); 'shop' засчитывается только реальной покупкой в магазине.
                const isDirectAction = task.id in DIRECT_ACTION_LABEL;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-[20px] p-2.5 shadow-sm"
                    style={{ background: done ? 'rgba(120,190,140,0.16)' : 'rgba(255,255,255,0.8)' }}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
                      style={{ background: bg }}
                    >
                      <Icon className="h-6 w-6" style={{ color: fg }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                        {task.title}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] leading-tight" style={{ color: '#7b7a8c' }}>
                        {task.description}
                      </div>
                      <div className="mt-1 flex items-center gap-2.5">
                        {task.rewardHeart && (
                          <span className="flex items-center gap-0.5">
                            <IconHeart className="h-3.5 w-3.5" style={{ color: '#ef6d8a' }} />
                            <span className="text-[10.5px] font-bold" style={{ color: '#4a4560' }}>
                              +{task.rewardHeart}
                            </span>
                          </span>
                        )}
                        {task.rewardSmile && (
                          <span className="flex items-center gap-0.5">
                            <IconSmile className="h-3.5 w-3.5" style={{ color: '#eab53c' }} />
                            <span className="text-[10.5px] font-bold" style={{ color: '#4a4560' }}>
                              +{task.rewardSmile}
                            </span>
                          </span>
                        )}
                        {task.rewardCoins && (
                          <span className="flex items-center gap-0.5">
                            <img src={coinIcon} alt="" className="h-3.5 w-3.5" />
                            <span className="text-[10.5px] font-bold" style={{ color: '#4a4560' }}>
                              +{task.rewardCoins}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <IconStar className="h-3.5 w-3.5" />
                          <span className="text-[10.5px] font-bold" style={{ color: '#4a4560' }}>
                            +{task.xp} XP
                          </span>
                        </span>
                      </div>
                    </div>

                    {done ? (
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ background: '#4caf6d' }}
                      >
                        <IconCheck className="h-4 w-4" />
                      </span>
                    ) : isDirectAction ? (
                      <button
                        onClick={() => completeDirectTask(task)}
                        className="shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.98]"
                        style={{ background: VIOLET, boxShadow: BTN_SHADOW }}
                      >
                        {DIRECT_ACTION_LABEL[task.id]}
                      </button>
                    ) : task.id === 'lesson' ? (
                      // Переход на урок пока не подключаем (вне скоупа) — кнопка неактивна.
                      <button
                        disabled
                        className="shrink-0 cursor-default rounded-full px-4 py-1.5 text-[12.5px] font-bold text-white opacity-60"
                        style={{ background: VIOLET }}
                      >
                        Начать
                      </button>
                    ) : (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: 'rgba(120,110,150,0.14)', color: '#a19cb0' }}
                      >
                        0/1
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Баннер бонуса — разовое предложение на каждую веху серии (каждые
                STREAK_MILESTONE_STEP дней подряд), а не постоянный баннер */}
            {streakMilestoneReached && (
              <button
                onClick={claimStreakBonus}
                disabled={streakClaimed}
                className="mt-3 mb-1 flex w-full items-center gap-3 rounded-[20px] p-3 text-left transition active:scale-[0.98] disabled:active:scale-100"
                style={{
                  background: streakClaimed ? '#c9c2d8' : VIOLET,
                  boxShadow: streakClaimed ? undefined : '0 6px 16px rgba(92,90,216,0.30)',
                }}
              >
                <IconGift className="h-9 w-9 shrink-0 drop-shadow" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-extrabold text-white">Серия {streakDays} дней подряд!</div>
                  <div className="mt-0.5 text-[10.5px] leading-tight text-white/85">
                    {streakClaimed
                      ? `Получено +${STREAK_BONUS_COINS} монет`
                      : 'Особая награда за упорство — забери её!'}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white/20 px-3.5 py-1.5 text-[12px] font-bold text-white">
                  {streakClaimed ? 'Получено' : 'Получить'}
                </span>
              </button>
            )}
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-2 px-6 text-center">
            <IconGift className="h-12 w-12 opacity-70" />
            <p className="text-[13.5px] font-bold" style={{ color: '#7b7a8c' }}>
              Награды появятся здесь совсем скоро
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
