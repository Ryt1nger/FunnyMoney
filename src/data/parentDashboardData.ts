// Данные для родительского кабинета, которые пока НЕЛЬЗЯ посчитать по-настоящему —
// в приложении ещё нет ни реальных уроков (см. "Уроки скоро откроются" на Home),
// ни истории решений по сценариям. Здесь — иллюстративные показатели по мотивам
// макета, чтобы дашборд выглядел завершённым уже сейчас. Когда появится реальная
// система уроков/сценариев с историей, эти данные нужно будет заменить на честный
// подсчёт (см. TODO у каждого блока).

/** TODO: заменить на % решений с isOptimal=true по реальной истории сценариев. */
export const learningResults = {
  successPercent: 82,
  errorPercent: 18,
  /** На сколько % лучше, чем месяц назад — тоже иллюстративное значение. */
  improvementVsLastMonth: 14,
};

export interface ChartPoint {
  label: string;
  value: number;
}

/** TODO: реальный процент "финансовой грамотности" по неделям — нужна метрика с формулой. */
export const financialGrowthByMonth: ChartPoint[] = [
  { label: '1 неделя', value: 54 },
  { label: '2 неделя', value: 68 },
  { label: '3 неделя', value: 76 },
  { label: '4 неделя', value: 82 },
];

/** TODO: реальный XP по дням — нужна история начислений с датами (сейчас есть только сумма). */
export const activityByWeek: ChartPoint[] = [
  { label: 'Пн', value: 30 },
  { label: 'Вт', value: 70 },
  { label: 'Ср', value: 45 },
  { label: 'Чт', value: 95 },
  { label: 'Пт', value: 60 },
  { label: 'Сб', value: 35 },
  { label: 'Вс', value: 20 },
];

export type SkillStatus = 'good' | 'medium' | 'needs_work';

export interface SkillStat {
  id: string;
  label: string;
  percent: number;
  status: SkillStatus;
  icon: 'wallet' | 'piggy' | 'book' | 'cart';
  /** Показывается только для needs_work — подсказка родителю, что делать. */
  note?: string;
}

/** TODO: реальная разбивка по topic сценариев (см. src/data/scenarios.ts), когда их станет больше одного. */
export const skillStats: SkillStat[] = [
  { id: 'needs-wants', label: 'Потребности и желания', percent: 90, status: 'good', icon: 'wallet' },
  { id: 'savings', label: 'Накопления', percent: 72, status: 'good', icon: 'piggy' },
  { id: 'budgeting', label: 'Планирование бюджета', percent: 58, status: 'medium', icon: 'book' },
  {
    id: 'impulse',
    label: 'Импульсивные покупки',
    percent: 42,
    status: 'needs_work',
    icon: 'cart',
    note: 'Нужно повторить',
  },
];
