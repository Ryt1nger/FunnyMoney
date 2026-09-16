import { create } from 'zustand';
import { storage } from '../../services/storage';

export interface InventoryState {
  /** купленные фоны комнат (id из data/shopData.ts rooms), стартовая всегда владеется */
  ownedRoomIds: string[];
  /** какая комната сейчас установлена у питомца */
  activeRoomId: string;
  /** купленные товары магазина (id из data/shopData.ts shopProducts) — можно купить один раз */
  ownedProductIds: string[];
}

interface InventoryStore extends InventoryState {
  setActiveRoom: (roomId: string) => void;
  addOwnedRoom: (roomId: string) => void;
  addOwnedProduct: (productId: string) => void;
  isProductOwned: (productId: string) => boolean;
  /** Перечитывает состояние из storage — реальная проверка на межстраничном экране загрузки. */
  hydrate: () => void;
}

export function isValidInventoryState(value: unknown): value is InventoryState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.ownedRoomIds) &&
    typeof v.activeRoomId === 'string' &&
    Array.isArray(v.ownedProductIds)
  );
}

const STORAGE_KEY = 'inventory';

const DEFAULT_ROOM_ID = 'room-day';

const defaultState: InventoryState = {
  ownedRoomIds: [DEFAULT_ROOM_ID],
  activeRoomId: DEFAULT_ROOM_ID,
  ownedProductIds: [],
};

function persist(state: InventoryState) {
  storage.set(STORAGE_KEY, state);
}

function loadInitial(): InventoryState {
  const saved = storage.get<InventoryState>(STORAGE_KEY);
  if (!saved) return defaultState;
  // На случай старых сохранений без нового поля — подстраховка формы данных.
  return {
    ownedRoomIds: saved.ownedRoomIds?.length ? saved.ownedRoomIds : [DEFAULT_ROOM_ID],
    activeRoomId: saved.activeRoomId ?? DEFAULT_ROOM_ID,
    ownedProductIds: saved.ownedProductIds ?? [],
  };
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  ...loadInitial(),

  setActiveRoom: (roomId) => {
    const state = get();
    if (!state.ownedRoomIds.includes(roomId)) return; // нельзя поставить некупленную комнату
    const next: InventoryState = { ...state, activeRoomId: roomId };
    persist(next);
    set(next);
  },

  addOwnedRoom: (roomId) => {
    const state = get();
    if (state.ownedRoomIds.includes(roomId)) return;
    const next: InventoryState = {
      ...state,
      ownedRoomIds: [...state.ownedRoomIds, roomId],
      activeRoomId: roomId,
    };
    persist(next);
    set(next);
  },

  addOwnedProduct: (productId) => {
    const state = get();
    if (state.ownedProductIds.includes(productId)) return;
    const next: InventoryState = { ...state, ownedProductIds: [...state.ownedProductIds, productId] };
    persist(next);
    set(next);
  },

  isProductOwned: (productId) => get().ownedProductIds.includes(productId),

  hydrate: () => {
    const saved = storage.get<InventoryState>(STORAGE_KEY);
    if (saved && isValidInventoryState(saved)) {
      set(saved);
    } else if (saved) {
      storage.set(STORAGE_KEY, defaultState);
      set(defaultState);
    }
  },
}));
