// Мок-данные лидерборда. По ТЗ рейтинг строится на XP (не на деньгах),
// без реальных имён — только игровые прозвища питомцев.
export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  emoji: string;
  ring: string;
  bg: string;
  isMe?: boolean;
}

export const podium: LeaderboardEntry[] = [
  { rank: 1, name: 'Панда', xp: 2150, emoji: '🐼', ring: '#f5c344', bg: 'linear-gradient(180deg, #f4f4f4 0%, #dcdcdc 100%)' },
  { rank: 2, name: 'Лисёнок', xp: 1840, emoji: '🦊', ring: '#93a6e8', bg: 'linear-gradient(180deg, #ffd9a8 0%, #ff9f4a 100%)' },
  { rank: 3, name: 'Котик', xp: 1720, emoji: '🐱', ring: '#e0a184', bg: 'linear-gradient(180deg, #eceff3 0%, #cfd6e0 100%)' },
];

export const aboveMe: LeaderboardEntry[] = [
  { rank: 4, name: 'Зайка', xp: 1640, emoji: '🐰', ring: '#e4e0f7', bg: 'linear-gradient(180deg, #f2effc 0%, #ddd6f6 100%)' },
  { rank: 5, name: 'Бублик', xp: 1590, emoji: '🐶', ring: '#f0dcc2', bg: 'linear-gradient(180deg, #fff1dc 0%, #f4cf9c 100%)' },
  { rank: 6, name: 'Персик', xp: 1520, emoji: '🐈', ring: '#f6ceb6', bg: 'linear-gradient(180deg, #ffe6d2 0%, #ffbb8a 100%)' },
];

export const me: LeaderboardEntry = { rank: 12, name: 'Мишка', xp: 1240, emoji: '🐻', ring: '#ffffff', bg: '', isMe: true };

export const belowMe: LeaderboardEntry[] = [
  { rank: 13, name: 'Пончик', xp: 1210, emoji: '🐧', ring: '#c8d2e0', bg: 'linear-gradient(180deg, #dfe6f0 0%, #b9c6da 100%)' },
  { rank: 14, name: 'Квакша', xp: 1190, emoji: '🐸', ring: '#bfe4bd', bg: 'linear-gradient(180deg, #ddf3d8 0%, #a9dba0 100%)' },
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
