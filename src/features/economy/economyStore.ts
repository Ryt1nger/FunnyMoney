import { create } from 'zustand';
import type { EconomyState, Transaction } from '../../types';
import { storage } from '../../services/storage';

interface EconomyStore extends EconomyState {
  initIfEmpty: (startingCoins: number) => void;
  applyCoinsDelta: (amount: number, reason: string) => void;
  applyWealthDelta: (amount: number) => void;
  /** Перечитывает состояние из storage — используется при реальной проверке
   * содержимого на межстраничном экране загрузки (App.tsx / bootstrap.ts). */
  hydrate: () => void;
}

const STORAGE_KEY = 'economy';

const defaultState: EconomyState = {
  coins: 0,
  wealthScore: 0,
  totalEarned: 0,
  totalSpent: 0,
  totalSaved: 0,
  transactions: [],
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

  applyCoinsDelta: (amount, reason) => {
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
    };
    const next: EconomyState = {
      coins: nextCoins,
      wealthScore: state.wealthScore,
      totalEarned: state.totalEarned + (appliedAmount > 0 ? appliedAmount : 0),
      totalSpent: state.totalSpent + (appliedAmount < 0 ? -appliedAmount : 0),
      totalSaved: state.totalSaved,
      transactions: [...state.transactions, tx],
    };
    persist(next);
    set(next);
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
}));
