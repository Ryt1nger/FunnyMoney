import type { Scenario } from '../types';

// Первый связанный набор сценариев: игрушка vs еда (импульсивная покупка vs необходимое).
// followUpScenarioId связывает сценарии для механики "повторного обучения" (ТЗ п.5).

export const scenarios: Scenario[] = [
  {
    id: 'toy-vs-food-1',
    topic: 'impulse_vs_need',
    title: 'Игрушка или еда?',
    context:
      'У тебя 500 монет. Питомцу нужна еда — 100 монет. Но в витрине новая игрушка — 300 монет. Что выберешь?',
    difficulty: 1,
    followUpScenarioId: 'toy-vs-food-2',
    options: [
      {
        id: 'buy-toy',
        label: 'Купить игрушку (300 монет)',
        cost: 300,
        effects: { happiness: 20, coins: -300 },
        isOptimal: false,
        teacherFeedback:
          'Ой! Мы потратили почти все монетки на игрушку. Теперь не хватает денег на еду. В следующий раз сначала проверим, хватает ли нам денег на самое необходимое.',
      },
      {
        id: 'buy-food',
        label: 'Купить еду (100 монет)',
        cost: 100,
        effects: { health: 20, coins: -100 },
        isOptimal: true,
        positiveFeedback: 'Отлично! Сначала позаботились о самом важном — питомец сыт и здоров.',
        teacherFeedback: '',
      },
    ],
  },
  {
    id: 'toy-vs-food-2',
    topic: 'impulse_vs_need',
    title: 'Скидка на любимую вещь',
    context:
      'В магазине скидка 50% на вещь, которую ты давно хотел. Но через два дня питомцу понадобится новая кроватка. У тебя не так много монет. Что выберешь?',
    difficulty: 2,
    options: [
      {
        id: 'buy-discount',
        label: 'Купить вещь со скидкой',
        cost: 150,
        effects: { happiness: 15, coins: -150 },
        isOptimal: false,
        teacherFeedback:
          'Скидка — это заманчиво, но если после покупки не останется денег на кроватку, придётся подождать. Попробуем сначала отложить на важное, а потом уже побаловать себя.',
      },
      {
        id: 'save-for-bed',
        label: 'Отложить деньги на кроватку',
        effects: { wealth: 15 },
        isOptimal: true,
        positiveFeedback: 'Ты применил то, что уже знаешь: сначала важное, потом приятное. Отличная память!',
        teacherFeedback: '',
      },
    ],
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
