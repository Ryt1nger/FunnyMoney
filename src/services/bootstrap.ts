import { useEconomyStore } from '../features/economy/economyStore';
import { usePetStore } from '../features/pet/petStore';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { useDayProgressStore } from '../features/progress/dayProgressStore';
import { usePeriodStore } from '../features/economy/periodStore';
import { useLessonProgressStore } from '../features/progress/lessonProgressStore';
import { usePeriodEventStore } from '../features/periodEvents/eventStore';
import { useSessionStore } from '../features/progress/sessionStore';
import { storage } from './storage';
import { ECONOMY_RULES } from '../core/economy';

const RECOVERY_FLAG_KEY = 'debug_recovery_2026_09_20';
/**
 * Разовое восстановление после замеченного сбоя: у уже игравшего питомца
 * (есть накопленный опыт) обнулились здоровье/счастье и баланс/богатство —
 * похоже на повреждение сохранения. Проверяем очень узкую и маловероятную
 * для обычной игры комбинацию признаков, чтобы не задеть реальных новых
 * игроков, поднимаем показатели один раз и больше никогда не трогаем —
 * дальше всё это обычная игровая механика.
 */
function recoverFromResetBugOnce() {
  if (storage.get(RECOVERY_FLAG_KEY)) return;
  storage.set(RECOVERY_FLAG_KEY, true);

  const pet = usePetStore.getState().pet;
  const economy = useEconomyStore.getState();
  const looksBroken =
    !!pet && pet.xp > 0 && pet.health === 0 && pet.happiness === 0 && economy.coins === 0;
  if (!looksBroken) return;

  usePetStore.getState().applyDelta({ health: 80, happiness: 80 });
  useEconomyStore.getState().applyCoinsDelta(ECONOMY_RULES.recoveryCoins, 'Восстановление после сбоя');
}

/**
 * Реальная (не имитация) проверка сохранённого состояния игры: перечитывает
 * economy/pet/inventory из storage прямо в сторы. Если что-то там повреждено —
 * стор тихо откатывается на безопасный дефолт вместо падения в белый экран
 * (см. доп-тех-тз: "При сбое показывать игровой экран восстановления").
 *
 * Используется и на старте приложения, и перед каждым межстраничным переходом
 * (App.tsx) — экран загрузки №2 держится, пока эта проверка не завершится
 * И не истечёт минимальное время показа.
 */
export async function bootstrapGame(): Promise<void> {
  // Сначала дожидаемся нативного Preferences и возможной миграции старого
  // localStorage-профиля. После этого stores читают уже актуальный cache.
  await storage.ready();
  useEconomyStore.getState().hydrate();
  usePetStore.getState().hydrate();
  useInventoryStore.getState().hydrate();
  useDayProgressStore.getState().hydrate();
  useLessonProgressStore.getState().hydrate();
  usePeriodEventStore.getState().hydrate();
  usePeriodStore.getState().hydrate();
  useSessionStore.getState().hydrate();
  recoverFromResetBugOnce();
  const economy = useEconomyStore.getState();
  usePeriodStore.getState().ensureCurrentPeriod(economy.coins, economy.savingsBalance ?? economy.totalSaved);
}
