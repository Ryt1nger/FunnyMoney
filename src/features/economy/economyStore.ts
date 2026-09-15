import { create } from 'zustand';
import type { EconomyState, Transaction } from '../../types';
import { storage } from '../../services/storage';

interface EconomyStore extends EconomyState {
  initIfEmpty: (startingCoins: number) => void;
  applyCoinsDelta: (amount: number, reason: string) => void;
  applyWealthDelta: (amount: number) => void;
}

const STORAGE_KEY = 'economy';

function persist(state: EconomyState) {
  storage.set(STORAGE_KEY, state);
}

const defaultState: EconomyState = {
  coins: 0,
  wealthScore: 0,
  totalEarned: 0,
  totalSpent: 0,
  totalSaved: 0,
  transactions: [],
};

export const useEconomyStore = create<EconomyStore>((set, get) => ({
  ...(storage.get<EconomyState>(STORAGE_KEY) ?? defaultState),

  initIfEmpty: (startingCoins) => {
    const existing = storage.get<EconomyState>(STORAGE_KEY);
    if (existing) return;
    const next: EconomyState = { ...defaultState, coins: startingCoins };
    persist(next);
    set(next);
  },

  applyCoinsDelta: (amount, reason) => {
    const state = get();
    const tx: Transaction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      amount,
      reason,
    };
    const next: EconomyState = {
      coins: state.coins + amount,
      wealthScore: state.wealthScore,
      totalEarned: state.totalEarned + (amount > 0 ? amount : 0),
      totalSpent: state.totalSpent + (amount < 0 ? -amount : 0),
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
}));
