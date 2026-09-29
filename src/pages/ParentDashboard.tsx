import { useMemo, useState, type ReactNode } from 'react';
import bearAvatar from '../assets/pet/bear-avatar.png';
import coinIcon from '../assets/icons/coin.png';
import catFood from '../assets/icons/shop/cat-food.png';
import catToys from '../assets/icons/shop/cat-toys.png';
import catClothes from '../assets/icons/shop/cat-clothes.png';
import catInterior from '../assets/icons/shop/cat-interior.png';
import MaskIcon from '../components/MaskIcon';
import Toggle from '../components/Toggle';
import {
  IconArrowLeft,
  IconSettingsGear,
  IconChevronRight,
  IconHeart,
  IconSmile,
  IconBook,
  IconCart,
  IconFlame,
  IconBell,
  IconGift,
  IconFlag,
  IconPiggy,
  IconCoinStack,
  IconAlarmClock,
} from '../components/icons';
import { progressLevels, MAX_LEVEL } from '../data/progressLevels';
import {
  earnedByDay,
  earnedByWeek,
  balanceByDay,
  balanceByWeek,
  playTimeByDay,
  playTimeByWeek,
  purchasesByCategory,
  type PurchaseCategoryId,
  type ChartPoint,
} from '../data/parentDashboardData';
import { dayTasks } from '../data/dayData';
import { lessonCards } from '../data/lessonsData';
import { usePetStore } from '../features/pet/petStore';
import { useEconomyStore } from '../features/economy/economyStore';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { useDayProgressStore } from '../features/progress/dayProgressStore';
import { useLessonProgressStore } from '../features/progress/lessonProgressStore';
import { usePeriodStore } from '../features/economy/periodStore';
import { usePeriodEventStore } from '../features/periodEvents/eventStore';
import { getPeriodEvents, type PeriodId } from '../features/periodEvents/eventData';
import { useSettingsStore } from '../features/settings/settingsStore';
import { useSessionStore } from '../features/progress/sessionStore';
import type { Transaction, CareInteraction } from '../types';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const VIOLET_SOLID = '#7574f0';
const GREEN = '#3f9a63';
const SAVINGS_GREEN = '#1f9d74';
const RED = '#c23a52';
const AMBER = '#b9790f';

const CATEGORY_ICONS: Record<PurchaseCategoryId, string> = {
  food: catFood,
  toys: catToys,
  clothes: catClothes,
  rooms: catInterior,
};

const BUDGET_CATEGORY_LABELS: Record<'mandatory' | 'optional' | 'savings', string> = {
  mandatory: 'Обязательное',
  optional: 'Желания',
  savings: 'Накопления',
};

const TX_CATEGORY_LABELS: Record<NonNullable<Transaction['category']>, string> = {
  mandatory: 'Обязательное',
  optional: 'Желания',
  savings: 'Копилка',
  goal: 'Цель',
  reward: 'Награда',
};

const CARE_ACTION_LABELS: Record<CareInteraction['action'], string> = {
  feed: 'Кормление',
  buyToy: 'Игрушка',
  medicine: 'Лекарство',
};

const CARE_SOURCE_LABELS: Record<CareInteraction['source'], string> = {
  shop: 'Покупка',
  free_action: 'Бесплатное действие',
  event: 'Ответ на событие',
};

interface Props {
  bottomInset?: number;
  onBack: () => void;
  /** шестерёнка в шапке — открывает служебный раздел (о приложении, сброс прогресса) */
  onOpenZone: () => void;
}

type AnalyticsRange = 'week' | 'month' | 'current';

function SectionCard({ children }: { children: ReactNode }) {
  return <div className="rounded-[20px] bg-white/85 p-3.5 shadow-sm">{children}</div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 mt-5 text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
      {children}
    </h2>
  );
}

/** Заголовок раздела с маленьким значком в кружке — используется там, где
 * иконка помогает быстро опознать блок в длинном экране. */
function SectionHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-2.5 mt-5 flex items-center gap-2">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(139,136,244,0.16)', color: VIOLET_SOLID }}
      >
        {icon}
      </span>
      <h2 className="text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
        {children}
      </h2>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: 'good' | 'warn' | 'bad'; children: ReactNode }) {
  const map = {
    good: { bg: 'rgba(63,154,99,0.14)', color: GREEN },
    warn: { bg: 'rgba(237,162,31,0.16)', color: AMBER },
    bad: { bg: 'rgba(239,64,96,0.14)', color: RED },
  } as const;
  const c = map[tone];
  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: c.bg, color: c.color }}>
      {children}
    </span>
  );
}

function MeterBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-[7px] overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.16)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

/** Линия по неделям — точек мало (4), значения подписаны прямо на графике вместо
 * отдельной всплывающей подсказки. Один ряд — легенда не нужна, заголовок карточки
 * и так называет метрику. Шкала считается от реальных данных, а не фиксирована. */
function EarnedLineChart({ data, ariaLabel = 'Заработанные монеты по неделям', color = VIOLET_SOLID }: { data: ChartPoint[]; ariaLabel?: string; color?: string }) {
  const width = 300;
  const height = 108;
  const padX = 18;
  const padTop = 22;
  const padBottom = 20;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b88f4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8b88f4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padX} y1={padTop + innerH} x2={width - padX} y2={padTop + innerH} stroke="rgba(120,110,150,0.18)" strokeWidth="1" />
      <path d={areaPath} fill="url(#growthFill)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2c2a5e">
            {p.value}
          </text>
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="9" fill="#9a8f80">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Столбики по дням — простые div'ы, как остальные полосы прогресса в приложении. */
function EarnedBarChart({ data, ariaLabel = 'Заработанные монеты по дням', color = VIOLET }: { data: ChartPoint[]; ariaLabel?: string; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-[92px] items-end gap-2" role="img" aria-label={ariaLabel}>
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-[68px] w-full items-end overflow-hidden rounded-[8px]" style={{ background: 'rgba(120,110,150,0.12)' }}>
            <div
              className="w-full rounded-[8px]"
              style={{ height: d.value > 0 ? `${Math.max(6, (d.value / max) * 100)}%` : '0%', background: color }}
            />
          </div>
          <span className="text-[10px] font-semibold capitalize" style={{ color: '#9a8f80' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Кольцевая диаграмма из 2-3 долей одной суммы — используется для
 * распределения денег (свободные / потрачено / накоплено). Секторы рисуются
 * одним обходом окружности через strokeDasharray/strokeDashoffset. */
function DonutChart({ slices, size = 128, strokeWidth = 16 }: { slices: { value: number; color: string }[]; size?: number; strokeWidth?: number }) {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Распределение денег">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(120,110,150,0.14)" strokeWidth={strokeWidth} />
      {total > 0 &&
        slices
          .filter((s) => s.value > 0)
          .map((s, i) => {
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += dash;
            return el;
          })}
    </svg>
  );
}

/** Строка «план / факт» для одной категории бюджета периода — прогресс-бар
 * закрашивается зелёным в пределах плана и красным при перерасходе. */
function BudgetCategoryRow({ label, plan, actual }: { label: string; plan: number; actual: number }) {
  const over = actual > plan;
  const percent = plan > 0 ? Math.round((actual / plan) * 100) : 0;
  const statusText =
    actual === 0
      ? 'Пока не использовано'
      : over
        ? `Перерасход ${actual - plan}`
        : actual === plan
          ? 'План выполнен'
          : `Осталось ${plan - actual}`;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
          {label}
        </span>
        <span className="shrink-0 text-[11.5px] font-bold" style={{ color: over ? RED : '#7b7a8c' }}>
          {statusText}
        </span>
      </div>
      <div className="mt-1 text-[11px]" style={{ color: '#9a8f80' }}>
        План {plan} · Факт {actual}
      </div>
      <div className="mt-1.5">
        <MeterBar value={Math.min(100, percent)} color={over ? RED : GREEN} />
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} мин`;
  if (minutes === 0) return `${hours} ч`;
  return `${hours} ч ${minutes} мин`;
}

function formatDateTime(timestamp: number) {
  const d = new Date(timestamp);
  return (
    d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' · ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  );
}

function txColor(tx: Transaction): string {
  if (tx.category === 'savings') return SAVINGS_GREEN;
  return tx.amount >= 0 ? GREEN : RED;
}

interface Hint {
  id: string;
  text: string;
}

export default function ParentDashboard({ bottomInset = 0, onBack, onOpenZone }: Props) {
  // ===== Реальные данные из существующих store — без единого мокового числа =====
  const pet = usePetStore((s) => s.pet);

  const coins = useEconomyStore((s) => s.coins);
  const totalEarned = useEconomyStore((s) => s.totalEarned);
  const totalSpent = useEconomyStore((s) => s.totalSpent);
  const totalSaved = useEconomyStore((s) => s.totalSaved);
  const savingsBalanceRaw = useEconomyStore((s) => s.savingsBalance);
  const savingsGoal = useEconomyStore((s) => s.savingsGoal);
  const transactions = useEconomyStore((s) => s.transactions);
  const savingsBalance = savingsBalanceRaw ?? totalSaved;

  const ownedRoomIds = useInventoryStore((s) => s.ownedRoomIds);
  const ownedProductIds = useInventoryStore((s) => s.ownedProductIds);

  const streakDays = useDayProgressStore((s) => s.streak);
  const bestStreak = useDayProgressStore((s) => s.bestStreak ?? s.streak);
  const completedTaskIds = useDayProgressStore((s) => s.completedTaskIds);

  const completedLessonIds = useLessonProgressStore((s) => s.completedLessonIds);
  const practiceRewards = useLessonProgressStore((s) => s.practiceRewards);

  const periodId = usePeriodStore((s) => s.id);
  const periodStatus = usePeriodStore((s) => s.status);
  const periodPlan = usePeriodStore((s) => s.plan);
  const periodActual = usePeriodStore((s) => s.actual);
  const periodRewardFlags = usePeriodStore((s) => s.rewardFlags);

  const eventPeriodId = usePeriodEventStore((s) => s.periodId);
  const completedEventIds = usePeriodEventStore((s) => s.completedEventIds);

  const purchaseConfirmationEnabled = useSettingsStore((s) => s.purchaseConfirmationEnabled);
  const setPurchaseConfirmationEnabled = useSettingsStore((s) => s.setPurchaseConfirmationEnabled);

  const totalPlayTimeMs = useSessionStore((s) => s.totalPlayTimeMs);
  const sessionsCount = useSessionStore((s) => s.sessionsCount);
  const playTimeByDayMap = useSessionStore((s) => s.byDay);

  const [range, setRange] = useState<AnalyticsRange>('week');
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // ===== Карточка ребёнка =====
  const petName = pet?.name ?? 'Мишка';
  const currentLevel = pet?.level ?? 1;
  const currentXp = pet?.xp ?? 0;
  const xpToNext = progressLevels[Math.min(currentLevel, MAX_LEVEL) - 1].xpThreshold;
  const currentLevelTitle = progressLevels[Math.min(currentLevel, MAX_LEVEL) - 1].title;
  const xpPercent = Math.min(100, Math.round((currentXp / xpToNext) * 100));

  // ===== Состояние сегодня =====
  const tasksDoneToday = completedTaskIds.length;
  const health = pet?.health ?? 0;
  const happiness = pet?.happiness ?? 0;
  const healthColor = health <= 35 ? RED : health <= 65 ? '#eda21f' : GREEN;
  const happinessColor = happiness <= 35 ? RED : GREEN;
  const petAttentionTone: 'good' | 'warn' | 'bad' = health <= 35 ? 'bad' : health <= 65 || happiness <= 35 ? 'warn' : 'good';
  const petAttentionText =
    health <= 35 ? 'Мишка хочет есть' : health <= 65 ? 'Нужно покормить' : happiness <= 35 ? 'Питомец скучает' : 'Всё хорошо';

  // ===== Покупки по категориям / всего =====
  const boughtRoomsCount = Math.max(0, ownedRoomIds.length - 1);
  const purchasesCount = ownedProductIds.length + boughtRoomsCount;
  const categories = useMemo(() => purchasesByCategory(ownedProductIds, boughtRoomsCount), [ownedProductIds, boughtRoomsCount]);
  const categoriesTotal = Math.max(1, categories.reduce((sum, c) => sum + c.count, 0));

  const recentPurchases = useMemo(
    () =>
      [...transactions]
        .filter((tx) => tx.amount < 0 && (tx.reason.startsWith('Покупка:') || tx.reason.startsWith('Комната:')))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 6),
    [transactions],
  );

  // ===== Текущий период: план/факт, события, копилка по плану =====
  const periodEventsTotal = useMemo(() => getPeriodEvents(periodId as PeriodId).length, [periodId]);
  const periodEventsDone = eventPeriodId === periodId ? completedEventIds.length : 0;
  const periodProgressPercent = periodEventsTotal > 0 ? Math.round((periodEventsDone / periodEventsTotal) * 100) : 0;
  const periodStatusLabel =
    periodStatus === 'planning' ? 'Планирование бюджета' : periodStatus === 'active' ? 'Период идёт' : 'Период завершён';

  // ===== Обучение =====
  const lessonsTotal = lessonCards.length;
  const lessonsDone = completedLessonIds.length;
  const lessonsPercent = lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;
  const nextLesson = lessonCards.find((l) => !completedLessonIds.includes(l.id));
  const practiceRewardsTotal = useMemo(
    () => Object.values(practiceRewards ?? {}).reduce((sum, v) => sum + v, 0),
    [practiceRewards],
  );

  // ===== Финансовая аналитика: доходы за выбранный диапазон =====
  const currentPeriodTransactions = useMemo(() => transactions.filter((tx) => tx.periodId === periodId), [transactions, periodId]);
  const weekChart = useMemo(() => earnedByDay(transactions, 7), [transactions]);
  const monthChart = useMemo(() => earnedByWeek(transactions, 4), [transactions]);
  const currentChart = useMemo(() => earnedByDay(currentPeriodTransactions, 7), [currentPeriodTransactions]);
  const incomeChart = range === 'week' ? weekChart : range === 'month' ? monthChart : currentChart;
  const incomeChartTotal = incomeChart.reduce((sum, d) => sum + d.value, 0);
  const hasAnyIncome = transactions.some((tx) => tx.amount > 0);

  // ===== Изменение общего баланса (кошелёк + копилка) во времени =====
  const currentTotalWealth = coins + savingsBalance;
  const balanceWeekChart = useMemo(() => balanceByDay(transactions, currentTotalWealth, 7), [transactions, currentTotalWealth]);
  const balanceMonthChart = useMemo(() => balanceByWeek(transactions, currentTotalWealth, 4), [transactions, currentTotalWealth]);
  // "Текущий период" — у баланса нет привязки к периоду (это сквозная величина), поэтому
  // показываем тот же дневной срез, что и для недели, с пояснением под графиком.
  const balanceChart = range === 'month' ? balanceMonthChart : balanceWeekChart;

  // ===== Время в игре =====
  const timeWeekChart = useMemo(() => playTimeByDay(playTimeByDayMap, 7), [playTimeByDayMap]);
  const timeMonthChart = useMemo(() => playTimeByWeek(playTimeByDayMap, 4), [playTimeByDayMap]);
  const timeChart = range === 'month' ? timeMonthChart : timeWeekChart;
  const todayPlayMinutes = timeWeekChart[timeWeekChart.length - 1]?.value ?? 0;
  const timeChartTotal = timeChart.reduce((sum, d) => sum + d.value, 0);

  // ===== Распределение денег =====
  const moneySlices = useMemo(
    () => [
      { label: 'Свободные', value: coins, color: VIOLET_SOLID },
      // Для текущего распределения используем текущий баланс копилки, а не
      // totalSaved: totalSaved — накопительная история пополнений и включает
      // суммы, которые ребёнок мог уже вывести обратно.
      { label: 'В копилке', value: savingsBalance, color: SAVINGS_GREEN },
      { label: 'Потрачено за всё время', value: totalSpent, color: RED },
    ],
    [coins, savingsBalance, totalSpent],
  );
  const moneyTotal = coins + totalSpent + totalSaved;

  // ===== Доходность копилки =====
  const savingsInterestTotal = useMemo(
    () => transactions.filter((tx) => tx.category === 'savings' && tx.reason.includes('Доходность')).reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );

  // ===== Забота о питомце (последние сохранённые действия, не длиннее 20 записей) =====
  const careInteractions = pet?.careInteractions ?? [];
  const careWindowMs = range === 'week' ? 7 * 24 * 60 * 60 * 1000 : range === 'month' ? 28 * 24 * 60 * 60 * 1000 : Infinity;
  const careScoped = useMemo(
    () => careInteractions.filter((c) => Date.now() - c.completedAt <= careWindowMs),
    [careInteractions, careWindowMs],
  );
  const carePurchaseCount = careScoped.filter((c) => c.source === 'shop').length;
  const careUsageCount = careScoped.filter((c) => c.source !== 'shop').length;
  const careClosedEvents = careScoped.filter((c) => c.usedForEventId).length;
  const lastCare = careInteractions[careInteractions.length - 1];

  // ===== Последние операции =====
  const recentTransactions = useMemo(() => [...transactions].sort((a, b) => b.timestamp - a.timestamp), [transactions]);
  const visibleTransactions = historyExpanded ? recentTransactions : recentTransactions.slice(0, 10);

  // ===== Накопительная цель =====
  const goalPercent = savingsGoal ? Math.min(100, Math.round((savingsBalance / savingsGoal.price) * 100)) : 0;
  const goalRemaining = savingsGoal ? Math.max(0, savingsGoal.price - savingsBalance) : 0;

  // ===== Требует внимания — только реальные ситуации, максимум 3 =====
  const hints = useMemo(() => {
    const list: Hint[] = [];
    const tasksLeft = dayTasks.length - tasksDoneToday;
    if (tasksLeft > 0) list.push({ id: 'tasks', text: `Сегодня осталось выполнить ${tasksLeft} ${tasksLeft === 1 ? 'задание' : 'задания'}` });
    if (health <= 35) list.push({ id: 'pet-hungry', text: 'Мишка хочет есть' });
    else if (health <= 65 || happiness <= 35) list.push({ id: 'pet-care', text: 'Питомец давно не получал заботу' });
    if (periodStatus === 'active' && periodPlan && periodPlan.savings > 0 && !periodRewardFlags.savingsDepositGranted) {
      list.push({ id: 'savings-plan', text: 'Копилку ещё нужно пополнить по плану' });
    }
    if (periodPlan) {
      (['mandatory', 'optional'] as const).forEach((key) => {
        const over = periodActual[key] - periodPlan[key];
        if (over > 0) list.push({ id: `over-${key}`, text: `В категории «${BUDGET_CATEGORY_LABELS[key]}» перерасход ${over} монет` });
      });
    }
    if (periodStatus === 'active' && periodEventsDone < periodEventsTotal) {
      list.push({ id: 'events', text: `Есть незавершённые события периода: ${periodEventsTotal - periodEventsDone}` });
    }
    if (nextLesson) list.push({ id: 'lesson', text: `Следующий урок ещё не пройден: «${nextLesson.title}»` });
    if (savingsGoal && savingsBalance < savingsGoal.price) {
      list.push({ id: 'goal', text: `До цели «${savingsGoal.name}» осталось ${goalRemaining} монет` });
    }
    return list.slice(0, 3);
  }, [
    tasksDoneToday,
    health,
    happiness,
    periodStatus,
    periodPlan,
    periodRewardFlags,
    periodActual,
    periodEventsDone,
    periodEventsTotal,
    nextLesson,
    savingsGoal,
    savingsBalance,
    goalRemaining,
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка — тот же бежевый фон, что и весь экран, без отдельной плашки цвета. */}
      <div
        className="safe-area-topbar flex shrink-0 items-center justify-between px-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
          style={{ color: '#2c2a5e' }}
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Родительский кабинет
        </h1>
        <button
          onClick={onOpenZone}
          aria-label="Служебная информация"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
          style={{ color: '#2c2a5e' }}
        >
          <IconSettingsGear className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingBottom: bottomInset + 24 }}>
        {/* Карточка ребёнка */}
        <SectionCard>
          <div className="flex items-center gap-3">
            <img src={bearAvatar} alt={petName} className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                {petName}
              </div>
              <div className="text-[12.5px] font-semibold" style={{ color: '#7b7a8c' }}>
                Уровень {currentLevel} · {currentLevelTitle}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-[8px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.18)' }}>
                  <div className="h-full rounded-full" style={{ width: `${xpPercent}%`, background: VIOLET }} />
                </div>
                <span className="shrink-0 text-[11px] font-bold" style={{ color: '#5c5876' }}>
                  {currentXp} / {xpToNext} XP
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Переключатель периода аналитики — только режим просмотра, игровой период не меняет */}
        <div className="mt-3 flex overflow-hidden rounded-full bg-white/60 p-1">
          {([
            ['week', 'Неделя'],
            ['month', 'Месяц'],
            ['current', 'Текущий период'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className="flex-1 rounded-full py-2 text-[11.5px] font-bold leading-tight transition"
              style={
                range === key
                  ? { background: VIOLET, color: '#fff', boxShadow: '0 4px 10px rgba(92,90,216,0.3)' }
                  : { color: '#7b7a8c' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* ===== Состояние сегодня ===== */}
        <SectionHeading icon={<IconFlame className="h-3.5 w-3.5" />}>Состояние сегодня</SectionHeading>

        <div className="flex gap-2.5">
          <SectionCard>
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Задания сегодня
              </span>
              <span className="text-[18px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {tasksDoneToday} из {dayTasks.length}
              </span>
            </div>
          </SectionCard>
          <SectionCard>
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Серия
              </span>
              <span className="text-[18px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {streakDays} дн.
              </span>
              {bestStreak > streakDays && (
                <span className="text-[9.5px] font-semibold" style={{ color: '#9a8f80' }}>
                  рекорд {bestStreak}
                </span>
              )}
            </div>
          </SectionCard>
          <SectionCard>
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Время сегодня
              </span>
              <span className="text-[18px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {todayPlayMinutes} мин
              </span>
            </div>
          </SectionCard>
        </div>

        <div className="mt-2.5">
          <SectionCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconHeart className="h-4 w-4" style={{ color: healthColor }} />
                <span className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
                  Питомец
                </span>
              </div>
              <StatusPill tone={petAttentionTone}>{petAttentionText}</StatusPill>
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  <span>Здоровье</span>
                  <span>{health}%</span>
                </div>
                <MeterBar value={health} color={healthColor} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  <span className="flex items-center gap-1">
                    <IconSmile className="h-3 w-3" style={{ color: happinessColor }} />
                    Настроение
                  </span>
                  <span>{happiness}%</span>
                </div>
                <MeterBar value={happiness} color={happinessColor} />
              </div>
            </div>
            {pet?.lastCareAt && (
              <p className="mt-2.5 text-[11px]" style={{ color: '#9a8f80' }}>
                Последняя забота: {formatDateTime(pet.lastCareAt)}
              </p>
            )}
          </SectionCard>
        </div>

        <div className="mt-2.5">
          <SectionCard>
            <div className="flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  Свободные монеты
                </div>
                <div className="flex items-center gap-1 text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {coins}
                  <img src={coinIcon} alt="" className="h-4 w-4" />
                </div>
              </div>
              <div className="h-9 w-px" style={{ background: '#eeddc3' }} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  В копилке
                </div>
                <div className="flex items-center gap-1 text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {savingsBalance}
                  <img src={coinIcon} alt="" className="h-4 w-4" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ===== Текущий период ===== */}
        <SectionHeading icon={<IconFlag className="h-3.5 w-3.5" />}>Текущий период</SectionHeading>
        <SectionCard>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
              Период {periodId}
            </span>
            <StatusPill tone={periodStatus === 'completed' ? 'good' : periodStatus === 'active' ? 'warn' : 'good'}>
              {periodStatusLabel}
            </StatusPill>
          </div>
          {periodEventsTotal > 0 && (
            <>
              <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                <span>Практики периода</span>
                <span>
                  {periodEventsDone} из {periodEventsTotal}
                </span>
              </div>
              <div className="mt-1">
                <MeterBar value={periodProgressPercent} color={VIOLET_SOLID} />
              </div>
            </>
          )}
        </SectionCard>

        <div className="mt-2.5">
          <SectionCard>
            {!periodPlan ? (
              <p className="text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
                План бюджета ещё не подтверждён — план и факт появятся здесь, как только ребёнок распределит бюджет периода.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5">
                <BudgetCategoryRow label={BUDGET_CATEGORY_LABELS.mandatory} plan={periodPlan.mandatory} actual={periodActual.mandatory} />
                <BudgetCategoryRow label={BUDGET_CATEGORY_LABELS.optional} plan={periodPlan.optional} actual={periodActual.optional} />
                <BudgetCategoryRow label={BUDGET_CATEGORY_LABELS.savings} plan={periodPlan.savings} actual={periodActual.savings} />
              </div>
            )}
          </SectionCard>
        </div>

        {periodPlan && periodPlan.savings > 0 && (
          <div className="mt-2.5">
            <SectionCard>
              <div className="flex items-center gap-2.5">
                <IconPiggy className="h-5 w-5 shrink-0" style={{ color: periodRewardFlags.savingsDepositGranted ? GREEN : AMBER }} />
                <p className="text-[12.5px] font-semibold leading-snug" style={{ color: '#2c2a5e' }}>
                  {periodRewardFlags.savingsDepositGranted
                    ? 'Пополнение копилки по плану выполнено'
                    : 'Копилку ещё нужно пополнить по плану'}
                </p>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ===== Обучение ===== */}
        <SectionHeading icon={<IconBook className="h-3.5 w-3.5" />}>Обучение</SectionHeading>
        <SectionCard>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
                {lessonsDone} из {lessonsTotal} уроков
              </div>
              {nextLesson ? (
                <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: '#7b7a8c' }}>
                  Следующий урок: «{nextLesson.title}»
                </div>
              ) : (
                <div className="mt-0.5 text-[11.5px] font-semibold leading-snug" style={{ color: GREEN }}>
                  Все уроки пройдены
                </div>
              )}
            </div>
            <span className="shrink-0 text-[18px] font-extrabold" style={{ color: VIOLET_SOLID }}>
              {lessonsPercent}%
            </span>
          </div>
          <div className="mt-2.5">
            <MeterBar value={lessonsPercent} color={VIOLET_SOLID} />
          </div>
          <p className="mt-2.5 text-[11px]" style={{ color: '#9a8f80' }}>
            {practiceRewardsTotal > 0
              ? `Практик с наградой: ${practiceRewardsTotal}`
              : 'Работа над ошибками появится после прохождения практик'}
          </p>
        </SectionCard>

        {/* ===== Активность и время в игре ===== */}
        <SectionHeading icon={<IconAlarmClock className="h-3.5 w-3.5" />}>Активность и время в игре</SectionHeading>
        <SectionCard>
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Всего в приложении
              </div>
              <div className="text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {formatDuration(totalPlayTimeMs)}
              </div>
            </div>
            <div className="h-9 w-px" style={{ background: '#eeddc3' }} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Открытий приложения
              </div>
              <div className="text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {sessionsCount}
              </div>
            </div>
          </div>
          {timeChartTotal === 0 ? (
            <p className="mt-3.5 text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Время в игре появится здесь после первого открытия приложения.
            </p>
          ) : (
            <>
              <div className="mt-3.5 mb-1 flex items-center justify-between">
                <span className="text-[12px] font-bold" style={{ color: '#2c2a5e' }}>
                  {range === 'month' ? 'По неделям, мин.' : 'По дням, мин.'}
                </span>
                <span className="text-[11.5px] font-bold" style={{ color: VIOLET_SOLID }}>
                  {timeChartTotal} мин
                </span>
              </div>
              <EarnedBarChart data={timeChart} ariaLabel="Время в приложении" color={VIOLET} />
            </>
          )}
          <p className="mt-2.5 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
            Считается, пока экран приложения реально открыт и виден — время в свёрнутом состоянии не засчитывается.
          </p>
        </SectionCard>

        {/* ===== Финансовая аналитика ===== */}
        <SectionHeading icon={<IconFlame className="h-3.5 w-3.5" />}>Финансовая аналитика</SectionHeading>
        <SectionCard>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
              Заработанные монеты
            </span>
            {incomeChartTotal > 0 && (
              <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: 'rgba(99,217,139,0.16)', color: GREEN }}>
                +{incomeChartTotal}
              </span>
            )}
          </div>
          {!hasAnyIncome ? (
            <p className="text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Доходы появятся после выполнения заданий.
            </p>
          ) : range === 'month' ? (
            <EarnedLineChart data={incomeChart} />
          ) : (
            <EarnedBarChart data={incomeChart} />
          )}
          {range === 'current' && hasAnyIncome && (
            <p className="mt-2 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Только операции текущего периода, по дням за последнюю неделю.
            </p>
          )}
        </SectionCard>

        <div className="mt-2.5">
          <SectionCard>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
                Изменение баланса
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: 'rgba(139,136,244,0.14)', color: '#6262e4' }}>
                {currentTotalWealth} монет сейчас
              </span>
            </div>
            {transactions.length === 0 ? (
              <p className="text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
                График появится после первых операций.
              </p>
            ) : range === 'month' ? (
              <EarnedLineChart data={balanceChart} ariaLabel="Изменение общего баланса по неделям" color="#6262e4" />
            ) : (
              <EarnedBarChart data={balanceChart} ariaLabel="Изменение общего баланса по дням" color="#8b88f4" />
            )}
            {transactions.length > 0 && (
              <p className="mt-2 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
                {range === 'current'
                  ? 'Общий баланс (кошелёк + копилка) без привязки к периоду, по дням за последнюю неделю.'
                  : 'Общий баланс (кошелёк + копилка) без учёта переводов между кошельком и копилкой.'}
              </p>
            )}
          </SectionCard>
        </div>

        <div className="mt-2.5">
          <SectionCard>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10.5px] font-semibold" style={{ color: '#9a8f80' }}>
                  Заработано
                </div>
                <div className="mt-0.5 text-[15px] font-extrabold" style={{ color: GREEN }}>
                  {totalEarned}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-semibold" style={{ color: '#9a8f80' }}>
                  Потрачено
                </div>
                <div className="mt-0.5 text-[15px] font-extrabold" style={{ color: RED }}>
                  {totalSpent}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-semibold" style={{ color: '#9a8f80' }}>
                  Отложено
                </div>
                <div className="mt-0.5 text-[15px] font-extrabold" style={{ color: SAVINGS_GREEN }}>
                  {totalSaved}
                </div>
              </div>
            </div>
            {moneyTotal > 0 ? (
              <div className="mt-3.5 flex items-center gap-4">
                <DonutChart slices={moneySlices} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {moneySlices.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#5c5876' }}>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="min-w-0 flex-1 truncate">{s.label}</span>
                      <span className="shrink-0 font-extrabold" style={{ color: '#2c2a5e' }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-[12px] leading-snug" style={{ color: '#9a8f80' }}>
                Распределение появится, когда в кошельке будут монеты.
              </p>
            )}
          </SectionCard>
        </div>

        <div className="mt-2.5">
          <SectionCard>
            <div className="flex items-center gap-2.5">
              <IconPiggy className="h-6 w-6 shrink-0" style={{ color: SAVINGS_GREEN }} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  Баланс копилки
                </div>
                <div className="flex items-center gap-1 text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {savingsBalance}
                  <img src={coinIcon} alt="" className="h-4 w-4" />
                </div>
              </div>
              {savingsInterestTotal > 0 ? (
                <span className="shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-bold" style={{ background: 'rgba(31,157,116,0.15)', color: SAVINGS_GREEN }}>
                  +20% · {savingsInterestTotal}
                </span>
              ) : null}
            </div>
            {savingsInterestTotal === 0 && (
              <p className="mt-2.5 text-[11.5px] leading-snug" style={{ color: '#9a8f80' }}>
                Доходность начисляется в конце периода, если копилка была пополнена.
              </p>
            )}
          </SectionCard>
        </div>

        {/* ===== Покупки ===== */}
        <SectionHeading icon={<IconCart className="h-3.5 w-3.5" />}>Покупки</SectionHeading>
        <SectionCard>
          {purchasesCount === 0 ? (
            <p className="text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Пока ничего не куплено — покупки появятся здесь.
            </p>
          ) : (
            <>
              <div className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
                Всего покупок: {purchasesCount}
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {categories.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(139,136,244,0.14)' }}>
                        <MaskIcon src={CATEGORY_ICONS[c.id]} color={VIOLET_SOLID} size={16} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold" style={{ color: '#2c2a5e' }}>
                        {c.label}
                      </span>
                      <span className="shrink-0 text-[12.5px] font-extrabold" style={{ color: '#2c2a5e' }}>
                        {c.count}
                      </span>
                    </div>
                    <div className="ml-[42px] mt-1.5 h-[7px] overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.16)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.count / categoriesTotal) * 100}%`, background: VIOLET_SOLID }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        {recentPurchases.length > 0 && (
          <div className="mt-2.5">
            <SectionCard>
              <div className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: '#a99a83' }}>
                Последние покупки
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {recentPurchases.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold" style={{ color: '#2c2a5e' }}>
                        {tx.reason}
                      </div>
                      <div className="text-[10px]" style={{ color: '#9a8f80' }}>
                        {formatDateTime(tx.timestamp)}
                      </div>
                    </div>
                    <span className="shrink-0 text-[12.5px] font-extrabold" style={{ color: RED }}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ===== Забота о питомце ===== */}
        <SectionHeading icon={<IconHeart className="h-3.5 w-3.5" />}>Забота о питомце</SectionHeading>
        <SectionCard>
          {careScoped.length === 0 ? (
            <p className="text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Заботы о питомце за этот период обзора пока не было.
            </p>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  Покупка предмета
                </div>
                <div className="text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {carePurchaseCount}
                </div>
              </div>
              <div className="h-9 w-px" style={{ background: '#eeddc3' }} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  Использование предмета
                </div>
                <div className="text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {careUsageCount}
                </div>
              </div>
              <div className="h-9 w-px" style={{ background: '#eeddc3' }} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                  Помогло с событием
                </div>
                <div className="text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {careClosedEvents}
                </div>
              </div>
            </div>
          )}
          {lastCare && (
            <p className="mt-3 text-[11.5px] leading-snug" style={{ color: '#7b7a8c' }}>
              Последнее действие: {CARE_ACTION_LABELS[lastCare.action]} · {CARE_SOURCE_LABELS[lastCare.source]} · {formatDateTime(lastCare.completedAt)}
            </p>
          )}
        </SectionCard>

        {/* ===== Последние операции ===== */}
        <SectionHeading icon={<IconCoinStack className="h-3.5 w-3.5" />}>Последние операции</SectionHeading>
        <SectionCard>
          {recentTransactions.length === 0 ? (
            <p className="text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Пока нет операций за этот период.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                {visibleTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: txColor(tx) }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold" style={{ color: '#2c2a5e' }}>
                        {tx.reason}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]" style={{ color: '#9a8f80' }}>
                        <span>{formatDateTime(tx.timestamp)}</span>
                        {tx.periodId && <span>· Период {tx.periodId}</span>}
                        {tx.category && <span>· {TX_CATEGORY_LABELS[tx.category]}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-[12.5px] font-extrabold" style={{ color: txColor(tx) }}>
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
              {recentTransactions.length > 10 && (
                <button
                  onClick={() => setHistoryExpanded((v) => !v)}
                  className="mt-3 flex w-full items-center justify-center gap-1 rounded-full py-2 text-[12px] font-bold transition active:scale-[0.98]"
                  style={{ background: '#f0e6d3', color: '#6f6355' }}
                >
                  {historyExpanded ? 'Скрыть' : 'Посмотреть всю историю'}
                  <IconChevronRight className={`h-3.5 w-3.5 transition-transform ${historyExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}
            </>
          )}
        </SectionCard>

        {/* ===== Требует внимания ===== */}
        {hints.length > 0 && (
          <>
            <SectionHeading icon={<IconBell className="h-3.5 w-3.5" />}>Требует внимания</SectionHeading>
            <SectionCard>
              <div className="flex flex-col gap-2.5">
                {hints.map((h) => (
                  <div key={h.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: VIOLET_SOLID }} />
                    <p className="text-[12.5px] leading-snug" style={{ color: '#2c2a5e' }}>
                      {h.text}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ===== Накопительная цель ===== */}
        {savingsGoal && (
          <>
            <SectionHeading icon={<IconGift className="h-3.5 w-3.5" />}>Накопительная цель</SectionHeading>
            <SectionCard>
              <div className="flex items-center gap-3">
                <img src={savingsGoal.image} alt="" className="h-12 w-12 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-bold" style={{ color: '#2c2a5e' }}>
                    {savingsGoal.name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: '#7b7a8c' }}>
                    {savingsBalance} из {savingsGoal.price} монет
                  </div>
                </div>
                <span className="shrink-0 text-[15px] font-extrabold" style={{ color: VIOLET_SOLID }}>
                  {goalPercent}%
                </span>
              </div>
              <div className="mt-2.5">
                <MeterBar value={goalPercent} color={VIOLET_SOLID} />
              </div>
              <p className="mt-2 text-[11px]" style={{ color: '#9a8f80' }}>
                {goalRemaining > 0 ? `Осталось накопить ${goalRemaining} монет` : 'Цель уже накоплена'}
              </p>
            </SectionCard>
          </>
        )}

        {/* ===== Управление ===== */}
        <SectionTitle>Управление</SectionTitle>
        <SectionCard>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
                Подтверждение покупок
              </div>
              <div className="mt-0.5 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
                Окно «Точно купить?» перед каждой покупкой (кроме еды)
              </div>
            </div>
            <Toggle checked={purchaseConfirmationEnabled} onChange={setPurchaseConfirmationEnabled} aria-label="Подтверждение покупок" />
          </div>
        </SectionCard>
        <p className="mt-2 px-1 text-[11px] leading-snug" style={{ color: '#a99a83' }}>
          Скоро здесь появятся лимит покупок в день и ограничение времени в приложении.
        </p>

      </div>
    </div>
  );
}
