import { create } from 'zustand';
import { storage } from '../../services/storage';
import { tutorialTours, type TutorialTourId } from '../../data/tutorialSteps';
import { useInventoryStore } from '../inventory/inventoryStore';
import { useEconomyStore } from '../economy/economyStore';
import { ECONOMY_RULES } from '../../core/economy';

// Флаг "этот тур пройден или пропущен" — у КАЖДОГО тура свой, независимый от
// остальных. 'home' сохраняет старый ключ (совместимость со старыми
// сохранениями, где было только одно общее обучение) — остальные туры
// используют новые ключи per-раздел.
function doneKey(tourId: TutorialTourId): string {
  return tourId === 'home' ? 'tutorial_done' : `tutorial_${tourId}_done`;
}

const REWARD_KEY = 'tutorial_reward_granted';

// На шаге "покорми меня" (кухня) ребёнок должен суметь реально перетащить
// еду — если это первый запуск и еды ещё ни разу не покупали, показывать
// пустой поднос бессмысленно. Выдаём одну тестовую порцию, только если
// еды нет вообще ни одной (сумма по всем товарам = 0), чтобы это не было
// способом бесконечно получать бесплатную еду через "показать обучение
// снова" в настройках.
const STARTER_FOOD_ID = 'oatmeal';

function ensureStarterFoodForTutorial() {
  const foodQty = useInventoryStore.getState().foodQty;
  const totalFood = Object.values(foodQty).reduce((sum, qty) => sum + qty, 0);
  if (totalFood <= 0) {
    useInventoryStore.getState().addFoodQty(STARTER_FOOD_ID, 1);
  }
}

interface TutorialStore {
  active: boolean;
  /** Какой тур сейчас идёт (null, если обучение не активно). */
  tourId: TutorialTourId | null;
  stepIndex: number;
  /** Запускает тур раздела, если этот раздел ребёнок открывает первый раз —
   *  неважно, зашёл ли он сам или его привёл туда игровой ивент (оба пути
   *  вызывают это из одного и того же mount-эффекта экрана раздела). Если
   *  какой-то тур уже идёт — новый его не перебивает. */
  startTourIfNeeded: (tourId: TutorialTourId) => void;
  /** Запускает обучение заново (кнопка в настройках) — сбрасывает флаги
   *  ВСЕХ туров и начинает с главного экрана. */
  restart: () => void;
  next: () => void;
  /** Завершение ТЕКУЩЕГО тура — и кнопкой на последнем шаге, и "Пропустить". */
  finish: () => void;
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  active: false,
  tourId: null,
  stepIndex: 0,

  startTourIfNeeded: (tourId) => {
    if (get().active) return;
    if (storage.get<boolean>(doneKey(tourId))) return;
    if (tourId === 'kitchen') ensureStarterFoodForTutorial();
    set({ active: true, tourId, stepIndex: 0 });
  },

  restart: () => {
    (Object.keys(tutorialTours) as TutorialTourId[]).forEach((id) => {
      void storage.remove(doneKey(id));
    });
    ensureStarterFoodForTutorial();
    set({ active: true, tourId: 'home', stepIndex: 0 });
  },

  next: () => {
    const { tourId, stepIndex } = get();
    if (!tourId) return;
    const steps = tutorialTours[tourId];
    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) {
      get().finish();
      return;
    }
    set({ stepIndex: nextIndex });
  },

  finish: () => {
    const { tourId } = get();
    if (tourId) {
      // Награда за обучение выдаётся один раз за всё приложение и привязана
      // именно к завершению тура 'home' (первого, обязательного) — мини-туры
      // разделов её не выдают.
      if (tourId === 'home' && storage.get<boolean>(REWARD_KEY) !== true) {
        useEconomyStore.getState().applyCoinsDelta(ECONOMY_RULES.oneTimeTheoryCoins, 'Награда за обучение', { category: 'reward' });
        void storage.set(REWARD_KEY, true);
      }
      void storage.set(doneKey(tourId), true);
      if (tourId === 'home') void storage.set('tutorial_finished_at', Date.now());
    }
    set({ active: false, tourId: null, stepIndex: 0 });
  },
}));
