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
  const isFood = product.category === 'food';
  // Еда — расходник: её можно покупать снова и снова, запас копится (foodQty),
  // а не блокируется как «уже куплено» — иначе после первой пачки её нельзя
  // было бы пополнить. Остальные категории по-прежнему покупаются один раз.
  if (!isFood && inventory.isProductOwned(product.id)) return 'already_owned';

  const { coins, applyCoinsDelta } = useEconomyStore.getState();
  if (coins < product.price) return 'insufficient_funds';

  applyCoinsDelta(-product.price, `Покупка: ${product.name}`);
  inventory.addOwnedProduct(product.id);

  if (isFood) {
    // Эффект еды (здоровье/счастье) применяется не при покупке, а при
    // кормлении на экране «Кухня» — см. features/economy/feed.ts.
    inventory.addFoodQty(product.id, 1);
  } else if (product.effects?.health || product.effects?.happiness) {
    usePetStore.getState().applyDelta({
      health: product.effects.health,
      happiness: product.effects.happiness,
    });
  }

  // Задание дня «Купи что-нибудь в магазине» засчитывается любой реальной покупкой.
  completeShopTaskOnce();

  return 'ok';
}

/** Покупка/установка фона комнаты — тратит монеты только если комната ещё не куплена.
 *  Игровая и кухня — независимые «активные фоны» (см. inventoryStore), поэтому
 *  здесь всегда учитывается раздел комнаты (room.section). */
export function purchaseRoom(room: RoomProduct): PurchaseResult {
  const inventory = useInventoryStore.getState();
  if (inventory.ownedRoomIds.includes(room.id)) {
    if (room.section === 'kitchen') {
      inventory.setActiveKitchenRoom(room.id);
    } else {
      inventory.setActiveRoom(room.id);
    }
    return 'already_owned';
  }

  const { coins, applyCoinsDelta } = useEconomyStore.getState();
  if (coins < room.price) return 'insufficient_funds';

  if (room.price > 0) {
    applyCoinsDelta(-room.price, `Комната: ${room.name}`);
  }
  inventory.addOwnedRoom(room.id, room.section);

  // Покупка комнаты — тоже реальная покупка в магазине, засчитывает задание дня.
  completeShopTaskOnce();

  return 'ok';
}

/** Кормление питомца едой из инвентаря — тратит одну единицу и применяет её
 *  эффект (здоровье/счастье) питомцу. Вызывается с экрана «Кухня». */
export function feedPet(product: ShopProduct): boolean {
  const inventory = useInventoryStore.getState();
  const ok = inventory.consumeFood(product.id);
  if (!ok) return false;

  if (product.effects?.health || product.effects?.happiness) {
    usePetStore.getState().applyDelta({
      health: product.effects.health,
      happiness: product.effects.happiness,
    });
  }

  return true;
}
