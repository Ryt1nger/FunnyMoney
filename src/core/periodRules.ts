/** Общие правила курса. Здесь находятся только подтверждённые правила,
 * а не тексты и конкретные последствия будущих событий. */
export const PERIOD_IDS = [1, 2, 3, 4, 5] as const;
export type PeriodId = (typeof PERIOD_IDS)[number];

/** Единственные действия ребёнка, которые могут быть обязательным
 * последствием выбора в событии. */
export const PET_ACTION_TYPES = ['feed', 'buyToy', 'medicine'] as const;
export type PetActionType = (typeof PET_ACTION_TYPES)[number];

/** Вариант помощи питомцу после проблемы со здоровьем. Лекарство покупается
 * обычным товаром магазина; корм остаётся допустимой, но менее эффективной
 * альтернативой и будет подключён на следующем шаге движка последствий. */
export interface PetHelpAlternative {
  type: 'medicine' | 'feed';
  label: string;
  productId?: string;
  healthEffect?: number;
  happinessEffect?: number;
  /** Альтернатива не показывается сразу: она становится доступной только
   * если основной вариант нельзя выполнить из-за нехватки монет. */
  availableWhen: 'insufficient_funds';
}
