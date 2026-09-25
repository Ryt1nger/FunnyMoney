import { create } from 'zustand';
import type { EconomyState, SavingsGoal, Transaction } from '../../types';
import { storage } from '../../services/storage';
import { usePeriodStore } from './periodStore';
import { ECONOMY_RULES } from '../../core/economy';
import { usePetStore } from '../pet/petStore';

interface EconomyStore extends EconomyState {
  initIfEmpty: (startingCoins: number) => void;
  applyCoinsDelta: (amount: number, reason: string, metadata?: Pick<Transaction, 'periodId' | 'category'>) => void;
  applyWealthDelta: (amount: number) => void;
  /** Перечитывает состояние из storage — используется при реальной проверке
   * содержимого на межстраничном экране загрузки (App.tsx / bootstrap.ts). */
  hydrate: () => void;
  setSavingsGoal: (goal: SavingsGoal) => void;
  depositToSavings: (amount: number) => boolean;
  withdrawFromSavings: (amount: number) => boolean;
}

const STORAGE_KEY = 'economy';

const defaultState: EconomyState = {
  coins: 0,
  wealthScore: 0,
  totalEarned: 0,
  totalSpent: 0,
  totalSaved: 0,
  savingsBalance: 0,
  transactions: [],
  savingsGoal: undefined,
};

export function isValidEconomyState(value: unknown): value is EconomyState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.coins === 'number' &&
    Number.isFinite(v.coins) &&
    typeof v.wealthScore === 'number' &&
    typeof v.totalEarned === 'number' &&
    typeof v.totalSpent === 'number' &&
    typeof v.totalSaved === 'number' &&
    Array.isArray(v.transactions)
  );
}

function loadInitial(): EconomyState {
  const saved = storage.get<EconomyState>(STORAGE_KEY);
  return saved && isValidEconomyState(saved) ? saved : defaultState;
}

function persist(state: EconomyState) {
  storage.set(STORAGE_KEY, state);
}

export const useEconomyStore = create<EconomyStore>((set, get) => ({
  ...loadInitial(),

  initIfEmpty: (startingCoins) => {
    const existing = storage.get<EconomyState>(STORAGE_KEY);
    if (existing && isValidEconomyState(existing)) return;
    const next: EconomyState = { ...defaultState, coins: startingCoins };
    persist(next);
    set(next);
  },

  applyCoinsDelta: (amount, reason, metadata) => {
    const state = get();
    // Реальный контроль баланса: списание никогда не уводит монеты в минус,
    // даже если вызывающий код случайно не проверил платёжеспособность заранее.
    const nextCoins = Math.max(0, state.coins + amount);
    const appliedAmount = nextCoins - state.coins;
    if (appliedAmount === 0) return;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      amount: appliedAmount,
      reason,
      ...metadata,
    };
    const next: EconomyState = {
      ...state,
      coins: nextCoins,
      totalEarned: state.totalEarned + (appliedAmount > 0 ? appliedAmount : 0),
      totalSpent: state.totalSpent + (appliedAmount < 0 ? -appliedAmount : 0),
      savingsBalance: state.savingsBalance ?? 0,
      transactions: [...state.transactions, tx],
    };
    persist(next);
    set(next);
    const period = usePeriodStore.getState();
    if (period.status !== 'completed') {
      period.ensureCurrentPeriod(nextCoins, next.savingsBalance ?? next.totalSaved);
    }
  },

  applyWealthDelta: (amount) => {
    const state = get();
    const next: EconomyState = {
      ...state,
      wealthScore: state.wealthScore + amount,
      totalSaved: state.totalSaved + (amount > 0 ? amount : 0),
    };
    persist(next);
    set(next);
  },

  hydrate: () => {
    const saved = storage.get<EconomyState>(STORAGE_KEY);
    if (saved && isValidEconomyState(saved)) {
      set(saved);
    } else if (saved) {
      // Повреждённые данные — не даём странице упасть, откатываемся на дефолт и пересохраняем.
      storage.set(STORAGE_KEY, defaultState);
      set(defaultState);
    }
  },

  setSavingsGoal: (savingsGoal) => {
    const next = { ...get(), savingsGoal };
    persist(next);
    set(next);
  },

  depositToSavings: (amount) => {
    const value = Math.floor(amount);
    const state = get();
    if (!Number.isFinite(value) || value <= 0 || state.coins < value) return false;
    const period = usePeriodStore.getState();
    if (period.status === 'active' && period.walletBalance !== state.coins) return false;
    const next: EconomyState = {
      ...state,
      coins: state.coins - value,
      savingsBalance: (state.savingsBalance ?? state.totalSaved) + value,
      totalSaved: state.totalSaved + value,
        transactions: [...state.transactions, { id: crypto.randomUUID(), timestamp: Date.now(), amount: value, reason: 'Пополнение копилки', periodId: period.status === 'completed' ? undefined : period.id, category: 'savings' as const }],
    };
    persist(next);
    set(next);
    const periodRewarded = usePeriodStore.getState().recordSavingsDeposit(value);
    if (periodRewarded) {
      usePetStore.getState().addXp(ECONOMY_RULES.savingsDepositXp);
      const period = usePeriodStore.getState();
      if (value >= ECONOMY_RULES.requiredSavingsDeposit && !period.rewardFlags.cashbackGranted) {
        useEconomyStore.getState().applyCoinsDelta(ECONOMY_RULES.cashbackCoins, 'Кэшбэк за накопление', { periodId: period.id, category: 'reward' });
        usePeriodStore.getState().markCashbackGranted();
      }
    }
    return true;
  },

  withdrawFromSavings: (amount) => {
    const value = Math.floor(amount);
    const state = get();
    const balance = state.savingsBalance ?? state.totalSaved;
    if (!Number.isFinite(value) || value <= 0 || balance < value) return false;
    const next: EconomyState = {
      ...state,
      coins: state.coins + value,
      savingsBalance: balance - value,
      transactions: [...state.transactions, { id: crypto.randomUUID(), timestamp: Date.now(), amount: -value, reason: 'Вывод из копилки', category: 'savings' as const }],
    };
    persist(next);
    set(next);
    // Кошелёк изменился через экран копилки — синхронизируем его с текущим
    // периодом, иначе следующая покупка будет ошибочно считаться рассинхроном.
    usePeriodStore.getState().ensureCurrentPeriod(next.coins, next.savingsBalance ?? next.totalSaved);
    return true;
  },

}));
