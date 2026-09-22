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
}

export const lessonCards: LessonCard[] = [
  {
    id: 'what-is-money',
    title: 'Сначала нужное, потом желаемое',
    description: 'Учимся отличать обязательное\nот желаний и выбирать главное.',
    coins: 50,
    xp: 10,
    step: 1,
    total: 6,
    image: lessonMoney,
    category: 'needs',
    practiceCount: 5,
  },
  {
    id: 'needs-vs-wants',
    title: 'Доходы и расходы',
    description: 'Разбираемся, откуда приходят деньги\nи куда они уходят.',
    coins: 50,
    xp: 10,
    step: 2,
    total: 6,
    image: lessonNeeds,
    category: 'income',
    practiceCount: 5,
  },
  {
    id: 'piggy-bank',
    title: 'Сравнивай цены и планируй покупку',
    description: 'Сравниваем варианты, пользуемся списком\nи бережём ограниченный бюджет.',
    coins: 75,
    xp: 15,
    step: 3,
    total: 6,
    image: lessonPiggy,
    category: 'planning',
    practiceCount: 5,
  },
  {
    id: 'impulse-buying',
    title: 'Скидки и акции: покупай с пользой',
    description: 'Понимаем, когда скидка помогает,\nа когда заставляет купить лишнее.',
    coins: 75,
    xp: 15,
    step: 4,
    total: 6,
    image: lessonImpulse,
    category: 'discounts',
    practiceCount: 5,
  },
  {
    id: 'financial-goal',
    title: 'Финансовая цель и накопления',
    description: 'Выбираем цель и откладываем монетки\nмаленькими регулярными шагами.',
    coins: 75,
    xp: 15,
    step: 5,
    total: 6,
    image: lessonPiggy,
    category: 'savings',
    practiceCount: 5,
  },
  {
    id: 'plan-and-fact',
    title: 'План и факт: учимся на решениях',
    description: 'Сравниваем план и реальные траты\nи меняем решение без отказа от цели.',
    coins: 75,
    xp: 15,
    step: 6,
    total: 6,
    image: lessonImpulse,
    category: 'plan-fact',
    practiceCount: 5,
  },
];
