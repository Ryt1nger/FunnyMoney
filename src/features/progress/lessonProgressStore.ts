import { create } from 'zustand';
import { storage } from '../../services/storage';

const STORAGE_KEY = 'lessonProgress';

export interface LessonProgressState {
  completedLessonIds: string[];
  /** сколько наград за практику уже выдано по каждому уроку (лимит — на урок) */
  practiceRewards?: Record<string, number>;
}

interface LessonProgressStore extends LessonProgressState {
  hydrate: () => void;
  isCompleted: (lessonId: string) => boolean;
  completeLesson: (lessonId: string) => boolean;
  /** Забронировать награду за верный ответ в практике урока: true — награду нужно выдать,
   *  false — лимит награды за этот урок уже исчерпан. */
  claimPracticeReward: (lessonId: string, max: number) => boolean;
}

function isValid(value: unknown): value is LessonProgressState {
  return !!value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).completedLessonIds);
}

function loadInitial(): LessonProgressState {
  const saved = storage.get<LessonProgressState>(STORAGE_KEY);
  return saved && isValid(saved) ? { ...saved, practiceRewards: saved.practiceRewards ?? {} } : { completedLessonIds: [], practiceRewards: {} };
}

function persist(state: LessonProgressState) {
  storage.set(STORAGE_KEY, state);
}

export const useLessonProgressStore = create<LessonProgressStore>((set, get) => ({
  ...loadInitial(),

  hydrate: () => {
    const saved = storage.get<LessonProgressState>(STORAGE_KEY);
    const next = saved && isValid(saved) ? { ...saved, practiceRewards: saved.practiceRewards ?? {} } : { completedLessonIds: [], practiceRewards: {} };
    persist(next);
    set(next);
  },

  isCompleted: (lessonId) => get().completedLessonIds.includes(lessonId),

  completeLesson: (lessonId) => {
    const state = get();
    if (state.completedLessonIds.includes(lessonId)) return false;
    const next = { completedLessonIds: [...state.completedLessonIds, lessonId], practiceRewards: state.practiceRewards ?? {} };
    persist(next);
    set(next);
    return true;
  },

  claimPracticeReward: (lessonId, max) => {
    const state = get();
    const rewards = state.practiceRewards ?? {};
    const given = rewards[lessonId] ?? 0;
    if (given >= max) return false;
    const next = { completedLessonIds: state.completedLessonIds, practiceRewards: { ...rewards, [lessonId]: given + 1 } };
    persist(next);
    set(next);
    return true;
  },
}));

