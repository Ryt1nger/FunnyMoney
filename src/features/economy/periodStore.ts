import { create } from 'zustand';
import {
  ECONOMY_RULES,
  type BudgetPlan,
  type EconomyProductMeta,
  type PeriodActuals,
  type PeriodRewardFlags,
  type PeriodState,
  type PeriodSummary,
  validateBudgetPlan,
  calculatePeriodResult,
} from '../../core/economy';
import { storage } from '../../services/storage';
import { useLessonProgressStore } from '../progress/lessonProgressStore';
import { usePetStore } from '../pet/petStore';
import { useEconomyStore } from './economyStore';
import { getPeriodLessonIds, type PeriodId } from '../periodEvents/eventData';
import { PERIODS } from '../../data/periodsData';

const STORAGE_KEY = 'economy_period';

function emptyActuals(): PeriodActuals {
  return { mandatory: 0, optional: 0, savings: 0 };
}

function emptyFlags(): PeriodRewardFlags {
  return {
    planConfirmed: false,
    savingsDepositGranted: false,
    cashbackGranted: false,
    dailyRewardGranted: false,
    periodRewardGranted: false,
  };
}

export function createInitialPeriod(walletBalance = 0, savingsBalance = 0): PeriodState {
  return {
    id: 1,
    // Доход периода не является фиксированной суммой: это фактический
    // доступный кошелёк на момент планирования.
    income: walletBalance,
    plan: null,
    actual: emptyActuals(),
    walletBalance,
    savingsBalance,
    startingWalletBalance: walletBalance,
    startingSavingsBalance: savingsBalance,
    practiceCount: 0,
    rewardFlags: emptyFlags(),
    status: 'planning',
    history: [],
  };
}

function isValidPeriod(value: unknown): value is PeriodState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.income === 'number' &&
    (v.plan === null || typeof v.plan === 'object') &&
    typeof v.actual === 'object' &&
    typeof v.walletBalance === 'number' &&
    typeof v.savingsBalance === 'number' &&
    typeof v.rewardFlags === 'object' &&
    (v.status === 'planning' || v.status === 'active' || v.status === 'completed')
  );
}

function summarizePeriod(state: PeriodState): PeriodSummary {
  return {
    id: state.id,
    income: state.income,
    plan: state.plan,
    actual: state.actual,
    startingWalletBalance: state.startingWalletBalance ?? state.walletBalance,
    endingWalletBalance: state.walletBalance,
    startingSavingsBalance: state.startingSavingsBalance ?? state.savingsBalance,
    endingSavingsBalance: state.savingsBalance,
    result: state.result,
  };
}

function persist(period: PeriodState): void {
  void storage.set(STORAGE_KEY, period);
}

interface PeriodStore extends PeriodState {
  hydrate: () => void;
  ensureCurrentPeriod: (walletBalance: number, savingsBalance: number) => void;
  confirmPlan: (plan: BudgetPlan) => boolean;
  updateSavingsPlan: (amount: number) => boolean;
  recordPurchase: (product: EconomyProductMeta, savingsContribution?: number) => boolean;
  recordSavingsDeposit: (amount: number) => boolean;
  markCashbackGranted: () => boolean;
  markDailyRewardGranted: () => boolean;
  markPeriodRewardGranted: () => boolean;
  recordPractice: () => boolean;
  completePeriod: () => boolean;
  advancePeriod: (walletBalance: number, savingsBalance: number) => void;
  repeatPeriodWithBonus: () => void;
  /** Только для дев-панели: принудительно переключить на период id, сохранив
   *  текущие балансы, но сбросив план/факт/флаги этого периода набело. */
  setPeriod: (id: PeriodId) => void;
  /** Только для дев-панели: подготавливает настоящий active-период к
   *  прохождению completePeriod() с предсказуемым успехом/неудачей. */
  debugPrepareCompletion: (id: PeriodId, outcome: 'success' | 'failure') => void;
}

function loadInitial(): PeriodState {
  const saved = storage.get<PeriodState>(STORAGE_KEY);
  return saved && isValidPeriod(saved) ? saved : createInitialPeriod();
}

export const usePeriodStore = create<PeriodStore>((set, get) => ({
  ...loadInitial(),

  hydrate: () => {
    const saved = storage.get<PeriodState>(STORAGE_KEY);
    if (saved && isValidPeriod(saved)) set(saved);
    else {
      const fresh = createInitialPeriod();
      persist(fresh);
      set(fresh);
    }
  },

  ensureCurrentPeriod: (walletBalance, savingsBalance) => {
    const state = get();
    if (state.status === 'completed') return;
    if (state.walletBalance === walletBalance && state.savingsBalance === savingsBalance && state.startingWalletBalance !== undefined) return;
    const next = {
      ...state,
      walletBalance,
      savingsBalance,
      startingWalletBalance: state.startingWalletBalance ?? walletBalance,
      startingSavingsBalance: state.startingSavingsBalance ?? savingsBalance,
    };
    persist(next);
    set(next);
  },

  confirmPlan: (plan) => {
    const state = get();
    if (state.status === 'completed' || state.rewardFlags.planConfirmed) return false;
    const budget = Math.max(0, state.walletBalance);
    if (!validateBudgetPlan(budget, plan).valid) return false;
    const next: PeriodState = {
      ...state,
      income: budget,
      plan,
      status: 'active',
      rewardFlags: { ...state.rewardFlags, planConfirmed: true },
    };
    persist(next);
    set(next);
    return true;
  },

  updateSavingsPlan: (amount) => {
    const state = get();
    if (state.status !== 'active' || !state.plan || state.actual.savings > 0) return false;
    if (!Number.isInteger(amount) || amount <= 0) return false;
    const nextPlan = { ...state.plan, savings: amount };
    if (!validateBudgetPlan(state.income, nextPlan).valid) return false;
    const next = { ...state, plan: nextPlan };
    persist(next);
    set(next);
    return true;
  },

  recordPurchase: (product, savingsContribution = 0) => {
    const state = get();
    if (state.status !== 'active' || !state.plan) return false;
    if (product.savingsOnly) return false;
    if (!Number.isInteger(savingsContribution) || savingsContribution < 0) return false;
    if (product.price <= 0 || state.walletBalance < product.price) return false;
    const categoryRemaining = product.expenseType === 'goal'
      ? 0
      : Math.max(0, state.plan[product.expenseType] - state.actual[product.expenseType]);
    // Обычная покупка не может забирать деньги, отложенные для другой
    // категории. Перерасход разрешён только на сумму, которую пользователь
    // явно согласился взять из копилки.
    if (categoryRemaining + savingsContribution < product.price) return false;
    const actual: PeriodActuals = {
      ...state.actual,
      mandatory: state.actual.mandatory + (product.expenseType === 'mandatory' ? product.price : 0),
      optional: state.actual.optional + (product.expenseType === 'optional' ? product.price : 0),
    };
    const next: PeriodState = {
      ...state,
      actual,
      walletBalance: state.walletBalance - product.price,
    };
    persist(next);
    set(next);
    return true;
  },

  recordSavingsDeposit: (amount) => {
    const state = get();
    // Пополнение копилки относится к подготовке бюджета и доступно уже на
    // этапе планирования. После завершения периода новые пополнения в его
    // фактические расходы не записываем.
    if (state.status === 'completed') return false;
    if (!Number.isInteger(amount) || amount <= 0 || state.walletBalance < amount) return false;
    const next: PeriodState = {
      ...state,
      actual: { ...state.actual, savings: state.actual.savings + amount },
      walletBalance: state.walletBalance - amount,
      savingsBalance: state.savingsBalance + amount,
      rewardFlags: {
        ...state.rewardFlags,
        savingsDepositGranted: amount >= ECONOMY_RULES.requiredSavingsDeposit,
      },
    };
    persist(next);
    set(next);
    return true;
  },

  markCashbackGranted: () => {
    const state = get();
    if (state.rewardFlags.cashbackGranted) return false;
    const next = { ...state, rewardFlags: { ...state.rewardFlags, cashbackGranted: true } };
    persist(next);
    set(next);
    return true;
  },

  markDailyRewardGranted: () => {
    const state = get();
    if (state.rewardFlags.dailyRewardGranted) return false;
    const next = { ...state, rewardFlags: { ...state.rewardFlags, dailyRewardGranted: true } };
    persist(next);
    set(next);
    return true;
  },

  markPeriodRewardGranted: () => {
    const state = get();
    if (state.rewardFlags.periodRewardGranted) return false;
    const next = { ...state, rewardFlags: { ...state.rewardFlags, periodRewardGranted: true } };
    persist(next);
    set(next);
    return true;
  },

  recordPractice: () => {
    const state = get();
    const count = state.practiceCount ?? 0;
    if (state.status === 'completed' || count >= ECONOMY_RULES.maxPracticeRewardXp / ECONOMY_RULES.practiceRewardXp) return false;
    const next = { ...state, practiceCount: count + 1 };
    persist(next);
    set(next);
    return true;
  },

  completePeriod: () => {
    const state = get();
    if (state.status !== 'active') return false;
    const lessons = useLessonProgressStore.getState();
    if (getPeriodLessonIds(state.id as PeriodId).some((lessonId) => !lessons.isCompleted(lessonId))) return false;
    const result = calculatePeriodResult(state);
    // Итог периода влияет на состояние питомца ровно один раз: повторный
    // запуск приложения уже видит status=completed и не применяет награду снова.
    usePetStore.getState().applyDelta({ health: result.satietyDelta, happiness: result.moodDelta });
    let completedState = state;
    const rewardCoins = PERIODS.find((period) => period.id === state.id)?.rewardCoins ?? 0;
    if (result.score >= 70 && rewardCoins > 0 && !state.rewardFlags.periodRewardGranted) {
      // Начисляем через общий economyStore, чтобы награда попала в баланс и
      // историю транзакций. После этого перечитываем период: applyCoinsDelta
      // синхронизирует его walletBalance через ensureCurrentPeriod.
      useEconomyStore.getState().applyCoinsDelta(rewardCoins, `Награда за завершение периода ${state.id}`, {
        periodId: state.id,
        category: 'reward',
      });
      completedState = get();
    }
    const next = {
      ...completedState,
      status: 'completed' as const,
      result,
      rewardFlags: {
        ...completedState.rewardFlags,
        periodRewardGranted: result.score >= 70
          ? true
          : completedState.rewardFlags.periodRewardGranted,
      },
    };
    persist(next);
    set(next);
    return true;
  },

  advancePeriod: (walletBalance, savingsBalance) => {
    const state = get();
    if (state.status !== 'completed' || state.id >= 5) return;
    const currentSavings = useEconomyStore.getState().savingsBalance ?? savingsBalance;
    const interest = Math.floor(currentSavings * 0.2);
    if (interest > 0) {
      useEconomyStore.getState().applySavingsInterest(interest, state.id);
    }
    const economy = useEconomyStore.getState();
    const next = {
      ...createInitialPeriod(economy.coins ?? walletBalance, economy.savingsBalance ?? savingsBalance),
      id: state.id + 1,
      history: [...(state.history ?? []), summarizePeriod(state)],
    };
    persist(next);
    set(next);
  },

  repeatPeriodWithBonus: () => {
    const state = get();
    if (state.status !== 'completed' || !state.result || state.result.score >= 70) return;
    const bonus = ECONOMY_RULES.repeatPeriodBonusCoins;
    // Бонус должен попасть в настоящий кошелёк, чтобы он был доступен
    // ребёнку во всех экранах, а не только в состоянии периода.
    useEconomyStore.getState().applyCoinsDelta(
      bonus,
      'Бонус за повтор периода',
      { periodId: state.id, category: 'reward' },
    );
    const walletBalance = useEconomyStore.getState().coins;
    const failedSummary = summarizePeriod(state);
    const next = {
      ...createInitialPeriod(walletBalance, state.savingsBalance),
      id: state.id,
      history: [...(state.history ?? []), failedSummary],
    };
    persist(next);
    set(next);
  },

  setPeriod: (id) => {
    const state = get();
    const next = {
      ...createInitialPeriod(state.walletBalance, state.savingsBalance),
      id,
      history: state.history ?? [],
    };
    persist(next);
    set(next);
  },

  debugPrepareCompletion: (id, outcome) => {
    const state = get();
    const wallet = Math.max(100, state.walletBalance);
    const savings = state.savingsBalance;
    const plan: BudgetPlan = { mandatory: 30, optional: 30, savings: 30 };
    const actual: PeriodActuals = outcome === 'success'
      ? { ...plan }
      : { mandatory: 0, optional: 0, savings: 0 };
    const next: PeriodState = {
      ...createInitialPeriod(wallet, savings),
      id,
      income: wallet,
      plan,
      actual,
      walletBalance: wallet,
      savingsBalance: savings,
      startingWalletBalance: wallet,
      startingSavingsBalance: savings,
      status: 'active',
      rewardFlags: { ...emptyFlags(), planConfirmed: true },
      history: state.history ?? [],
    };
    persist(next);
    set(next);
  },
}));
