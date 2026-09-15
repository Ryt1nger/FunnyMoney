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
  category: 'needs' | 'savings' | 'budget' | 'shopping';
}

export const lessonCards: LessonCard[] = [
  {
    id: 'what-is-money',
    title: 'Что такое деньги?',
    description: 'Узнай, откуда берутся деньги\nи зачем они нужны.',
    coins: 50,
    xp: 10,
    step: 1,
    total: 5,
    image: lessonMoney,
    category: 'budget',
  },
  {
    id: 'needs-vs-wants',
    title: 'Потребности и желания',
    description: 'Научись отличать то, что нужно,\nот того, что хочется.',
    coins: 50,
    xp: 10,
    step: 2,
    total: 5,
    image: lessonNeeds,
    category: 'needs',
  },
  {
    id: 'piggy-bank',
    title: 'Копилка и накопления',
    description: 'Узнай, как копить и достигать\nсвоих целей.',
    coins: 75,
    xp: 15,
    step: 3,
    total: 5,
    image: lessonPiggy,
    category: 'savings',
  },
  {
    id: 'impulse-buying',
    title: 'Как не купить лишнее?',
    description: 'Разберись, как не поддаваться\nна импульсивные покупки.',
    coins: 75,
    xp: 15,
    step: 4,
    total: 5,
    image: lessonImpulse,
    category: 'shopping',
  },
];
