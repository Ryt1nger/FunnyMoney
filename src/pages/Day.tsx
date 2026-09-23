import { useEffect, useRef, useState } from 'react';
import heroImg from '../assets/heroes/hero-day.jpg';
import coinIcon from '../assets/icons/coin.png';
import heartMetricIcon from '../assets/icons/metrics/heart-3d.png';
import smileMetricIcon from '../assets/icons/metrics/smile-3d.png';
import coinsMetricIcon from '../assets/icons/metrics/coins-3d.png';
import {
  IconArrowLeft,
  IconPlus,
  IconCalendar,
  IconFlame,
  IconGift,
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

// Задания, которые выполняются в два шага прямо с этого экрана:
// 1) кнопка "Покормить/Играть/Уложить" отправляет ребёнка делать само действие
//    (закрывает экран "День" и возвращает в комнату к питомцу);
// 2) когда он возвращается на экран "День", кнопка уже зелёная ("Получить") —
//    и только по нажатию на неё начисляется награда (см. startedTaskIds в сторе).
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
// Зелёная кнопка "Получить" — тот же приём тени, что и у фиолетовой, но в
// зелёной гамме, чтобы состояние "награда ждёт" читалось с одного взгляда.
const GREEN = 'linear-gradient(180deg, #6ecb8c 0%, #4caf6d 55%, #3c9b5c 100%)';
const GREEN_BTN_SHADOW =
  'inset 0 2px 0 rgba(195,240,210,0.55), inset 0 -2px 0 rgba(35,110,65,0.75), 0 4px 10px rgba(60,150,90,0.30)';
// На главной центр ряда метрик находится примерно на четверти высоты экрана.
// Одна константа используется и плитками, и точкой назначения летящих наград,
// чтобы обе анимации всегда сходились в одном месте.
const REWARD_STATS_TOP_RATIO = 0.25;

// Иконка + пастельный цвет квадрата под неё — свой набор на тип задания,
// чтобы ряды считывались с одного взгляда, как в референсе.
const TASK_ICON: Record<DayTaskIcon, { Icon: typeof IconBowl; bg: string; fg: string }> = {
  bowl: { Icon: IconBowl, bg: '#e0f3e3', fg: '#4a9d63' },
  game: { Icon: IconGamepad, bg: '#e7e4fb', fg: '#6a63e0' },
  book: { Icon: IconBook, bg: '#e3e0fb', fg: '#5d57e0' },
  cart: { Icon: IconCart, bg: '#e3e0fb', fg: '#5d57e0' },
  moon: { Icon: IconMoon, bg: '#2c2a5e', fg: '#e7e4fb' },
};

type RewardStatKind = 'health' | 'happiness' | 'wealth';
interface RewardStat { kind: RewardStatKind; label: string; value: number; icon: string; color: string; }
type FlyingRewardKind = 'heart' | 'smile' | 'coin' | 'star';
interface FlyingReward { id: number; kind: FlyingRewardKind; x: number; y: number; dx: number; dy: number; flying: boolean; }

interface Props {
  bottomInset?: number;
  coins: number;
  onClose: () => void;
  /** плюсик у баланса — то же окно "как заработать монеты", что и на главной */
  onOpenEarnModal?: () => void;
}

export default function Day({ bottomInset = 0, coins, onClose, onOpenEarnModal }: Props) {
  const [entered, setEntered] = useState(false);
  const applyCoinsDelta = useEconomyStore((s) => s.applyCoinsDelta);
  const applyPetDelta = usePetStore((s) => s.applyDelta);
  const addXp = usePetStore((s) => s.addXp);
  const completedTaskIds = useDayProgressStore((s) => s.completedTaskIds);
  const health = usePetStore((s) => s.pet?.health ?? 0);
  const happiness = usePetStore((s) => s.pet?.happiness ?? 0);
  const wealth = useEconomyStore((s) => Math.max(0, Math.min(100, s.wealthScore)));
  const startedTaskIds = useDayProgressStore((s) => s.startedTaskIds);
  const startTask = useDayProgressStore((s) => s.startTask);
  const completeTask = useDayProgressStore((s) => s.completeTask);
  const streakDays = useDayProgressStore((s) => s.streak);
  const claimedStreakMilestones = useDayProgressStore((s) => s.claimedStreakMilestones);
  const claimStreakMilestone = useDayProgressStore((s) => s.claimStreakMilestone);
  const isTaskDone = (id: string) => completedTaskIds.includes(id);
  const isTaskStarted = (id: string) => startedTaskIds.includes(id);
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

  // Начислить награду задания: применяет её к питомцу/балансу и один раз
  // (в день) отмечает задание полученным. Сама анимация запускается отдельно
  // в claimDirectTask — completeDirectTask переиспользуется и для "shop"/"lesson"
  // путей, где полёта иконок нет.
  function completeDirectTask(task: DayTask) {
    if (isTaskDone(task.id)) return;
    if (task.rewardHeart || task.rewardSmile) {
      applyPetDelta({ health: task.rewardHeart, happiness: task.rewardSmile });
    }
    if (task.rewardCoins) {
      applyCoinsDelta(task.rewardCoins, `Задание дня: ${task.title}`);
    }
    // Раньше опыт нигде не накапливался (XP на экране "Прогресс" был
    // захардкожен) — теперь реально начисляется в petStore при каждой
    // полученной награде.
    addXp(task.xp);
    completeTask(task.id);
  }

  const [rewardStats, setRewardStats] = useState<RewardStat[]>([]);
  const [rewardStatsVisible, setRewardStatsVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const nextRewardId = useRef(0);
  const [flyingRewards, setFlyingRewards] = useState<FlyingReward[]>([]);

  function showRewardStats(task: DayTask) {
    const stats: RewardStat[] = [];
    if (task.rewardHeart) stats.push({ kind: 'health', label: 'Здоровье', value: Math.min(100, health + task.rewardHeart), icon: heartMetricIcon, color: '#fb7f92' });
    if (task.rewardSmile) stats.push({ kind: 'happiness', label: 'Счастье', value: Math.min(100, happiness + task.rewardSmile), icon: smileMetricIcon, color: '#f9cb63' });
    if (task.rewardCoins) stats.push({ kind: 'wealth', label: 'Богатство', value: wealth, icon: coinsMetricIcon, color: '#63d98b' });
    if (!stats.length) return;
    setRewardStats(stats);
    setRewardStatsVisible(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setRewardStatsVisible(true)));
    window.setTimeout(() => setRewardStatsVisible(false), 2200);
    window.setTimeout(() => setRewardStats([]), 2700);
  }

  function flyRewardToStats(originEl: HTMLElement, task: DayTask) {
    const root = rootRef.current;
    if (!root) { showRewardStats(task); return; }
    const rootRect = root.getBoundingClientRect();
    const originRect = originEl.getBoundingClientRect();
    const x = originRect.left + originRect.width / 2 - rootRect.left;
    const y = originRect.top + originRect.height / 2 - rootRect.top;
    const targetX = rootRect.width / 2;
    const targetY = rootRect.height * REWARD_STATS_TOP_RATIO;
    const kinds: FlyingRewardKind[] = [];
    if (task.rewardCoins) kinds.push('coin');
    if (task.rewardHeart) kinds.push('heart');
    if (task.rewardSmile) kinds.push('smile');
    kinds.push('star');
    const created = kinds.map((kind) => ({ id: nextRewardId.current++, kind, x, y, dx: targetX - x, dy: targetY - y, flying: false }));
    setFlyingRewards(created);
    showRewardStats(task);
    requestAnimationFrame(() => requestAnimationFrame(() => setFlyingRewards((prev) => prev.map((item) => ({ ...item, flying: true })))));
    window.setTimeout(() => setFlyingRewards([]), 820);
  }

  // Шаг 1: ребёнок жмёт "Покормить"/"Играть"/"Уложить" — задание помечается
  // начатым (кнопка станет зелёной), а экран "День" закрывается, отправляя
  // обратно в комнату к питомцу, где и происходит само действие.
  function startDirectTask(task: DayTask) {
    startTask(task.id);
    onClose();
  }

  // Шаг 2: по зелёной кнопке "Получить" — награда действительно начисляется,
  // с анимацией иконок, летящих к балансу.
  function claimDirectTask(task: DayTask, originEl: HTMLElement) {
    if (isTaskDone(task.id)) return;
    completeDirectTask(task);
    flyRewardToStats(originEl, task);
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div ref={rootRef} className="relative flex h-full flex-col overflow-hidden bg-[#fbefe1]">
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
        <div className="flex items-center gap-2.5 rounded-[20px] bg-white/70 p-2 shadow-md">
          <div
            className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-[15px] px-3 py-1.5"
            style={{ background: VIOLET, boxShadow: '0 4px 10px rgba(92,90,216,0.30)' }}
          >
            <span className="whitespace-nowrap text-[9.5px] font-bold leading-none text-white/85">
              Текущий день
            </span>
            <span className="text-[20px] font-extrabold leading-none text-white">{currentDay}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <IconFlame className="h-5 w-5 shrink-0" style={streakDays === 0 ? { opacity: 0.4 } : undefined} />
              <span className="text-[12px] font-bold" style={{ color: '#2c2a5e' }}>
                Серия дней
              </span>
              <span className="text-[14px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {streakDays}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-tight" style={{ color: '#7b7a8c' }}>
              {streakDays === 0
                ? 'Выполни любое задание сегодня, чтобы начать серию!'
                : 'Продолжай, чтобы получить особую награду!'}
            </p>
          </div>
        </div>

        {/* Заголовок раздела — единственная вкладка "Награды" убрана: делать
            здесь больше нечего, кроме списка заданий дня. */}
        <div className="mt-4 px-0.5 text-[13px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Задания дня
        </div>

        {/* Прогресс дня */}
        <div className="mt-2 flex items-center justify-between px-0.5">
          <span className="text-[12px] font-bold" style={{ color: '#7b7a8c' }}>
            Выполнено сегодня
          </span>
          <span className="text-[12px] font-extrabold" style={{ color: '#2c2a5e' }}>
            {tasksDone}/{dayTasks.length}
          </span>
        </div>

        {/* Список заданий */}
        <div className="mt-1.5 flex flex-col gap-2">
          {dayTasks.map((task) => {
            const { Icon, bg, fg } = TASK_ICON[task.icon];
            const done = isTaskDone(task.id);
            const started = isTaskStarted(task.id);
            // 'lesson' намеренно не выполняется прямо здесь (переход на урок вне
            // скоупа); 'shop' засчитывается только реальной покупкой в магазине.
            const isDirectAction = task.id in DIRECT_ACTION_LABEL;
            return (
              <div
                key={task.id}
                className="flex items-center gap-2.5 rounded-[18px] p-2 shadow-sm"
                style={{ background: done ? 'rgba(120,190,140,0.16)' : 'rgba(255,255,255,0.8)' }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ background: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: fg }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                    {task.title}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] leading-tight" style={{ color: '#7b7a8c' }}>
                    {task.description}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {task.rewardHeart && (
                      <span className="flex items-center gap-0.5">
                        <IconHeart className="h-3 w-3" style={{ color: '#ef6d8a' }} />
                        <span className="text-[9.5px] font-bold" style={{ color: '#4a4560' }}>
                          +{task.rewardHeart}
                        </span>
                      </span>
                    )}
                    {task.rewardSmile && (
                      <span className="flex items-center gap-0.5">
                        <IconSmile className="h-3 w-3" style={{ color: '#eab53c' }} />
                        <span className="text-[9.5px] font-bold" style={{ color: '#4a4560' }}>
                          +{task.rewardSmile}
                        </span>
                      </span>
                    )}
                    {task.rewardCoins && (
                      <span className="flex items-center gap-0.5">
                        <img src={coinIcon} alt="" className="h-3 w-3" />
                        <span className="text-[9.5px] font-bold" style={{ color: '#4a4560' }}>
                          +{task.rewardCoins}
                        </span>
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <IconStar className="h-3 w-3" />
                      <span className="text-[9.5px] font-bold" style={{ color: '#4a4560' }}>
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
                  started ? (
                    <button
                      onClick={(event) => claimDirectTask(task, event.currentTarget)}
                      className="shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.98]"
                      style={{ background: GREEN, boxShadow: GREEN_BTN_SHADOW }}
                    >
                      Получить
                    </button>
                  ) : (
                    <button
                      onClick={() => startDirectTask(task)}
                      className="shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.98]"
                      style={{ background: VIOLET, boxShadow: BTN_SHADOW }}
                    >
                      {DIRECT_ACTION_LABEL[task.id]}
                    </button>
                  )
                ) : task.id === 'lesson' ? (
                  // Переход на урок пока не подключаем (вне скоупа) — кнопка неактивна.
                  <button
                    disabled
                    className="shrink-0 cursor-default rounded-full px-3.5 py-1.5 text-[11.5px] font-bold text-white opacity-60"
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
      </div>

      {flyingRewards.map((reward) => (
        <div
          key={reward.id}
          className="pointer-events-none absolute z-[90] flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-all duration-[650ms] ease-out"
          style={{
            left: reward.x,
            top: reward.y,
            transform: reward.flying ? `translate(-50%, -50%) translate(${reward.dx}px, ${reward.dy}px) scale(.45)` : 'translate(-50%, -50%) scale(1)',
            opacity: reward.flying ? 0 : 1,
          }}
        >
          {reward.kind === 'coin' && <img src={coinIcon} alt="" className="h-full w-full drop-shadow-lg" />}
          {reward.kind === 'heart' && <IconHeart className="h-full w-full drop-shadow-lg" style={{ color: '#ef6d8a' }} />}
          {reward.kind === 'smile' && <IconSmile className="h-full w-full drop-shadow-lg" style={{ color: '#eab53c' }} />}
          {reward.kind === 'star' && <IconStar className="h-full w-full drop-shadow-lg" />}
        </div>
      ))}

      {rewardStats.length > 0 && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[80] flex -translate-y-1/2 justify-center px-3 transition-all duration-500 ease-out"
          style={{ top: `${REWARD_STATS_TOP_RATIO * 100}%`, opacity: rewardStatsVisible ? 1 : 0, transform: `translateY(-50%) scale(${rewardStatsVisible ? 1 : 0.94})` }}
        >
          <div className="flex max-w-full flex-wrap justify-center gap-2.5">
            {rewardStats.map((stat) => (
              <div key={stat.kind} className="flex h-[70px] w-[138px] items-center gap-2 rounded-[22px] border border-white/40 px-2.5 shadow-[0_8px_24px_rgba(24,20,50,0.24)] backdrop-blur-md" style={{ background: 'linear-gradient(110deg, rgba(52,35,45,0.86), rgba(136,131,142,0.76))' }}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: stat.color }}><img src={stat.icon} alt="" className="h-9 w-9 object-contain" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-extrabold text-white">{stat.label}</div><div className="mt-1 flex items-center gap-1"><div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full" style={{ width: `${stat.value}%`, background: stat.color }} /></div><span className="text-[14px] font-black text-white">{stat.value}%</span></div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
