// Задания экрана «День» — статичные описания/награды (сколько монет/XP/здоровья
// даёт задание), а фактическое выполнение (кто сделан, кто нет) считается
// в реальном времени из useDayProgressStore, см. src/pages/Day.tsx.

export type DayTaskIcon = 'bowl' | 'game' | 'book' | 'cart' | 'moon';

export interface DayTask {
  id: string;
  icon: DayTaskIcon;
  title: string;
  description: string;
  rewardHeart?: number;
  rewardSmile?: number;
  rewardCoins?: number;
  xp: number;
}

export const dayTasks: DayTask[] = [
  {
    id: 'feed',
    icon: 'bowl',
    title: 'Покорми питомца',
    description: 'Дай еду своему питомцу',
    rewardHeart: 20,
    xp: 10,
  },
  {
    id: 'play',
    icon: 'game',
    title: 'Поиграй с питомцем',
    description: 'Проведи 1 игру в комнате',
    rewardSmile: 15,
    xp: 10,
  },
  {
    id: 'lesson',
    icon: 'book',
    title: 'Пройди урок',
    description: 'Изучи новую полезную тему',
    rewardSmile: 20,
    xp: 15,
  },
  {
    id: 'shop',
    icon: 'cart',
    title: 'Купи что-нибудь в магазине',
    description: 'Сделай 1 покупку в магазине',
    rewardCoins: 25,
    xp: 10,
  },
  {
    id: 'sleep',
    icon: 'moon',
    title: 'Уложи питомца спать',
    description: 'Пусть он хорошо отдохнёт',
    rewardHeart: 15,
    xp: 10,
  },
];
