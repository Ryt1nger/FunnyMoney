import { useEconomyStore } from '../features/economy/economyStore';
import { usePetStore } from '../features/pet/petStore';
import { useInventoryStore } from '../features/inventory/inventoryStore';

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
  // Настоящая работа (чтение/валидация localStorage) синхронная и быстрая,
  // но оборачиваем в микротаск, чтобы не блокировать первый кадр рендера.
  await Promise.resolve();
  useEconomyStore.getState().hydrate();
  usePetStore.getState().hydrate();
  useInventoryStore.getState().hydrate();
}
