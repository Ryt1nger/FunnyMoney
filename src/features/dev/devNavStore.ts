import { create } from 'zustand';

/**
 * Мост между дев-панелью в App.tsx (снаружи "телефона") и внутренним состоянием
 * Home.tsx (какой bottom sheet открыт). У Home нет пропсов извне — весь роутинг
 * между разделами живёт внутри неё как useState — поэтому дев-панели нужен
 * отдельный канал, чтобы попросить "открой раздел Периоды", а не только
 * переключить сам период в periodStore. Строго для отладки, в релизе не используется.
 */

export type DevNavRequest = 'period' | null;

interface DevNavStore {
  request: DevNavRequest;
  requestScreen: (screen: NonNullable<DevNavRequest>) => void;
  clearRequest: () => void;
}

export const useDevNavStore = create<DevNavStore>((set) => ({
  request: null,
  requestScreen: (screen) => set({ request: screen }),
  clearRequest: () => set({ request: null }),
}));
