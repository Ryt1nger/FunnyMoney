// Мок-данные экрана «День» — ежедневные задания, серия и прогресс.
// Реальный игровой цикл (Game Core: economy/progress) подключим позже,
// сейчас цель — 1:1 вёрстка под референс design/screens/03-stats-and-day.png.

export type DayTaskIcon = 'bowl' | 'game' | 'book' | 'cart' | 'moon';
export type DayTaskStatus = 'done' | 'action' | 'locked';

export interface DayTask {
  id: string;
  icon: DayTaskIcon;
  title: string;
  description: string;
  rewardHeart?: number;
  rewardSmile?: number;
  rewardCoins?: number;
  xp: number;
  status: DayTaskStatus;
  /** Текст кнопки для status === 'action' */
  actionLabel?: string;
  /** Счётчик для status === 'locked', напр. «0/1» */
  progressLabel?: string;
}

export const currentDay = 6;
export const streakDays = 6;
export const tasksDone = 4;
export const tasksTotal = 7;

export const dayTasks: DayTask[] = [
  {
    id: 'feed',
    icon: 'bowl',
    title: 'Покорми питомца',
    description: 'Купи и дай еду своему питомцу',
    rewardHeart: 20,
    xp: 10,
    status: 'done',
  },
  {
    id: 'play',
    icon: 'game',
    title: 'Поиграй с питомцем',
    description: 'Проведи 1 игру в комнате',
    rewardSmile: 15,
    xp: 10,
    status: 'done',
  },
  {
    id: 'lesson',
    icon: 'book',
    title: 'Пройди урок',
    description: 'Изучи новую полезную тему',
    rewardSmile: 20,
    xp: 15,
    status: 'action',
    actionLabel: 'Начать',
  },
  {
    id: 'shop',
    icon: 'cart',
    title: 'Купи что-нибудь в магазине',
    description: 'Сделай 1 покупку в магазине',
    rewardCoins: 25,
    xp: 10,
    status: 'locked',
    progressLabel: '0/1',
  },
  {
    id: 'sleep',
    icon: 'moon',
    title: 'Уложи питомца спать',
    description: 'Пусть он хорошо отдохнёт',
    rewardHeart: 15,
    xp: 10,
    status: 'locked',
    progressLabel: '0/1',
  },
];
