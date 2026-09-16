import { create } from 'zustand';
import { storage } from '../../services/storage';

export interface DayProgressState {
  /** дата в формате YYYY-MM-DD — прогресс за день сбрасывается при смене даты */
  date: string;
  completedTaskIds: string[];
}

interface DayProgressStore extends DayProgressState {
  isCompleted: (taskId: string) => boolean;
  completeTask: (taskId: string) => void;
  /** Перечитывает состояние из storage — реальная проверка на межстраничном экране загрузки. */
  hydrate: () => void;
}

const STORAGE_KEY = 'dayProgress';

function todayKey(): string {
  // Локальная дата устройства — этого достаточно для ежедневного сброса заданий.
  return new Date().toISOString().slice(0, 10);
}

export function isValidDayProgressState(value: unknown): value is DayProgressState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.date === 'string' && Array.isArray(v.completedTaskIds);
}

function freshState(): DayProgressState {
  return { date: todayKey(), completedTaskIds: [] };
}

function persist(state: DayProgressState) {
  storage.set(STORAGE_KEY, state);
}

function loadInitial(): DayProgressState {
  const saved = storage.get<DayProgressState>(STORAGE_KEY);
  if (saved && isValidDayProgressState(saved) && saved.date === todayKey()) return saved;
  return freshState(); // новый день или повреждённые данные — начинаем список заданий заново
}

export const useDayProgressStore = create<DayProgressStore>((set, get) => ({
  ...loadInitial(),

  isCompleted: (taskId) => get().completedTaskIds.includes(taskId),

  completeTask: (taskId) => {
    const state = get();
    // Если наступил новый день (в т.ч. пока приложение было открыто) — сначала сбрасываем.
    const base = state.date === todayKey() ? state : freshState();
    if (base.completedTaskIds.includes(taskId)) {
      if (base !== state) {
        persist(base);
        set(base);
      }
      return;
    }
    const next: DayProgressState = { ...base, completedTaskIds: [...base.completedTaskIds, taskId] };
    persist(next);
    set(next);
  },

  hydrate: () => {
    const saved = storage.get<DayProgressState>(STORAGE_KEY);
    if (saved && isValidDayProgressState(saved) && saved.date === todayKey()) {
      set(saved);
    } else {
      // Повреждённые данные или наступил новый день — безопасный сброс без падения экрана.
      const fresh = freshState();
      persist(fresh);
      set(fresh);
    }
  },
}));
