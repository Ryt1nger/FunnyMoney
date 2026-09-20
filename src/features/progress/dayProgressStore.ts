import { create } from 'zustand';
import { storage } from '../../services/storage';

export interface DayProgressState {
  /** дата в формате YYYY-MM-DD — прогресс за день (список заданий) сбрасывается при смене даты */
  date: string;
  completedTaskIds: string[];
  /** Задания, где ребёнок уже сделал само действие (ушёл кормить/играть/укладывать
   *  питомца), но ещё не забрал награду — кнопка на экране "День" в этот момент
   *  зелёная ("Получить"). Сбрасывается вместе с completedTaskIds при смене дня. */
  startedTaskIds: string[];
  /** серия дней подряд, когда было выполнено хотя бы одно задание — переживает смену даты,
   *  сбрасывается только если пропущен целый день */
  streak: number;
  /** дата (YYYY-MM-DD), за которую серия последний раз засчитана — null, если ещё ни разу */
  lastActiveDate: string | null;
  /** значения серии (кратные STREAK_MILESTONE_STEP), за которые бонус уже получен —
   *  не сбрасывается сменой дня, только реальным обнулением серии (см. normalizeStreak) */
  claimedStreakMilestones: number[];
}

interface DayProgressStore extends DayProgressState {
  isCompleted: (taskId: string) => boolean;
  /** Действие по заданию уже сделано, но награда ещё не забрана. */
  isStarted: (taskId: string) => boolean;
  /** Отметить, что ребёнок ушёл выполнять действие задания (например, кормить питомца) —
   *  до реального получения награды, см. startedTaskIds. */
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  /** Забрать бонус за веху серии (каждые STREAK_MILESTONE_STEP дней) — не даёт забрать дважды. */
  claimStreakMilestone: (streak: number) => void;
  /** Перечитывает состояние из storage — реальная проверка на межстраничном экране загрузки. */
  hydrate: () => void;
}

// Раз в сколько дней серии предлагается разовый бонус (см. запрос: "окошко
// появляется только при сериях кратных 5").
export const STREAK_MILESTONE_STEP = 5;

const STORAGE_KEY = 'dayProgress';

function todayKey(): string {
  // Локальная дата устройства — этого достаточно для ежедневного сброса заданий.
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function isValidDayProgressState(value: unknown): value is DayProgressState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.date === 'string' && Array.isArray(v.completedTaskIds);
}

function freshState(): DayProgressState {
  return {
    date: todayKey(),
    completedTaskIds: [],
    startedTaskIds: [],
    streak: 0,
    lastActiveDate: null,
    claimedStreakMilestones: [],
  };
}

// Старые сохранения (до появления серии/startedTaskIds) не содержат новые поля —
// подставляем безопасные значения по умолчанию, чтобы не терять уже выполненные сегодня задания.
function withStreakDefaults(v: Record<string, unknown>): DayProgressState {
  return {
    date: v.date as string,
    completedTaskIds: v.completedTaskIds as string[],
    startedTaskIds: Array.isArray(v.startedTaskIds) ? (v.startedTaskIds as string[]) : [],
    streak: typeof v.streak === 'number' ? v.streak : 0,
    lastActiveDate: typeof v.lastActiveDate === 'string' ? v.lastActiveDate : null,
    claimedStreakMilestones: Array.isArray(v.claimedStreakMilestones) ? (v.claimedStreakMilestones as number[]) : [],
  };
}

// Серия засчитывается, только если последняя отметка — сегодня или вчера; пропущенный
// день (или больше) — серия обнуляется (и вместе с ней — список забранных вех, чтобы
// новая серия могла заново дойти до тех же кратных 5 и снова предложить бонус).
// Вызывается при каждой загрузке/гидратации, чтобы "зависшее" значение серии не
// показывалось бесконечно после перерыва.
function normalizeStreak(state: DayProgressState): DayProgressState {
  if (state.streak === 0 || !state.lastActiveDate) return state;
  const today = todayKey();
  const yesterday = yesterdayKey();
  if (state.lastActiveDate === today || state.lastActiveDate === yesterday) return state;
  return { ...state, streak: 0, claimedStreakMilestones: [] };
}

function persist(state: DayProgressState) {
  storage.set(STORAGE_KEY, state);
}

function loadInitial(): DayProgressState {
  const saved = storage.get<Record<string, unknown>>(STORAGE_KEY);
  if (saved && isValidDayProgressState(saved)) {
    const normalized = normalizeStreak(withStreakDefaults(saved));
    // Новый день — список заданий (и незабранных "начатых") обнуляем, серию
    // (уже нормализованную выше) не трогаем.
    if (normalized.date !== todayKey()) {
      return { ...normalized, date: todayKey(), completedTaskIds: [], startedTaskIds: [] };
    }
    return normalized;
  }
  return freshState(); // повреждённые данные — начинаем заново
}

export const useDayProgressStore = create<DayProgressStore>((set, get) => ({
  ...loadInitial(),

  isCompleted: (taskId) => get().completedTaskIds.includes(taskId),

  isStarted: (taskId) => get().startedTaskIds.includes(taskId),

  startTask: (taskId) => {
    const state = get();
    let base: DayProgressState =
      state.date === todayKey() ? state : { ...state, date: todayKey(), completedTaskIds: [], startedTaskIds: [] };
    base = normalizeStreak(base);
    if (base.startedTaskIds.includes(taskId) || base.completedTaskIds.includes(taskId)) {
      if (base !== state) {
        persist(base);
        set(base);
      }
      return;
    }
    const next: DayProgressState = { ...base, startedTaskIds: [...base.startedTaskIds, taskId] };
    persist(next);
    set(next);
  },

  completeTask: (taskId) => {
    const state = get();
    // Если наступил новый день (в т.ч. пока приложение было открыто) — сначала сбрасываем
    // список заданий (серию — только если реально пропущен день, см. normalizeStreak).
    let base: DayProgressState =
      state.date === todayKey() ? state : { ...state, date: todayKey(), completedTaskIds: [], startedTaskIds: [] };
    base = normalizeStreak(base);
    if (base.completedTaskIds.includes(taskId)) {
      if (base !== state) {
        persist(base);
        set(base);
      }
      return;
    }

    // Первое выполненное задание за сегодня продлевает (или начинает) серию.
    const wasFirstToday = base.completedTaskIds.length === 0 && base.lastActiveDate !== todayKey();
    let streak = base.streak;
    let lastActiveDate = base.lastActiveDate;
    if (wasFirstToday) {
      streak = base.lastActiveDate === yesterdayKey() ? base.streak + 1 : 1;
      lastActiveDate = todayKey();
    }

    const next: DayProgressState = {
      ...base,
      completedTaskIds: [...base.completedTaskIds, taskId],
      // Награда забрана — задание больше не "ждёт получения".
      startedTaskIds: base.startedTaskIds.filter((id) => id !== taskId),
      streak,
      lastActiveDate,
    };
    persist(next);
    set(next);
  },

  claimStreakMilestone: (streak) => {
    const state = get();
    if (state.claimedStreakMilestones.includes(streak)) return; // уже забрано — не даём повторно
    const next: DayProgressState = {
      ...state,
      claimedStreakMilestones: [...state.claimedStreakMilestones, streak],
    };
    persist(next);
    set(next);
  },

  hydrate: () => {
    const saved = storage.get<Record<string, unknown>>(STORAGE_KEY);
    if (saved && isValidDayProgressState(saved)) {
      const normalized = normalizeStreak(withStreakDefaults(saved));
      const next =
        normalized.date !== todayKey()
          ? { ...normalized, date: todayKey(), completedTaskIds: [], startedTaskIds: [] }
          : normalized;
      persist(next);
      set(next);
    } else {
      // Повреждённые данные — безопасный сброс без падения экрана.
      const fresh = freshState();
      persist(fresh);
      set(fresh);
    }
  },
}));
