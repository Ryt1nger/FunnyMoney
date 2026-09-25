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
  recordPurchase: (product: EconomyProductMeta) => boolean;
  recordSavingsDeposit: (amount: number) => boolean;
  markCashbackGranted: () => boolean;
  markDailyRewardGranted: () => boolean;
  markPeriodRewardGranted: () => boolean;
  recordPractice: () => boolean;
  completePeriod: () => boolean;
  advancePeriod: (walletBalance: number, savingsBalance: number) => void;
  /** Только для дев-панели: принудительно переключить на период id, сохранив
   *  текущие балансы, но сбросив план/факт/флаги этого периода набело. */
  setPeriod: (id: 1 | 2 | 3) => void;
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

  recordPurchase: (product) => {
    const state = get();
    if (state.status !== 'active' || !state.plan) return false;
    if (product.savingsOnly) return false;
    if (product.price <= 0 || state.walletBalance < product.price) return false;
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
    // Для первого тестового периода обязательны две уже реализованные темы.
    // Второй и третий пока не блокируем несуществующим контентом уроков.
    if (state.id === 1) {
      const lessons = useLessonProgressStore.getState();
      if (!lessons.isCompleted('what-is-money') || !lessons.isCompleted('needs-vs-wants')) return false;
    }
    const result = calculatePeriodResult(state);
    const next = { ...state, status: 'completed' as const, result };
    persist(next);
    set(next);
    return true;
  },

  advancePeriod: (walletBalance, savingsBalance) => {
    const state = get();
    if (state.status !== 'completed' || state.id >= 3) return;
    const next = {
      ...createInitialPeriod(walletBalance, savingsBalance),
      id: state.id + 1,
      history: [...(state.history ?? []), summarizePeriod(state)],
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
}));
