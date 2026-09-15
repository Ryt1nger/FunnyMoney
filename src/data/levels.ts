import type { Level } from '../types';

export const levels: Level[] = [
  {
    id: 'level-1-needs-vs-wants',
    title: 'Желания и потребности',
    explanationText:
      'Иногда нам что-то ХОЧЕТСЯ, а иногда что-то НУЖНО. Важно уметь отличать одно от другого.',
    scenarioIds: ['toy-vs-food-1'],
    reward: { coins: 50 },
  },
];
