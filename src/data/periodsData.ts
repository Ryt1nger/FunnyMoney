// Содержимое карточек пяти периодов — иллюстрации, названия и порядок событий.
// Правила, доступность, решения и последствия событий живут в
// features/periodEvents; этот файл только связывает их id с визуальными
// карточками и обложками периодов.

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
import eventSickPet from '../assets/periods/event-sick-pet.jpg';
import eventReward from '../assets/periods/event-reward.jpg';
import eventBrokenToy from '../assets/periods/event-broken-toy.jpg';
import eventPreparingParty from '../assets/periods/event-preparing-party.jpg';
import eventLastChance from '../assets/periods/event-last-chance.jpg';
import eventFinalChoice from '../assets/periods/event-final-choice.jpg';
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
  id: 1 | 2 | 3 | 4 | 5;
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
    rewardCoins: 52,
    rewardXp: 5,
    events: [
      { id: 'period-1-feed-first', title: 'Корм закончился', subtitle: 'Сначала важное', image: eventFair },
      { id: 'period-1-help-reward', title: 'Награда за помощь', subtitle: 'Доход и расход', image: eventGiftP1 },
      { id: 'period-1-bowl-breaks', title: 'Разбилась миска', subtitle: 'Приоритет и бюджет', image: eventWallet },
    ],
  },
  {
    id: 2,
    title: 'Период 2',
    subtitle: 'План против неожиданностей',
    description: 'Сохрани план, когда появляются желания и сюрпризы.',
    card: cardPeriod2,
    hero: heroPeriod2,
    rewardCoins: 52,
    rewardXp: 5,
    events: [
      { id: 'period-2-smart-shopping', title: 'Большой поход в магазин', subtitle: 'Список и сравнение', image: eventRain },
      { id: 'period-2-real-discount', title: 'Большая акция!', subtitle: 'Настоящая выгода', image: eventDiscount },
      { id: 'period-2-overloaded-cart', title: 'Лишнее в корзине', subtitle: 'План и бюджет', image: eventGift },
    ],
  },
  {
    id: 3,
    title: 'Период 3',
    subtitle: 'Ответственность и большая цель',
    description: 'Справься с обязательными расходами и приблизь большую цель.',
    card: cardPeriod3,
    hero: heroPeriod3,
    rewardCoins: 52,
    rewardXp: 5,
    events: [
      { id: 'period-3-dream-house', title: 'Домик мечты', subtitle: 'Начинаем копить', image: eventSick },
      { id: 'period-3-plan-changed', title: 'План изменился', subtitle: 'План и факт', image: eventInventor },
      { id: 'period-3-last-ten', title: 'Последние 10 монет', subtitle: 'Цель или желание', image: eventMountain },
    ],
  },
  {
    id: 4,
    title: 'Период 4',
    subtitle: 'Финансовая подушка',
    description: 'Научись справляться с неожиданными расходами и сохранять запас.',
    card: cardPeriod3,
    hero: heroPeriod3,
    rewardCoins: 65,
    rewardXp: 10,
    events: [
      { id: 'period-4-sick-pet', title: 'Мани простудился', subtitle: 'Нужное важнее желаний', image: eventSickPet },
      { id: 'period-4-reward', title: 'Неожиданная награда', subtitle: 'Сохрани часть денег', image: eventReward },
      { id: 'period-4-broken-toy', title: 'Сломалась игрушка', subtitle: 'Выбор между желанием и пользой', image: eventBrokenToy },
    ],
  },
  {
    id: 5,
    title: 'Период 5',
    subtitle: 'Самостоятельное решение',
    description: 'Сбалансируй здоровье, счастье и большую финансовую цель.',
    card: cardPeriod3,
    hero: heroPeriod3,
    rewardCoins: 78,
    rewardXp: 15,
    events: [
      { id: 'period-5-preparing-party', title: 'Подготовка к празднику', subtitle: 'Не потрать всё сразу', image: eventPreparingParty },
      { id: 'period-5-last-chance', title: 'Последняя возможность накопить', subtitle: 'Цель и забота о питомце', image: eventLastChance },
      { id: 'period-5-final-choice', title: 'Главное решение', subtitle: 'Финальный выбор', image: eventFinalChoice },
    ],
  },
];

/** Карта id события → иллюстрация, для использования в модалке события
 * (EventModal), не завязанная на текущую открытую вкладку периода. */
export function getPeriodEventImage(eventId: string): string | undefined {
  for (const period of PERIODS) {
    const found = period.events.find((event) => event.id === eventId);
    if (found) return found.image;
  }
  return undefined;
}
