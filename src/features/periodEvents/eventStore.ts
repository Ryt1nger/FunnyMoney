import { create } from 'zustand';
import { storage } from '../../services/storage';
import { useEconomyStore } from '../economy/economyStore';
import { usePetStore } from '../pet/petStore';
import { usePeriodStore } from '../economy/periodStore';
import { useLessonProgressStore } from '../progress/lessonProgressStore';
import { useInventoryStore } from '../inventory/inventoryStore';
import { shopProducts } from '../../data/shopData';
import { useSettingsStore } from '../settings/settingsStore';
import { getPeriodEvent, getPeriodEvents, type EventEffects, type PeriodEventDefinition, type PeriodEventOption, type PeriodId } from './eventData';
import type { PetActionType } from '../../core/periodRules';

const STORAGE_KEY = 'period_events';
export const FIRST_EVENT_DELAY_MS = 2 * 60 * 1000;
export const BETWEEN_EVENTS_DELAY_MS = 30 * 1000;
const DEMO_FIRST_EVENT_DELAY_MS = 1500;
const DEMO_BETWEEN_EVENTS_DELAY_MS = 900;

function eventDelay(event: PeriodEventDefinition): number {
  if (useSettingsStore.getState().demoMode) {
    return event.order === 1 || !!event.lessonId
      ? DEMO_FIRST_EVENT_DELAY_MS
      : DEMO_BETWEEN_EVENTS_DELAY_MS;
  }
  return event.order === 1 || !!event.lessonId ? FIRST_EVENT_DELAY_MS : BETWEEN_EVENTS_DELAY_MS;
}

export interface EventChoiceRecord {
  eventId: string;
  optionId: string;
  timestamp: number;
  effects: EventEffects;
  feedback: string;
  requiredPetAction: PetActionType;
  /** Если выбранный платный вариант оказался невыполнимым, движок применил
   *  безопасную бесплатную альтернативу, чтобы цепочка не зависла. */
  resolution?: 'normal' | 'alternative';
}

export interface PeriodEventState {
  periodId: PeriodId;
  completedEventIds: string[];
  introAppliedEventIds: string[];
  choices: EventChoiceRecord[];
  history: EventChoiceRecord[];
  /** Время, после которого очередное событие может появиться. */
  nextEventAt?: number;
  /** Версия ухода, которую нужно выполнить перед следующим событием. */
  careVersionRequired?: number;
  requiredPetAction?: PetActionType;
  /** Событие, для которого сейчас нужна забота о питомце. */
  careEventId?: string;
}

interface PeriodEventStore extends PeriodEventState {
  hydrate: () => void;
  syncPeriod: (periodId: PeriodId) => void;
  getAvailableEvent: () => PeriodEventDefinition | null;
  getPendingPetAction: () => PetActionType | null;
  completePendingCare: (action: PetActionType) => boolean;
  isEventCompleted: (eventId: string) => boolean;
  resolveChoice: (eventId: string, optionId: string) => { ok: true; choice: EventChoiceRecord } | { ok: false; reason: 'unavailable' | 'insufficient_funds' | 'invalid_option' };
  resetCurrentPeriod: () => void;
  /** Только для дев-панели: помечает все события перед eventId (по цепочке
   *  previousEventId) выполненными, чтобы getAvailableEvent() сразу вернул
   *  именно это событие — без реального прохождения предыдущих. Награды/
   *  эффекты пропущенных событий не начисляются (это не resolveChoice). */
  debugJumpToEvent: (eventId: string) => void;
  /** Только для дев-панели: отмечает все события периода выполненными,
   *  чтобы Home запустил обычный completePeriod(). */
  debugCompletePeriod: (periodId: PeriodId) => void;
}

function actionForChoice(event: PeriodEventDefinition, option: PeriodEventOption): PetActionType {
  if (option.requiredPetAction) return option.requiredPetAction;
  if (option.effects.health !== undefined && option.effects.health < 0) {
    return event.id.includes('feed') || event.id.includes('bowl') ? 'feed' : 'medicine';
  }
  // Даже хороший ответ не пропускает уход: питомцу становится скучно.
  return 'buyToy';
}

function findSafeAlternative(event: PeriodEventDefinition, selected: PeriodEventOption): PeriodEventOption | null {
  return event.options.find((option) => (
    option.id !== selected.id
    && (option.cost ?? 0) <= 0
    && (option.effects.coins ?? 0) >= 0
    && (option.effects.savings ?? 0) >= 0
  )) ?? null;
}

function emptyState(periodId: PeriodId): PeriodEventState {
  return { periodId, completedEventIds: [], introAppliedEventIds: [], choices: [], history: [] };
}

function isValid(value: unknown): value is PeriodEventState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (
    (state.periodId === 1 || state.periodId === 2 || state.periodId === 3 || state.periodId === 4 || state.periodId === 5)
    && Array.isArray(state.completedEventIds)
    && Array.isArray(state.introAppliedEventIds)
    && Array.isArray(state.choices)
    && Array.isArray(state.history)
  );
}

function loadInitial(): PeriodEventState {
  const saved = storage.get<PeriodEventState>(STORAGE_KEY);
  return saved && isValid(saved) ? saved : emptyState(1);
}

function persist(state: PeriodEventState): void {
  void storage.set(STORAGE_KEY, state);
}

function applyCoinsEffect(amount: number, reason: string, periodId: number): boolean {
  if (!amount) return true;
  const economy = useEconomyStore.getState();
  if (amount < 0 && economy.coins < Math.abs(amount)) return false;
  economy.applyCoinsDelta(amount, reason, {
    periodId,
    category: amount < 0 ? 'optional' : 'reward',
  });
  return true;
}

function requiredWalletForOption(option: PeriodEventOption): number {
  const cost = Math.max(0, option.cost ?? 0);
  const savings = Math.max(0, option.effects.savings ?? 0);
  // `cost` и effects.coins часто описывают одну и ту же покупку. Учитываем
  // только дополнительное списание сверх cost, чтобы не списать его дважды.
  const netCoinsAfterCost = (option.effects.coins ?? 0) + cost;
  const extraSpend = Math.max(0, -netCoinsAfterCost);
  return cost + extraSpend + savings;
}

function applyOptionEffects(event: PeriodEventDefinition, option: PeriodEventOption, extraCoins = 0): boolean {
  const period = usePeriodStore.getState();
  const economy = useEconomyStore.getState();
  const effects = option.effects;
  const cost = option.cost ?? 0;
  const savingsToAdd = effects.savings ?? 0;

  // Проверяем всю операцию до первого списания, чтобы выбор не применился
  // частично, если кошелька не хватает на трату или взнос в копилку.
  const requiredWallet = requiredWalletForOption(option);
  if (economy.coins + extraCoins < requiredWallet) return false;
  if ((effects.savings ?? 0) < 0 && (economy.savingsBalance ?? economy.totalSaved) < Math.abs(effects.savings ?? 0)) return false;
  // Восстанавливаем синхронизацию перед изменением факта периода. Это
  // защищает цепочку, если ребёнок потратил/получил монеты вне экрана периода.
  if (period.status === 'active' && period.walletBalance !== economy.coins) {
    period.ensureCurrentPeriod(economy.coins, economy.savingsBalance ?? economy.totalSaved);
  }
  if (period.status === 'active' && cost > 0) {
    const recorded = period.recordPurchase({
      id: `event:${event.id}:${option.id}`,
      price: cost,
      expenseType: option.expenseType ?? 'optional',
      mealType: 'none',
      satietyEffect: effects.health ?? 0,
      moodEffect: effects.happiness ?? 0,
      savingsOnly: false,
      periodEligible: true,
    });
    if (!recorded) return false;
  }
  if (cost > 0 && !applyCoinsEffect(-cost, `${event.title}: ${option.label}`, period.id)) return false;
  // cost — это уже списание из effects.coins; не списываем его второй раз.
  const additionalCoins = (effects.coins ?? 0) + cost;
  if (additionalCoins && !applyCoinsEffect(additionalCoins, `${event.title}: ${option.label}`, period.id)) return false;
  if (savingsToAdd > 0 && !economy.depositToSavings(savingsToAdd)) return false;
  if ((effects.savings ?? 0) < 0 && !economy.withdrawFromSavings(Math.abs(effects.savings ?? 0))) return false;
  // Богатство не изменяется отдельным бонусом события: оно всегда считается
  // от текущего капитала (кошелёк + копилка) в Home/статистике.
  if (effects.health || effects.happiness) {
    usePetStore.getState().applyDelta({ health: effects.health, happiness: effects.happiness });
  }
  return true;
}

export const usePeriodEventStore = create<PeriodEventStore>((set, get) => ({
  ...loadInitial(),

  hydrate: () => {
    const saved = storage.get<PeriodEventState>(STORAGE_KEY);
    const next = saved && isValid(saved) ? saved : emptyState(1);
    persist(next);
    set(next);
  },

  syncPeriod: (periodId) => {
    const state = get();
    if (state.periodId === periodId) return;
    const next = { ...emptyState(periodId), history: state.history };
    persist(next);
    set(next);
  },

  getAvailableEvent: () => {
    const period = usePeriodStore.getState();
    const state = get();
    if (state.periodId !== period.id) get().syncPeriod(period.id as PeriodId);
    if (period.status !== 'active') return null;
    const current = get();
    const pet = usePetStore.getState().pet;
    // Обязательная забота о питомце между событиями — реальный игровой цикл,
    // но в демо-режиме (быстрое тестирование всего цикла периода) она не
    // должна требовать реального захода в мини-игру/кухню между КАЖДЫМ
    // событием: иначе демо-режим ускоряет только таймеры, а цепочка всё
    // равно виснет на первом же событии, ожидая ухода за питомцем.
    const demoMode = useSettingsStore.getState().demoMode;
    if (!demoMode && current.careVersionRequired !== undefined && (pet?.careVersion ?? 0) <= current.careVersionRequired) return null;
    const lessons = useLessonProgressStore.getState();
    const event = getPeriodEvents(period.id as PeriodId).find((event) => {
      if (current.completedEventIds.includes(event.id)) return false;
      if (event.previousEventId && !current.completedEventIds.includes(event.previousEventId)) return false;
      if (event.lessonId && !lessons.isCompleted(event.lessonId)) return false;
      return true;
    });
    if (!event) return null;
    if (current.nextEventAt === undefined) {
      const next = { ...current, nextEventAt: Date.now() + eventDelay(event) };
      persist(next);
      set(next);
      return null;
    }
    if (Date.now() < current.nextEventAt) return null;
    return event;
  },

  isEventCompleted: (eventId) => get().completedEventIds.includes(eventId),

  getPendingPetAction: () => {
    let state = get();
    if (state.careVersionRequired === undefined || !state.requiredPetAction) return null;
    // Восстанавливаем состояние после закрытия/перезапуска приложения: если
    // мини-игра успела связать действие с событием, но сам eventStore не успел
    // записать очистку pending-полей, не показываем ребёнку ту же задачу снова.
    if (state.careEventId) {
      const alreadyUsed = usePetStore.getState().pet?.careInteractions?.some(
        (interaction) => interaction.usedForEventId === state.careEventId,
      );
      if (alreadyUsed) {
        const next = { ...state, careVersionRequired: undefined, requiredPetAction: undefined, careEventId: undefined };
        persist(next);
        set(next);
        state = next;
        return null;
      }
    }
    // Если последствие требует лекарства, но ребёнок ещё не может его купить,
    // разрешаем безопасную альтернативу: покормить питомца. Это всё равно
    // меняет careVersion и не даёт перескочить через обязательное действие.
    if (state.requiredPetAction === 'medicine') {
      if (usePetStore.getState().findRecentCareInteraction('medicine')) return 'medicine';
      const medicine = shopProducts.find((product) => product.id === 'medicine-pet');
      const medicineQty = useInventoryStore.getState().medicineQty['medicine-pet'] ?? 0;
      const coins = useEconomyStore.getState().coins;
      if (medicineQty <= 0 && (!medicine || coins < medicine.price)) return 'feed';
    }
    return state.requiredPetAction;
  },

  completePendingCare: (action) => {
    const state = get();
    const eventId = state.careEventId ?? state.choices[state.choices.length - 1]?.eventId;
    if (!state.requiredPetAction || !eventId) return false;
    if (action !== state.requiredPetAction && !(state.requiredPetAction === 'medicine' && action === 'feed')) return false;
    const pet = usePetStore.getState();
    // Если действие было выполнено заранее, связываем именно эту запись с
    // событием. Для нового действия достаточно завершить обязательную заботу.
    if (!pet.useCareInteractionForEvent(action, eventId)) return false;
    const next = { ...state, careVersionRequired: undefined, requiredPetAction: undefined, careEventId: undefined };
    persist(next);
    set(next);
    return true;
  },

  resolveChoice: (eventId, optionId) => {
    const period = usePeriodStore.getState();
    const event = getPeriodEvent(eventId);
    if (!event || event.periodId !== period.id || period.status !== 'active') return { ok: false, reason: 'unavailable' };
    const state = get();
    if (state.completedEventIds.includes(eventId)) return { ok: false, reason: 'unavailable' };
    if (event.previousEventId && !state.completedEventIds.includes(event.previousEventId)) return { ok: false, reason: 'unavailable' };
    if (event.lessonId && !useLessonProgressStore.getState().isCompleted(event.lessonId)) return { ok: false, reason: 'unavailable' };
    const option = event.options.find((item) => item.id === optionId);
    if (!option) return { ok: false, reason: 'invalid_option' };

    const introCoins = state.introAppliedEventIds.includes(event.id) ? 0 : (event.introEffects?.coins ?? 0);
    const requiredWallet = requiredWalletForOption(option);
    const canPay = useEconomyStore.getState().coins + introCoins >= requiredWallet;
    const alternative = !canPay ? findSafeAlternative(event, option) : null;
    const resolvedOption = canPay ? option : alternative;

    // Одноразовый доход события 2 начисляется при первом выборе, а не при
    // каждом открытии модального окна.
    if (event.introEffects && !state.introAppliedEventIds.includes(event.id)) {
      if (event.introEffects.coins && !applyCoinsEffect(event.introEffects.coins, `${event.title}: доход`, period.id)) {
        return { ok: false, reason: 'insufficient_funds' };
      }
    }
    let resolution: 'normal' | 'alternative' = 'normal';
    let effectiveOption: PeriodEventOption = { ...option, cost: 0, effects: {} };
    if (!resolvedOption) {
      // В событии нет бесплатного варианта, но и это не должно блокировать
      // период навсегда: фиксируем безопасное решение без списания денег.
      resolution = 'alternative';
    } else if (applyOptionEffects(event, resolvedOption, introCoins)) {
      effectiveOption = resolvedOption;
    } else {
      const secondAlternative = findSafeAlternative(event, resolvedOption);
      if (secondAlternative && applyOptionEffects(event, secondAlternative, 0)) {
        effectiveOption = secondAlternative;
      }
      // Не оставляем частично применённый выбор незавершённым. Событие
      // будет закрыто мягким fallback-результатом без новой траты.
      resolution = 'alternative';
    }

    const requiredPetAction = actionForChoice(event, effectiveOption);
    const fallbackText = `Монет не хватило на выбранный вариант. Игра выбрала безопасный шаг без новой траты, чтобы продолжить период.`;
    const feedback = resolution === 'alternative' ? `${fallbackText} ${effectiveOption.feedback ?? ''}` : effectiveOption.feedback;
    const pet = usePetStore.getState();
    const preCompletedCare = pet.findRecentCareInteraction(requiredPetAction);
    const careSatisfied = Boolean(preCompletedCare && pet.useCareInteractionForEvent(requiredPetAction, eventId));
    const choice: EventChoiceRecord = {
      eventId,
      optionId,
      timestamp: Date.now(),
      effects: effectiveOption.effects,
      feedback,
      requiredPetAction,
      resolution,
    };
    const next: PeriodEventState = {
      ...get(),
      completedEventIds: [...get().completedEventIds, eventId],
      introAppliedEventIds: event.introEffects && !get().introAppliedEventIds.includes(event.id)
        ? [...get().introAppliedEventIds, event.id]
        : get().introAppliedEventIds,
      choices: [...get().choices, choice],
      history: [...get().history, choice],
      nextEventAt: Date.now() + (useSettingsStore.getState().demoMode ? DEMO_BETWEEN_EVENTS_DELAY_MS : BETWEEN_EVENTS_DELAY_MS),
      careVersionRequired: careSatisfied ? undefined : (usePetStore.getState().pet?.careVersion ?? 0),
      requiredPetAction: careSatisfied ? undefined : requiredPetAction,
      careEventId: careSatisfied ? undefined : eventId,
    };
    persist(next);
    set(next);
    return { ok: true, choice };
  },

  resetCurrentPeriod: () => {
    const state = get();
    const next = { ...emptyState(state.periodId), history: state.history };
    persist(next);
    set(next);
  },

  debugJumpToEvent: (eventId) => {
    const event = getPeriodEvent(eventId);
    if (!event) return;
    const chain: string[] = [];
    let cursor = event;
    while (cursor.previousEventId) {
      chain.unshift(cursor.previousEventId);
      const prev = getPeriodEvent(cursor.previousEventId);
      if (!prev) break;
      cursor = prev;
    }
    const next: PeriodEventState = {
      periodId: event.periodId,
      completedEventIds: chain,
      introAppliedEventIds: chain,
      choices: get().choices,
      history: get().history,
      nextEventAt: Date.now(),
      careVersionRequired: undefined,
    };
    persist(next);
    set(next);
  },

  debugCompletePeriod: (periodId) => {
    const events = getPeriodEvents(periodId);
    const completedEventIds = events.map((event) => event.id);
    const next: PeriodEventState = {
      ...emptyState(periodId),
      completedEventIds,
      introAppliedEventIds: completedEventIds,
      nextEventAt: Date.now(),
    };
    persist(next);
    set(next);
  },
}));
