// Статическое содержимое трёх игровых периодов — карточки, награды и события.
// Цифры "Распределение" (Обязательное/Желания/Накопления) для ТЕКУЩЕГО периода
// берутся из реального usePeriodStore (см. Period.tsx); эти данные — только
// оформление (картинки, тексты, список событий), которого в геймплейном сторе
// пока нет. Когда появится бэкенд-модель событий периода — событийная часть
// подключается сюда же, без переверстки экрана.

import cardPeriod1 from '../assets/periods/card-period1.jpg';
import cardPeriod2 from '../assets/periods/card-period2.jpg';
import cardPeriod3 from '../assets/periods/card-period3.jpg';
import eventFair from '../assets/periods/event-fair.jpg';
import eventRain from '../assets/periods/event-rain.jpg';
import eventDiscount from '../assets/periods/event-discount.jpg';
import eventGift from '../assets/periods/event-gift.jpg';
import eventGiftP1 from '../assets/periods/event-gift-p1.jpg';
import eventWallet from '../assets/periods/event-wallet.jpg';
import eventSick from '../assets/periods/event-sick.jpg';
import eventInventor from '../assets/periods/event-inventor.jpg';
import eventMountain from '../assets/periods/event-mountain.jpg';
import heroPeriod1 from '../assets/periods/hero-period1.jpg';
import heroPeriod2 from '../assets/periods/hero-period2.jpg';
import heroPeriod3 from '../assets/periods/hero-period3.jpg';

export interface PeriodEvent {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface PeriodContent {
  id: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  card: string;
  hero: string;
  rewardCoins: number;
  rewardXp: number;
  events: PeriodEvent[];
}

export const PERIODS: PeriodContent[] = [
  {
    id: 1,
    title: 'Период 1',
    subtitle: 'Первые самостоятельные деньги',
    description: 'Заработай, распредели и сделай первые финансовые шаги.',
    card: cardPeriod1,
    hero: heroPeriod1,
    rewardCoins: 40,
    rewardXp: 5,
    events: [
      { id: 'fair', title: 'Ярмарка добрых дел', subtitle: 'Украшена площадка', image: eventFair },
      { id: 'mystery', title: 'Подарок-сюрприз', subtitle: 'Открой коробку', image: eventGiftP1 },
      { id: 'wallet', title: 'Находка в парке', subtitle: 'Реши, что делать', image: eventWallet },
    ],
  },
  {
    id: 2,
    title: 'Период 2',
    subtitle: 'План против неожиданностей',
    description: 'Сохрани план, когда появляются желания и сюрпризы.',
    card: cardPeriod2,
    hero: heroPeriod2,
    rewardCoins: 40,
    rewardXp: 5,
    events: [
      { id: 'rain', title: 'Дождь перед прогулкой', subtitle: '', image: eventRain },
      { id: 'discount', title: 'Скидка только сегодня', subtitle: '', image: eventDiscount },
      { id: 'birthday', title: 'День рождения друга', subtitle: '', image: eventGift },
    ],
  },
  {
    id: 3,
    title: 'Период 3',
    subtitle: 'Ответственность и большая цель',
    description: 'Справься с обязательными расходами и приблизь большую цель.',
    card: cardPeriod3,
    hero: heroPeriod3,
    rewardCoins: 40,
    rewardXp: 5,
    events: [
      { id: 'sick', title: 'Мани простудился', subtitle: '', image: eventSick },
      { id: 'invent', title: 'Конкурс изобретателей', subtitle: '', image: eventInventor },
      { id: 'goal', title: 'Большая цель', subtitle: '', image: eventMountain },
    ],
  },
];
