import { create } from 'zustand';
import { storage } from '../../services/storage';
import { useEconomyStore } from '../economy/economyStore';
import { usePetStore } from '../pet/petStore';
import { usePeriodStore } from '../economy/periodStore';
import { useLessonProgressStore } from '../progress/lessonProgressStore';
import { getPeriodEvent, getPeriodEvents, type EventEffects, type PeriodEventDefinition, type PeriodEventOption } from './eventData';

const STORAGE_KEY = 'period_events';
export const FIRST_EVENT_DELAY_MS = 2 * 60 * 1000;
export const BETWEEN_EVENTS_DELAY_MS = 30 * 1000;

export interface EventChoiceRecord {
  eventId: string;
  optionId: string;
  timestamp: number;
  effects: EventEffects;
  feedback: string;
}

export interface PeriodEventState {
  periodId: 1 | 2 | 3;
  completedEventIds: string[];
  introAppliedEventIds: string[];
  choices: EventChoiceRecord[];
  history: EventChoiceRecord[];
  /** Время, после которого очередное событие может появиться. */
  nextEventAt?: number;
  /** Версия ухода, которую нужно выполнить перед следующим событием. */
  careVersionRequired?: number;
}

interface PeriodEventStore extends PeriodEventState {
  hydrate: () => void;
  syncPeriod: (periodId: 1 | 2 | 3) => void;
  getAvailableEvent: () => PeriodEventDefinition | null;
  isEventCompleted: (eventId: string) => boolean;
  resolveChoice: (eventId: string, optionId: string) => { ok: true; choice: EventChoiceRecord } | { ok: false; reason: 'unavailable' | 'insufficient_funds' | 'invalid_option' };
  resetCurrentPeriod: () => void;
  /** Только для дев-панели: помечает все события перед eventId (по цепочке
   *  previousEventId) выполненными, чтобы getAvailableEvent() сразу вернул
   *  именно это событие — без реального прохождения предыдущих. Награды/
   *  эффекты пропущенных событий не начисляются (это не resolveChoice). */
  debugJumpToEvent: (eventId: string) => void;
}

function emptyState(periodId: 1 | 2 | 3): PeriodEventState {
  return { periodId, completedEventIds: [], introAppliedEventIds: [], choices: [], history: [] };
}

function isValid(value: unknown): value is PeriodEventState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (
    (state.periodId === 1 || state.periodId === 2 || state.periodId === 3)
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

function applyOptionEffects(event: PeriodEventDefinition, option: PeriodEventOption, extraCoins = 0): boolean {
  const period = usePeriodStore.getState();
  const economy = useEconomyStore.getState();
  const effects = option.effects;
  const cost = option.cost ?? 0;
  const savingsToAdd = effects.savings ?? 0;

  // Проверяем всю операцию до первого списания, чтобы выбор не применился
  // частично, если кошелька не хватает на трату или взнос в копилку.
  const requiredWallet = Math.max(0, cost) + Math.max(0, savingsToAdd);
  if (economy.coins + extraCoins < requiredWallet) return false;
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
  if (effects.wealth) economy.applyWealthDelta(effects.wealth);
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
    if (state.periodId !== period.id) get().syncPeriod(period.id as 1 | 2 | 3);
    if (period.status !== 'active') return null;
    const current = get();
    const pet = usePetStore.getState().pet;
    if (current.careVersionRequired !== undefined && (pet?.careVersion ?? 0) <= current.careVersionRequired) return null;
    const lessons = useLessonProgressStore.getState();
    const event = getPeriodEvents(period.id as 1 | 2 | 3).find((event) => {
      if (current.completedEventIds.includes(event.id)) return false;
      if (event.previousEventId && !current.completedEventIds.includes(event.previousEventId)) return false;
      if (event.lessonId && !lessons.isCompleted(event.lessonId)) return false;
      return true;
    });
    if (!event) return null;
    if (current.nextEventAt === undefined) {
      const delay = event.order === 1 || !!event.lessonId ? FIRST_EVENT_DELAY_MS : BETWEEN_EVENTS_DELAY_MS;
      const next = { ...current, nextEventAt: Date.now() + delay };
      persist(next);
      set(next);
      return null;
    }
    if (Date.now() < current.nextEventAt) return null;
    return event;
  },

  isEventCompleted: (eventId) => get().completedEventIds.includes(eventId),

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
    const requiredWallet = (option.cost ?? 0) + Math.max(0, option.effects.savings ?? 0);
    if (useEconomyStore.getState().coins + introCoins < requiredWallet) {
      return { ok: false, reason: 'insufficient_funds' };
    }

    // Одноразовый доход события 2 начисляется при первом выборе, а не при
    // каждом открытии модального окна.
    if (event.introEffects && !state.introAppliedEventIds.includes(event.id)) {
      if (event.introEffects.coins && !applyCoinsEffect(event.introEffects.coins, `${event.title}: доход`, period.id)) {
        return { ok: false, reason: 'insufficient_funds' };
      }
    }
    if (!applyOptionEffects(event, option, introCoins)) return { ok: false, reason: 'insufficient_funds' };

    const choice: EventChoiceRecord = {
      eventId,
      optionId,
      timestamp: Date.now(),
      effects: option.effects,
      feedback: option.feedback,
    };
    const next: PeriodEventState = {
      ...get(),
      completedEventIds: [...get().completedEventIds, eventId],
      introAppliedEventIds: event.introEffects && !get().introAppliedEventIds.includes(event.id)
        ? [...get().introAppliedEventIds, event.id]
        : get().introAppliedEventIds,
      choices: [...get().choices, choice],
      history: [...get().history, choice],
      nextEventAt: Date.now() + BETWEEN_EVENTS_DELAY_MS,
      careVersionRequired: usePetStore.getState().pet?.careVersion ?? 0,
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
}));
