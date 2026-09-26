import { create } from 'zustand';
import { storage } from '../../services/storage';
import { tutorialSteps } from '../../data/tutorialSteps';
import { useInventoryStore } from '../inventory/inventoryStore';

// Флаг "обучение пройдено или пропущено" — после него тур больше не
// запускается сам. Повторно открыть его можно из настроек (restart).
const DONE_KEY = 'tutorial_done';

// На шаге "покорми меня" (кухня) ребёнок должен суметь реально перетащить
// еду — если это первый запуск и еды ещё ни разу не покупали, показывать
// пустой поднос бессмысленно. Выдаём одну тестовую порцию, только если
// еды нет вообще ни одной (сумма по всем товарам = 0), чтобы это не было
// способом бесконечно получать бесплатную еду через "показать обучение
// снова" в настройках.
const STARTER_FOOD_ID = 'bowl-blue-kibble';

function ensureStarterFoodForTutorial() {
  const foodQty = useInventoryStore.getState().foodQty;
  const totalFood = Object.values(foodQty).reduce((sum, qty) => sum + qty, 0);
  if (totalFood <= 0) {
    useInventoryStore.getState().addFoodQty(STARTER_FOOD_ID, 1);
  }
}

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
    ensureStarterFoodForTutorial();
    set({ active: true, stepIndex: 0 });
  },

  restart: () => {
    ensureStarterFoodForTutorial();
    set({ active: true, stepIndex: 0 });
  },

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
    void storage.set('tutorial_finished_at', Date.now());
    set({ active: false, stepIndex: 0 });
  },
}));
