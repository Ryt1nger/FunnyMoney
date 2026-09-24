import { create } from 'zustand';
import { storage } from '../../services/storage';
import type { RoomSection } from '../../data/shopData';

export interface InventoryState {
  /** купленные фоны комнат (id из data/shopData.ts rooms), стартовая всегда владеется */
  ownedRoomIds: string[];
  /** какая комната сейчас установлена у питомца (главный экран, раздел «Игровая») */
  activeRoomId: string;
  /** какая кухня сейчас установлена (экран «Кухня», раздел «Кухня») — отдельно от
   *  главного экрана: интерьер кухни никогда не показывается на Home. */
  activeKitchenRoomId: string;
  /** купленные товары магазина (id из data/shopData.ts shopProducts) — можно купить один раз */
  ownedProductIds: string[];
  /** запас еды по товару — еда покупается многократно и тратится при кормлении
   *  на экране «Кухня» (в отличие от игрушек/одежды/интерьера, купленных один раз). */
  foodQty: Record<string, number>;
  /** выбранные предметы гардероба, сохраняются отдельно от каталога */
  outfitIds: string[];
}

interface InventoryStore extends InventoryState {
  setActiveRoom: (roomId: string) => void;
  setActiveKitchenRoom: (roomId: string) => void;
  addOwnedRoom: (roomId: string, section: RoomSection) => void;
  addOwnedProduct: (productId: string) => void;
  isProductOwned: (productId: string) => boolean;
  addFoodQty: (productId: string, amount: number) => void;
  /** Тратит одну единицу еды при кормлении. Возвращает false, если её уже не осталось. */
  consumeFood: (productId: string) => boolean;
  setOutfit: (outfitIds: string[]) => void;
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
  activeKitchenRoomId: '',
  ownedProductIds: [],
  foodQty: {},
  outfitIds: [],
};

function persist(state: InventoryState) {
  storage.set(STORAGE_KEY, state);
}

function loadInitial(): InventoryState {
  const saved = storage.get<InventoryState>(STORAGE_KEY);
  if (!saved) return defaultState;
  // На случай старых сохранений без новых полей — подстраховка формы данных.
  return {
    ownedRoomIds: saved.ownedRoomIds?.length ? saved.ownedRoomIds : [DEFAULT_ROOM_ID],
    activeRoomId: saved.activeRoomId ?? DEFAULT_ROOM_ID,
    activeKitchenRoomId: saved.activeKitchenRoomId ?? '',
    ownedProductIds: saved.ownedProductIds ?? [],
    foodQty: saved.foodQty ?? {},
    outfitIds: saved.outfitIds ?? [],
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

  setActiveKitchenRoom: (roomId) => {
    const state = get();
    if (!state.ownedRoomIds.includes(roomId)) return;
    const next: InventoryState = { ...state, activeKitchenRoomId: roomId };
    persist(next);
    set(next);
  },

  addOwnedRoom: (roomId, section) => {
    const state = get();
    if (state.ownedRoomIds.includes(roomId)) return;
    const next: InventoryState = {
      ...state,
      ownedRoomIds: [...state.ownedRoomIds, roomId],
      // Кухня и игровая — разные, независимые «активные фоны»: покупка кухни
      // не должна переключать фон главного экрана, и наоборот.
      ...(section === 'kitchen' ? { activeKitchenRoomId: roomId } : { activeRoomId: roomId }),
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

  addFoodQty: (productId, amount) => {
    const state = get();
    const next: InventoryState = {
      ...state,
      foodQty: { ...state.foodQty, [productId]: (state.foodQty[productId] ?? 0) + amount },
    };
    persist(next);
    set(next);
  },

  consumeFood: (productId) => {
    const state = get();
    const qty = state.foodQty[productId] ?? 0;
    if (qty <= 0) return false;
    const nextQty = { ...state.foodQty, [productId]: qty - 1 };
    const next: InventoryState = { ...state, foodQty: nextQty };
    persist(next);
    set(next);
    return true;
  },

  setOutfit: (outfitIds) => {
    const state = get();
    const next: InventoryState = { ...state, outfitIds };
    persist(next);
    set(next);
  },

  hydrate: () => {
    const saved = storage.get<InventoryState>(STORAGE_KEY);
    if (saved && isValidInventoryState(saved)) {
      set({ ...defaultState, ...saved });
    } else if (saved) {
      storage.set(STORAGE_KEY, defaultState);
      set(defaultState);
    }
  },
}));
