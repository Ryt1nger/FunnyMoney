import lessonMoney from '../assets/lessons/lesson-money.jpg';
import lessonNeeds from '../assets/lessons/lesson-needs.jpg';
import lessonPiggy from '../assets/lessons/lesson-piggy.jpg';
import lessonImpulse from '../assets/lessons/lesson-impulse.jpg';

export interface LessonCard {
  id: string;
  title: string;
  description: string;
  coins: number;
  xp: number;
  step: number;
  total: number;
  image: string;
  category: 'needs' | 'income' | 'planning' | 'discounts' | 'savings' | 'plan-fact';
  practiceCount: number;
  /** Короткое имя навыка — показывается на экране результатов урока. */
  skill: string;
  /** Итоговая фраза "чему ты научился" — зелёный баннер на экране результатов. */
  outcome: string;
}

export const lessonCards: LessonCard[] = [
  {
    id: 'what-is-money',
    title: 'Нужное и желаемое',
    description: 'Что нужно, а что хочется.',
    coins: 50,
    xp: 10,
    step: 1,
    total: 6,
    image: lessonMoney,
    category: 'needs',
    practiceCount: 5,
    skill: 'Нужное и желаемое',
    outcome: 'Ты научился отличать нужные вещи от тех, что просто хочется!',
  },
  {
    id: 'needs-vs-wants',
    title: 'Доходы и расходы',
    description: 'Откуда приходят и куда уходят.',
    coins: 50,
    xp: 10,
    step: 2,
    total: 6,
    image: lessonNeeds,
    category: 'income',
    practiceCount: 5,
    skill: 'Доходы и расходы',
    outcome: 'Ты разобрался, откуда приходят и куда уходят деньги!',
  },
  {
    id: 'piggy-bank',
    title: 'Сравниваем цены',
    description: 'Выбираем выгодный вариант.',
    coins: 75,
    xp: 15,
    step: 3,
    total: 6,
    image: lessonPiggy,
    category: 'planning',
    practiceCount: 5,
    skill: 'Сравнение цен',
    outcome: 'Ты научился сравнивать цены и выбирать более выгодные покупки!',
  },
  {
    id: 'impulse-buying',
    title: 'Скидки без ловушек',
    description: 'Покупаем с пользой.',
    coins: 75,
    xp: 15,
    step: 4,
    total: 6,
    image: lessonImpulse,
    category: 'discounts',
    practiceCount: 5,
    skill: 'Скидки и акции',
    outcome: 'Ты научился отличать настоящую выгоду от ложной экономии!',
  },
  {
    id: 'financial-goal',
    title: 'Цель и накопления',
    description: 'Откладываем понемногу.',
    coins: 75,
    xp: 15,
    step: 5,
    total: 6,
    image: lessonPiggy,
    category: 'savings',
    practiceCount: 5,
    skill: 'Цель и накопления',
    outcome: 'Ты научился ставить финансовую цель и копить на неё по плану!',
  },
  {
    id: 'plan-and-fact',
    title: 'План и факт',
    description: 'Сверяем план с результатом.',
    coins: 75,
    xp: 15,
    step: 6,
    total: 6,
    image: lessonImpulse,
    category: 'plan-fact',
    practiceCount: 5,
    skill: 'План и факт',
    outcome: 'Ты научился сравнивать план и результат и делать выводы!',
  },
];
