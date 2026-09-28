/**
 * Содержательная модель девяти сюжетных событий из сценарного PDF.
 * Визуальный слой (модальное окно, иллюстрации и карточки) намеренно не
 * находится здесь: он может подключить эти данные по id.
 */

import type { PetActionType, PetHelpAlternative } from '../../core/periodRules';

export type PeriodId = 1 | 2 | 3 | 4 | 5;

export type EventExpenseType = 'mandatory' | 'optional' | 'goal';

export interface EventEffects {
  coins?: number;
  savings?: number;
  wealth?: number;
  health?: number;
  happiness?: number;
}

export interface PeriodEventOption {
  id: string;
  label: string;
  cost?: number;
  expenseType?: EventExpenseType;
  effects: EventEffects;
  feedback: string;
  /** Конкретное действие после этого выбора. Пока подключается поэтапно:
   * существующие события могут не иметь поля до утверждения их последствий. */
  requiredPetAction?: PetActionType;
  /** Альтернативы помощи при проблеме со здоровьем (например, лекарство
   * или корм с меньшим эффектом). */
  petHelpAlternatives?: PetHelpAlternative[];
}

export interface PeriodEventDefinition {
  id: string;
  periodId: PeriodId;
  order: 1 | 2 | 3;
  title: string;
  context: string;
  lessonId?: string;
  previousEventId?: string;
  introEffects?: EventEffects;
  options: PeriodEventOption[];
}

export const PERIOD_EVENTS: PeriodEventDefinition[] = [
  {
    id: 'period-1-feed-first',
    periodId: 1,
    order: 1,
    title: 'Корм закончился',
    lessonId: 'what-is-money',
    context: 'Питомец проголодался, а корм закончился. Но тебе ещё очень нравится новая машинка. Что купить сначала?',
    options: [
      { id: 'buy-food', label: 'Купить корм', cost: 30, expenseType: 'mandatory', effects: { coins: -30, health: 10, happiness: 2 }, feedback: 'Питомец сыт, а важная потребность закрыта. В кошельке осталось на 30 монет меньше.' },
      { id: 'buy-toy', label: 'Купить машинку', cost: 30, expenseType: 'optional', effects: { coins: -30, health: -10, happiness: 8 }, feedback: 'Игрушка порадовала, но питомец всё ещё голоден. Сначала важное.' },
      { id: 'buy-nothing', label: 'Ничего не покупать', effects: { health: -10, happiness: -2 }, feedback: 'Монеты сохранились, но проблема не решилась.' },
    ],
  },
  {
    id: 'period-1-help-reward',
    periodId: 1,
    order: 2,
    title: 'Награда за помощь',
    previousEventId: 'period-1-feed-first',
    introEffects: { coins: 30 },
    context: 'Ты помог дома и получил 30 монет. Что делать с новыми деньгами?',
    options: [
      { id: 'keep-all', label: 'Оставить все деньги', effects: { wealth: 3 }, feedback: 'Баланс увеличился, и теперь у тебя есть запас для следующих решений.' },
      { id: 'buy-ice-cream', label: 'Купить мороженое', cost: 10, expenseType: 'optional', effects: { coins: -10, happiness: 5 }, feedback: 'Маленькая радость возможна, если она помещается в бюджет.' },
      { id: 'buy-big-toy', label: 'Купить большую игрушку', cost: 50, expenseType: 'optional', effects: { coins: -50, happiness: 15, wealth: -4 }, feedback: 'Все деньги ушли на желание. Теперь запас закончился.' },
    ],
  },
  {
    id: 'period-1-bowl-breaks',
    periodId: 1,
    order: 3,
    title: 'Разбилась миска',
    lessonId: 'needs-vs-wants',
    previousEventId: 'period-1-help-reward',
    context: 'Новая важная трата стоит 20 монет, но ты хотел потратить их на развлечение. Что делать?',
    options: [
      { id: 'replace-bowl', label: 'Купить миску вместо развлечения', cost: 20, expenseType: 'mandatory', effects: { coins: -20, health: 5, happiness: 5 }, feedback: 'Обязательная потребность закрыта, питомец снова доволен.' },
      { id: 'buy-entertainment', label: 'Потратить на развлечение', cost: 20, expenseType: 'optional', effects: { coins: -20, happiness: 8, health: -5 }, feedback: 'Желание исполнено, но важную миску всё ещё нужно заменить.' },
      { id: 'buy-both', label: 'Купить и миску, и развлечение', cost: 40, expenseType: 'optional', effects: { coins: -40, health: 5, happiness: 10, wealth: -3 }, feedback: 'Два желания сразу могут привести к дефициту бюджета.' },
    ],
  },
  {
    id: 'period-2-smart-shopping',
    periodId: 2,
    order: 1,
    title: 'Большой поход в магазин',
    lessonId: 'piggy-bank',
    context: 'Нужно купить корм и шампунь. У тебя 50 монет. Какой корм выбрать?',
    options: [
      { id: 'food-a', label: 'Корм А + шампунь', cost: 40, expenseType: 'mandatory', effects: { coins: -40, health: 8, wealth: 4 }, feedback: 'Одинаковая польза за меньшую цену оставила 10 монет в запасе.' },
      { id: 'food-b', label: 'Корм В + шампунь', cost: 50, expenseType: 'mandatory', effects: { coins: -50, health: 8 }, feedback: 'Покупка возможна, но выгодный вариант оставил бы запас.' },
      { id: 'add-treat', label: 'Добавить яркое лакомство', effects: { happiness: 5, wealth: -2 }, feedback: 'Незапланированная покупка не помогает выполнить список и уменьшает запас.' },
    ],
  },
  {
    id: 'period-2-real-discount',
    periodId: 2,
    order: 2,
    title: 'Большая акция!',
    previousEventId: 'period-2-smart-shopping',
    context: 'Скидка не всегда означает выгоду. Что выбрать?',
    options: [
      { id: 'sale-toy', label: 'Купить игрушку по акции', cost: 40, expenseType: 'optional', effects: { coins: -40, happiness: 10, wealth: -5 }, feedback: 'Скидка не сделала незапланированную покупку необходимой.' },
      { id: 'sale-shampoo', label: 'Купить нужный шампунь по акции', cost: 20, expenseType: 'mandatory', effects: { coins: -20, health: 5, wealth: 3 }, feedback: 'Вот настоящая выгода: нужный товар куплен дешевле.' },
      { id: 'skip-sale', label: 'Пройти мимо', effects: { wealth: 2 }, feedback: 'Деньги сохранились — иногда лучший выбор ничего не покупать.' },
    ],
  },
  {
    id: 'period-2-overloaded-cart',
    periodId: 2,
    order: 3,
    title: 'Лишнее в корзине',
    lessonId: 'impulse-buying',
    previousEventId: 'period-2-real-discount',
    context: 'Сумма в корзине превысила бюджет. Что убрать?',
    options: [
      { id: 'remove-stickers', label: 'Убрать наклейки', effects: { wealth: 4 }, feedback: 'Корзина снова соответствует списку и бюджету.' },
      { id: 'remove-vitamins', label: 'Убрать витамины', effects: { health: -8, wealth: 1 }, feedback: 'Бюджет уменьшился, но важная покупка исчезла.' },
      { id: 'pay-over-budget', label: 'Попробовать оплатить всё', effects: { wealth: -5 }, feedback: 'Игра показывает дефицит: нельзя потратить больше, чем есть.' },
    ],
  },
  {
    id: 'period-3-dream-house',
    periodId: 3,
    order: 1,
    title: 'Домик мечты',
    lessonId: 'financial-goal',
    context: 'Домик стоит 300 монет. Сразу купить его не получится, но можно копить понемногу. Сколько отложить сейчас?',
    options: [
      { id: 'save-ten', label: 'Отложить 10, оставить 10', effects: { savings: 10, wealth: 4 }, feedback: 'Небольшой взнос тоже приближает большую цель.' },
      { id: 'save-all', label: 'Отложить все 20', effects: { savings: 20, wealth: 7 }, feedback: 'Цель выросла быстрее, но в кошельке ничего не осталось.' },
      { id: 'spend-all', label: 'Потратить все 20', cost: 20, expenseType: 'optional', effects: { coins: -20, happiness: 8 }, feedback: 'Желание исполнено, но прогресс цели не изменился.' },
    ],
  },
  {
    id: 'period-3-plan-changed',
    periodId: 3,
    order: 2,
    title: 'План изменился',
    previousEventId: 'period-3-dream-house',
    context: 'Ты хотел отложить 30 монет, но появилась важная покупка за 10. В копилку получилось положить только 20. Что произошло?',
    options: [
      { id: 'important-purchase', label: 'Деньги ушли на важную покупку', effects: { savings: 20, health: 5, wealth: 3 }, feedback: 'План изменился из-за важной покупки. Это отклонение можно объяснить и учесть.' },
      { id: 'money-disappeared', label: 'Монеты просто исчезли', effects: { wealth: -3 }, feedback: 'У любого расхода должна быть понятная причина.' },
      { id: 'piggy-broke', label: 'Копилка сломалась', effects: { wealth: -2 }, feedback: 'Копилка не ломалась — нужно искать реальную причину изменения плана.' },
    ],
  },
  {
    id: 'period-3-last-ten',
    periodId: 3,
    order: 3,
    title: 'Последние 10 монет',
    lessonId: 'plan-and-fact',
    previousEventId: 'period-3-plan-changed',
    context: 'До домика осталось 10 монет, но рядом появилась игрушка, которую очень хочется. Что выбрать?',
    options: [
      { id: 'save-last-ten', label: 'Положить 10 в копилку', effects: { savings: 10, wealth: 8, happiness: 5 }, feedback: 'Цель достигнута: питомец получает уютный домик.' },
      { id: 'buy-last-toy', label: 'Купить игрушку', cost: 10, expenseType: 'optional', effects: { coins: -10, happiness: 12, wealth: -3 }, feedback: 'Игрушка принесла радость, но до большой цели осталось ещё 10 монет.' },
      { id: 'split-last-ten', label: '5 отложить, 5 потратить', cost: 5, effects: { coins: -5, savings: 5, happiness: 6, wealth: 2 }, feedback: 'Ты приблизился к цели и оставил себе небольшую радость.' },
    ],
  },
  {
    id: 'period-4-sick-pet', periodId: 4, order: 1,
    title: 'Мани простудился',
    context: 'Мани плохо себя чувствует. Лекарство стоит 30 монет, но ты хотел купить новую игрушку.',
    options: [
      { id: 'medicine', label: 'Купить лекарство', cost: 30, expenseType: 'mandatory', requiredPetAction: 'medicine', effects: { coins: -30, health: 8 }, feedback: 'Здоровье питомца восстановится после лекарства.' },
      { id: 'food-help', label: 'Купить полезную еду', cost: 15, expenseType: 'mandatory', requiredPetAction: 'feed', effects: { coins: -15, health: 3 }, feedback: 'Еда поможет, но восстановление будет неполным.' },
      { id: 'toy-first', label: 'Купить игрушку', cost: 30, expenseType: 'optional', requiredPetAction: 'medicine', effects: { coins: -30, happiness: 8, health: -5 }, feedback: 'Игрушка порадовала Мани, но здоровье всё ещё требует помощи.' },
    ],
  },
  {
    id: 'period-4-reward', periodId: 4, order: 2, previousEventId: 'period-4-sick-pet', introEffects: { coins: 50 },
    title: 'Неожиданная награда',
    context: 'Мани помог соседям и получил 50 монет. Как распорядиться наградой?',
    options: [
      { id: 'food-and-save', label: '20 на корм, остальное сохранить', cost: 20, expenseType: 'mandatory', requiredPetAction: 'feed', effects: { coins: -20, health: 6, wealth: 3 }, feedback: 'Питомец накормлен, а часть награды осталась в запасе.' },
      { id: 'new-toy', label: 'Купить игрушку за 40', cost: 40, expenseType: 'optional', requiredPetAction: 'buyToy', effects: { coins: -40, happiness: 10, wealth: -3 }, feedback: 'Мани рад, но запас денег стал меньше.' },
      { id: 'save-all', label: 'Сохранить все 50', requiredPetAction: 'buyToy', effects: { wealth: 5 }, feedback: 'Запас вырос, но Мани начинает скучать.' },
    ],
  },
  {
    id: 'period-4-broken-toy', periodId: 4, order: 3, previousEventId: 'period-4-reward',
    title: 'Сломалась любимая игрушка',
    context: 'Любимая игрушка Мани сломалась. Новая стоит 30 монет, но деньги могут понадобиться на корм.',
    options: [
      { id: 'replace-toy', label: 'Купить новую игрушку', cost: 30, expenseType: 'optional', requiredPetAction: 'buyToy', effects: { coins: -30, happiness: 8 }, feedback: 'Мани снова может играть.' },
      { id: 'food-first', label: 'Сначала купить корм', cost: 20, expenseType: 'mandatory', requiredPetAction: 'feed', effects: { coins: -20, health: 6 }, feedback: 'Здоровье важнее желания, игрушку можно купить позже.' },
      { id: 'wait', label: 'Пока ничего не покупать', requiredPetAction: 'buyToy', effects: { happiness: -5 }, feedback: 'Деньги сохранены, но грусть Мани усилилась.' },
    ],
  },
  {
    id: 'period-5-preparing-party', periodId: 5, order: 1,
    title: 'Подготовка к празднику',
    context: 'У тебя 60 монет. Нужно подготовить Мани к празднику и не потратить всё сразу.',
    options: [
      { id: 'food-toy', label: 'Корм и небольшая игрушка', cost: 50, expenseType: 'mandatory', requiredPetAction: 'feed', effects: { coins: -50, health: 5, happiness: 5 }, feedback: 'Питомец накормлен и готов к празднику.' },
      { id: 'big-toy', label: 'Потратить всё на большую игрушку', cost: 60, expenseType: 'optional', requiredPetAction: 'buyToy', effects: { coins: -60, happiness: 12, health: -4 }, feedback: 'Праздник яркий, но на корм денег не осталось.' },
      { id: 'food-only', label: 'Купить только корм', cost: 20, expenseType: 'mandatory', requiredPetAction: 'feed', effects: { coins: -20, health: 7 }, feedback: 'Здоровье в порядке, а на праздник осталось накопить.' },
    ],
  },
  {
    id: 'period-5-last-chance', periodId: 5, order: 2, previousEventId: 'period-5-preparing-party', introEffects: { coins: 50 },
    title: 'Последняя возможность накопить',
    context: 'До большой цели не хватает 40 монет. Ты получил последние 50, но Мани тоже нужна забота.',
    options: [
      { id: 'save-40', label: 'Отложить 40 монет', effects: { savings: 40, wealth: 8 }, requiredPetAction: 'feed', feedback: 'Цель достигнута, но на заботу осталась только малая сумма.' },
      { id: 'save-30-food', label: 'Отложить 30 и купить корм', cost: 20, expenseType: 'mandatory', effects: { savings: 30, coins: -20, health: 6 }, requiredPetAction: 'feed', feedback: 'Цель близко, а здоровье питомца поддержано.' },
      { id: 'toy', label: 'Купить игрушку за 40', cost: 40, expenseType: 'optional', effects: { coins: -40, happiness: 10, wealth: -3 }, requiredPetAction: 'buyToy', feedback: 'Мани счастлив, но большая цель отдалилась.' },
    ],
  },
  {
    id: 'period-5-final-choice', periodId: 5, order: 3, previousEventId: 'period-5-last-chance',
    title: 'Главное решение',
    context: 'У Мани снизились здоровье и настроение. В кошельке осталось 40 монет. Что важнее сейчас?',
    options: [
      { id: 'final-medicine', label: 'Купить лекарство', cost: 30, expenseType: 'mandatory', requiredPetAction: 'medicine', effects: { coins: -30, health: 10 }, feedback: 'Здоровье восстановлено, и период можно завершать уверенно.' },
      { id: 'final-food', label: 'Купить корм', cost: 20, expenseType: 'mandatory', requiredPetAction: 'feed', effects: { coins: -20, health: 5 }, feedback: 'Корм поможет, но восстановление будет частичным.' },
      { id: 'final-toy', label: 'Купить игрушку', cost: 30, expenseType: 'optional', requiredPetAction: 'buyToy', effects: { coins: -30, happiness: 12, health: -3 }, feedback: 'Настроение улучшилось, но здоровье всё ещё требует внимания.' },
    ],
  },
];

export function getPeriodEvents(periodId: PeriodId): PeriodEventDefinition[] {
  return PERIOD_EVENTS.filter((event) => event.periodId === periodId).sort((a, b) => a.order - b.order);
}

export function getPeriodLessonIds(periodId: PeriodId): string[] {
  return getPeriodEvents(periodId)
    .map((event) => event.lessonId)
    .filter((lessonId): lessonId is string => Boolean(lessonId));
}

export function getPeriodEvent(id: string): PeriodEventDefinition | undefined {
  return PERIOD_EVENTS.find((event) => event.id === id);
}
