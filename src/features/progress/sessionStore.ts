import { create } from 'zustand';
import { storage } from '../../services/storage';

/**
 * Реальное время, проведённое в приложении, и число открытий — считается
 * "тиками" heartbeat'а, пока экран действительно видим (см.
 * services/sessionTracking.ts), а не оценивается задним числом. По дням
 * храним последние MAX_DAYS ключей — этого достаточно для недели/месяца
 * в родительском кабинете и не даёт объекту расти бесконечно.
 */
export interface SessionState {
  totalPlayTimeMs: number;
  sessionsCount: number;
  /** ключ — дата YYYY-MM-DD, значение — мс активного времени в этот день */
  byDay: Record<string, number>;
}

interface SessionStore extends SessionState {
  addActiveTime: (ms: number) => void;
  registerSessionStart: () => void;
  /** Перечитывает состояние из storage — реальная проверка на межстраничном экране загрузки. */
  hydrate: () => void;
}

const STORAGE_KEY = 'session';
const MAX_DAYS = 60;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidSessionState(value: unknown): value is SessionState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.totalPlayTimeMs === 'number' &&
    typeof v.sessionsCount === 'number' &&
    !!v.byDay &&
    typeof v.byDay === 'object'
  );
}

function defaultState(): SessionState {
  return { totalPlayTimeMs: 0, sessionsCount: 0, byDay: {} };
}

function trimByDay(byDay: Record<string, number>): Record<string, number> {
  const keys = Object.keys(byDay).sort();
  if (keys.length <= MAX_DAYS) return byDay;
  const trimmed: Record<string, number> = {};
  for (const key of keys.slice(-MAX_DAYS)) trimmed[key] = byDay[key];
  return trimmed;
}

function persist(state: SessionState) {
  storage.set(STORAGE_KEY, state);
}

function loadInitial(): SessionState {
  const saved = storage.get<SessionState>(STORAGE_KEY);
  return saved && isValidSessionState(saved) ? saved : defaultState();
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...loadInitial(),

  addActiveTime: (ms) => {
    if (!Number.isFinite(ms) || ms <= 0) return;
    const state = get();
    const key = todayKey();
    const byDay = trimByDay({ ...state.byDay, [key]: (state.byDay[key] ?? 0) + ms });
    const next: SessionState = { ...state, totalPlayTimeMs: state.totalPlayTimeMs + ms, byDay };
    persist(next);
    set(next);
  },

  registerSessionStart: () => {
    const state = get();
    const next: SessionState = { ...state, sessionsCount: state.sessionsCount + 1 };
    persist(next);
    set(next);
  },

  hydrate: () => {
    const saved = storage.get<SessionState>(STORAGE_KEY);
    if (saved && isValidSessionState(saved)) {
      set(saved);
    } else if (saved) {
      const fresh = defaultState();
      persist(fresh);
      set(fresh);
    }
  },
}));
