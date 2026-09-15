// Мок-данные лидерборда. По ТЗ рейтинг строится на XP (не на деньгах),
// без реальных имён — только игровые прозвища питомцев.
import type { AnimalSpecies } from '../components/AnimalAvatar';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  species: AnimalSpecies;
  bg: string;
  isMe?: boolean;
}

export const podium: LeaderboardEntry[] = [
  { rank: 1, name: 'Панда', xp: 2150, species: 'panda', bg: 'linear-gradient(180deg, #f4f4f4 0%, #dcdcdc 100%)' },
  { rank: 2, name: 'Лисёнок', xp: 1840, species: 'fox', bg: 'linear-gradient(180deg, #ffd9a8 0%, #ff9f4a 100%)' },
  { rank: 3, name: 'Котик', xp: 1720, species: 'cat', bg: 'linear-gradient(180deg, #ffe6be 0%, #ffc267 100%)' },
];

export const aboveMe: LeaderboardEntry[] = [
  { rank: 4, name: 'Зайка', xp: 1640, species: 'rabbit', bg: 'linear-gradient(180deg, #f2effc 0%, #ddd6f6 100%)' },
  { rank: 5, name: 'Бублик', xp: 1590, species: 'dog', bg: 'linear-gradient(180deg, #fff1dc 0%, #f4cf9c 100%)' },
  { rank: 6, name: 'Персик', xp: 1520, species: 'cat', bg: 'linear-gradient(180deg, #ffe6d2 0%, #ffbb8a 100%)' },
];

// Строка сразу перед игроком — закреплённая мини-панель "рядом с тобой"
// (1 плашка до, ты, 2 после) всегда видна без прокрутки.
export const justAboveMe: LeaderboardEntry = { rank: 11, name: 'Мурзик', xp: 1265, species: 'cat', bg: 'linear-gradient(180deg, #ffe6d2 0%, #ffbb8a 100%)' };

export const me: LeaderboardEntry = { rank: 12, name: 'Мишка', xp: 1240, species: 'dog', bg: '', isMe: true };

export const belowMe: LeaderboardEntry[] = [
  { rank: 13, name: 'Пончик', xp: 1210, species: 'penguin', bg: 'linear-gradient(180deg, #dfe6f0 0%, #b9c6da 100%)' },
  { rank: 14, name: 'Квакша', xp: 1190, species: 'frog', bg: 'linear-gradient(180deg, #ddf3d8 0%, #a9dba0 100%)' },
];

export const league = {
  name: 'Золотая лига',
  hint: 'Ты в топ-20!',
};

export const climbGoal = {
  title: 'Поднимись на 3 места!',
  subtitle: 'Заработай ещё 180 XP, чтобы попасть в топ-10.',
  progress: 60,
  total: 180,
};
