// Данные 5 уровней развития для экрана "Прогресс". Реальная система уроков ещё
// не подключена (см. LEVEL/XP-заглушки в Home.tsx) — здесь зафиксированы
// названия/подписи и пороги XP по референсам макета, чтобы экран прогресса и
// шапка Home ссылались на один и тот же источник истины.
export interface ProgressLevel {
  level: number;
  title: string;
  subtitle: string;
  /** Сколько всего XP нужно накопить, чтобы достичь этого уровня. */
  xpThreshold: number;
  /** Какой аксессуар выдаётся наградой за этот уровень (худи на первых уровнях, кепка — на старших). */
  accessory: 'hoodie' | 'cap';
}

export const progressLevels: ProgressLevel[] = [
  {
    level: 1,
    title: 'Первые монетки',
    subtitle: 'Начни управлять своими деньгами',
    xpThreshold: 100,
    accessory: 'hoodie',
  },
  {
    level: 2,
    title: 'Умный покупатель',
    subtitle: 'Учись отличать нужное от желаемого',
    xpThreshold: 250,
    accessory: 'hoodie',
  },
  {
    level: 3,
    title: 'Юный стратег',
    subtitle: 'Планируй покупки и копи на цели',
    xpThreshold: 500,
    accessory: 'hoodie',
  },
  {
    level: 4,
    title: 'Мастер бюджета',
    subtitle: 'Составляй бюджет и принимай решения',
    xpThreshold: 800,
    accessory: 'cap',
  },
  {
    level: 5,
    title: 'Финансовый профи',
    subtitle: 'Ты уверенно управляешь своими деньгами',
    xpThreshold: 1200,
    accessory: 'cap',
  },
];

export const MAX_LEVEL = progressLevels.length;

/** Награда "100 монет" одинакова для всех уровней. */
export const LEVEL_COIN_REWARD = 100;

// Текущий уровень/опыт ребёнка — отдельная система уроков ещё не подключена
// (см. "Уроки скоро откроются" на Home), поэтому пока фиксированные значения.
// Единый источник для шапки Home, экрана "Прогресс" и родительского кабинета —
// чтобы везде показывалась одна и та же цифра, а не расходящиеся копии.
export const CURRENT_LEVEL = 1;
export const CURRENT_XP = 0;
