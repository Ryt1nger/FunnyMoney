import { create } from 'zustand';
import { storage } from '../../services/storage';

const STORAGE_KEY = 'lessonProgress';

export interface LessonProgressState {
  completedLessonIds: string[];
}

interface LessonProgressStore extends LessonProgressState {
  hydrate: () => void;
  isCompleted: (lessonId: string) => boolean;
  completeLesson: (lessonId: string) => boolean;
}

function isValid(value: unknown): value is LessonProgressState {
  return !!value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).completedLessonIds);
}

function loadInitial(): LessonProgressState {
  const saved = storage.get<LessonProgressState>(STORAGE_KEY);
  return saved && isValid(saved) ? saved : { completedLessonIds: [] };
}

function persist(state: LessonProgressState) {
  storage.set(STORAGE_KEY, state);
}

export const useLessonProgressStore = create<LessonProgressStore>((set, get) => ({
  ...loadInitial(),

  hydrate: () => {
    const saved = storage.get<LessonProgressState>(STORAGE_KEY);
    const next = saved && isValid(saved) ? saved : { completedLessonIds: [] };
    persist(next);
    set(next);
  },

  isCompleted: (lessonId) => get().completedLessonIds.includes(lessonId),

  completeLesson: (lessonId) => {
    const state = get();
    if (state.completedLessonIds.includes(lessonId)) return false;
    const next = { completedLessonIds: [...state.completedLessonIds, lessonId] };
    persist(next);
    set(next);
    return true;
  },
}));

