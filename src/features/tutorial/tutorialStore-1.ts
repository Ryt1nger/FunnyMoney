import { create } from 'zustand';
import { storage } from '../../services/storage';
import { tutorialTours, type TutorialTourId } from '../../data/tutorialSteps';
import { useInventoryStore } from '../inventory/inventoryStore';

// Обучение разбито на отдельные туры (см. tutorialSteps.ts): "home" — общий
// обзор главного экрана, запускается один раз сам при первом входе; у
// каждого раздела (уроки/периоды/магазин/рейтинг/кухня/копилка) — свой
// короткий тур, который включается сам при первом заходе в этот раздел
// (см. startTourIfNeeded, вызывается из самих экранов разделов). У каждого
// тура — свой флаг "пройден или пропущен" в хранилище, чтобы повторный
// заход в уже объяснённый раздел не показывал подсказку снова.
function doneKey(tourId: TutorialTourId): string {
  // "home" хранится под старым ключом ради обратной совместимости с уже
  // установленными версиями приложения (флаг существовал до разбивки тура
  // на несколько частей).
  return tourId === 'home' ? 'tutorial_done' : `tutorial_${tourId}_done`;
}

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
  /** Какой тур сейчас показан — null, пока ни один не активен. */
  tourId: TutorialTourId | null;
  stepIndex: number;
  /** Запускает общий тур по главному экрану, если ребёнок его ещё не проходил. */
  startIfNeeded: () => void;
  /** Запускает тур конкретного раздела, если он ещё не пройден и сейчас не
   *  идёт какой-то другой тур. Вызывается самими экранами разделов при
   *  открытии — неважно, зашёл ли ребёнок туда сам или его привело игровое
   *  событие (например, кухня после "покорми питомца"). */
  startTourIfNeeded: (tourId: TutorialTourId) => void;
  /** Полный перезапуск (кнопка в настройках) — сбрасывает "пройден" у ВСЕХ
   *  туров и сразу открывает тур по главному экрану; остальные разделы
   *  снова покажут свою подсказку при следующем заходе в них. */
  restart: () => void;
  next: () => void;
  /** Завершение текущего тура — и кнопкой на последнем шаге, и "Пропустить". */
  finish: () => void;
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  active: false,
  tourId: null,
  stepIndex: 0,

  startIfNeeded: () => {
    if (get().active) return;
    if (storage.get<boolean>(doneKey('home'))) return;
    set({ active: true, tourId: 'home', stepIndex: 0 });
  },

  startTourIfNeeded: (tourId) => {
    if (get().active) return;
    if (storage.get<boolean>(doneKey(tourId))) return;
    if (tourId === 'kitchen') ensureStarterFoodForTutorial();
    set({ active: true, tourId, stepIndex: 0 });
  },

  restart: () => {
    (Object.keys(tutorialTours) as TutorialTourId[]).forEach((id) => {
      void storage.set(doneKey(id), false);
    });
    ensureStarterFoodForTutorial();
    set({ active: true, tourId: 'home', stepIndex: 0 });
  },

  next: () => {
    const { tourId, stepIndex } = get();
    if (!tourId) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex >= tutorialTours[tourId].length) {
      get().finish();
      return;
    }
    set({ stepIndex: nextIndex });
  },

  finish: () => {
    const { tourId } = get();
    if (tourId) {
      void storage.set(doneKey(tourId), true);
      if (tourId === 'home') void storage.set('tutorial_finished_at', Date.now());
    }
    set({ active: false, tourId: null, stepIndex: 0 });
  },
}));
