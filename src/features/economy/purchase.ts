import { useEconomyStore } from './economyStore';
import { usePetStore } from '../pet/petStore';
import { useInventoryStore } from '../inventory/inventoryStore';
import { useDayProgressStore } from '../progress/dayProgressStore';
import type { ShopProduct, RoomProduct } from '../../data/shopData';
import { dayTasks } from '../../data/dayData';

export type PurchaseResult = 'ok' | 'already_owned' | 'insufficient_funds';

const SHOP_TASK_XP = dayTasks.find((t) => t.id === 'shop')?.xp ?? 0;

/** Засчитывает задание дня «Купи что-нибудь в магазине» — но только один раз
 *  за день, и только тогда реально начисляет его опыт (иначе вторая и
 *  последующие покупки в тот же день давали бы XP повторно). */
function completeShopTaskOnce() {
  const dayProgress = useDayProgressStore.getState();
  if (dayProgress.isCompleted('shop')) return;
  dayProgress.completeTask('shop');
  usePetStore.getState().addXp(SHOP_TASK_XP);
}

/**
 * Единая точка для любой траты монет в игре: проверяет баланс, списывает
 * монеты (с записью транзакции в economyStore), применяет эффект на питомца
 * и помечает товар купленным в inventoryStore — всё персистится через storage.
 * Ни один экран не должен списывать монеты в обход этой функции.
 */
export function purchaseProduct(product: ShopProduct): PurchaseResult {
  const inventory = useInventoryStore.getState();
  if (inventory.isProductOwned(product.id)) return 'already_owned';

  const { coins, applyCoinsDelta } = useEconomyStore.getState();
  if (coins < product.price) return 'insufficient_funds';

  applyCoinsDelta(-product.price, `Покупка: ${product.name}`);
  inventory.addOwnedProduct(product.id);

  if (product.effects?.health || product.effects?.happiness) {
    usePetStore.getState().applyDelta({
      health: product.effects.health,
      happiness: product.effects.happiness,
    });
  }

  // Задание дня «Купи что-нибудь в магазине» засчитывается любой реальной покупкой.
  completeShopTaskOnce();

  return 'ok';
}

/** Покупка/установка фона комнаты — тратит монеты только если комната ещё не куплена. */
export function purchaseRoom(room: RoomProduct): PurchaseResult {
  const inventory = useInventoryStore.getState();
  if (inventory.ownedRoomIds.includes(room.id)) {
    inventory.setActiveRoom(room.id);
    return 'already_owned';
  }

  const { coins, applyCoinsDelta } = useEconomyStore.getState();
  if (coins < room.price) return 'insufficient_funds';

  if (room.price > 0) {
    applyCoinsDelta(-room.price, `Комната: ${room.name}`);
  }
  inventory.addOwnedRoom(room.id);

  // Покупка комнаты — тоже реальная покупка в магазине, засчитывает задание дня.
  completeShopTaskOnce();

  return 'ok';
}
