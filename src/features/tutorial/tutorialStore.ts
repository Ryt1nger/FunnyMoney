import { create } from 'zustand';
import { storage } from '../../services/storage';
import { tutorialSteps } from '../../data/tutorialSteps';

// Флаг "обучение пройдено или пропущено" — после него тур больше не
// запускается сам. Повторно открыть его можно из настроек (restart).
const DONE_KEY = 'tutorial_done';

interface TutorialStore {
  active: boolean;
  stepIndex: number;
  /** Запускает тур, если ребёнок его ещё не проходил. */
  startIfNeeded: () => void;
  /** Запускает тур заново (кнопка в настройках). */
  restart: () => void;
  next: () => void;
  /** Завершение — и кнопкой на последнем шаге, и "Пропустить". */
  finish: () => void;
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  active: false,
  stepIndex: 0,

  startIfNeeded: () => {
    if (get().active) return;
    if (storage.get<boolean>(DONE_KEY)) return;
    set({ active: true, stepIndex: 0 });
  },

  restart: () => set({ active: true, stepIndex: 0 }),

  next: () => {
    const nextIndex = get().stepIndex + 1;
    if (nextIndex >= tutorialSteps.length) {
      get().finish();
      return;
    }
    set({ stepIndex: nextIndex });
  },

  finish: () => {
    void storage.set(DONE_KEY, true);
    set({ active: false, stepIndex: 0 });
  },
}));
