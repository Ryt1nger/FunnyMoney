import { create } from 'zustand';
import {
  ECONOMY_RULES,
  type BudgetPlan,
  type EconomyProductMeta,
  type PeriodActuals,
  type PeriodRewardFlags,
  type PeriodState,
  validateBudgetPlan,
} from '../../core/economy';
import { storage } from '../../services/storage';

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
  };
}

export function createInitialPeriod(walletBalance: number = ECONOMY_RULES.periodIncome, savingsBalance: number = 0): PeriodState {
  return {
    id: 1,
    income: ECONOMY_RULES.periodIncome,
    plan: null,
    actual: emptyActuals(),
    walletBalance,
    savingsBalance,
    rewardFlags: emptyFlags(),
    status: 'planning',
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

function persist(period: PeriodState): void {
  void storage.set(STORAGE_KEY, period);
}

interface PeriodStore extends PeriodState {
  hydrate: () => void;
  ensureCurrentPeriod: (walletBalance: number, savingsBalance: number) => void;
  confirmPlan: (plan: BudgetPlan) => boolean;
  recordPurchase: (product: EconomyProductMeta) => boolean;
  recordSavingsDeposit: (amount: number) => boolean;
  markDailyRewardGranted: () => boolean;
  completePeriod: () => void;
  advancePeriod: (walletBalance: number, savingsBalance: number) => void;
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
    if (state.walletBalance === walletBalance && state.savingsBalance === savingsBalance) return;
    const next = { ...state, walletBalance, savingsBalance };
    persist(next);
    set(next);
  },

  confirmPlan: (plan) => {
    const state = get();
    if (state.status === 'completed' || state.rewardFlags.planConfirmed) return false;
    if (!validateBudgetPlan(state.income, plan).valid) return false;
    const next: PeriodState = {
      ...state,
      plan,
      status: 'active',
      rewardFlags: { ...state.rewardFlags, planConfirmed: true },
    };
    persist(next);
    set(next);
    return true;
  },

  recordPurchase: (product) => {
    const state = get();
    if (state.status !== 'active' || !state.plan) return false;
    if (product.savingsOnly || product.expenseType === 'goal') return false;
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
    if (state.status !== 'active' || state.rewardFlags.savingsDepositGranted) return false;
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

  markDailyRewardGranted: () => {
    const state = get();
    if (state.rewardFlags.dailyRewardGranted) return false;
    const next = { ...state, rewardFlags: { ...state.rewardFlags, dailyRewardGranted: true } };
    persist(next);
    set(next);
    return true;
  },

  completePeriod: () => {
    const state = get();
    if (state.status !== 'active') return;
    const next = { ...state, status: 'completed' as const };
    persist(next);
    set(next);
  },

  advancePeriod: (walletBalance, savingsBalance) => {
    const state = get();
    const next = {
      ...createInitialPeriod(walletBalance, savingsBalance),
      id: state.id + 1,
    };
    persist(next);
    set(next);
  },
}));
