import { useEconomyStore } from './economyStore';
import { usePetStore } from '../pet/petStore';
import { useInventoryStore } from '../inventory/inventoryStore';
import { useDayProgressStore } from '../progress/dayProgressStore';
import { usePeriodStore } from './periodStore';
import type { ShopProduct, RoomProduct } from '../../data/shopData';
import { dayTasks } from '../../data/dayData';
import { remainingCategoryBudget, type EconomyProductMeta } from '../../core/economy';

export type PurchaseResult = 'ok' | 'already_owned' | 'insufficient_funds';

export interface PurchaseFunding {
  categoryLabel: 'Обязательное' | 'Желания' | 'Накопления' | 'Кошелёк';
  categoryRemaining: number;
  savingsNeeded: number;
  savingsAvailable: number;
  canUseSavings: boolean;
}

interface PurchaseOptions {
  /** Сумма, которую пользователь уже подтвердил и вывел из копилки. */
  savingsContribution?: number;
}

const SHOP_TASK_XP = dayTasks.find((t) => t.id === 'shop')?.xp ?? 0;

/** Преобразует текущую витрину в экономические признаки из утвержденной модели.
 * До полной миграции каталога используем безопасные правила по категории и цене:
 * полноценная еда от 120 монет — обязательная, дешевые перекусы — желание,
 * интерьер — цель, оплачиваемая из накоплений в следующем слое UI. */
export function toEconomyProductMeta(product: ShopProduct) {
  const isFood = product.category === 'food';
  const isCare = product.category === 'care';
  const isFullMeal = isFood && product.price >= 120;
  const isSelectedGoal = useEconomyStore.getState().savingsGoal?.id === product.id;
  return {
    id: product.id,
    price: product.price,
    expenseType: isSelectedGoal ? 'goal' as const : isFood && isFullMeal ? 'mandatory' as const : isCare ? 'mandatory' as const : 'optional' as const,
    mealType: isFullMeal ? 'fullMeal' as const : isFood ? 'snack' as const : 'none' as const,
    satietyEffect: product.effects?.health ?? 0,
    moodEffect: product.effects?.happiness ?? 0,
    // Даже цель оплачивается из кошелька. Если кошелёк пуст, экран покупки
    // должен отдельно предложить вывести недостающую сумму из копилки.
    savingsOnly: false,
    periodEligible: true,
  };
}

function getFunding(meta: EconomyProductMeta): PurchaseFunding {
  const economy = useEconomyStore.getState();
  const period = usePeriodStore.getState();
  const savingsAvailable = economy.savingsBalance ?? economy.totalSaved;

  if (period.status !== 'active' || !period.plan) {
    const categoryRemaining = economy.coins;
    const savingsNeeded = Math.max(0, meta.price - categoryRemaining);
    return {
      categoryLabel: 'Кошелёк',
      categoryRemaining,
      savingsNeeded,
      savingsAvailable,
      canUseSavings: savingsNeeded > 0 && savingsAvailable >= savingsNeeded,
    };
  }

  const categoryRemaining = remainingCategoryBudget(period.plan, period.actual, meta.expenseType);
  const availableNow = meta.expenseType === 'goal'
    ? 0
    : Math.min(categoryRemaining, economy.coins);
  const savingsNeeded = Math.max(0, meta.price - availableNow);
  return {
    categoryLabel: meta.expenseType === 'mandatory'
      ? 'Обязательное'
      : meta.expenseType === 'optional'
        ? 'Желания'
        : 'Накопления',
    categoryRemaining,
    savingsNeeded,
    savingsAvailable,
    canUseSavings: savingsNeeded > 0 && savingsAvailable >= savingsNeeded,
  };
}

export function getProductPurchaseFunding(product: ShopProduct): PurchaseFunding {
  return getFunding(toEconomyProductMeta(product));
}

export function getRoomPurchaseFunding(room: RoomProduct): PurchaseFunding {
  const isSelectedGoal = useEconomyStore.getState().savingsGoal?.id === room.id;
  return getFunding({
    id: room.id,
    price: room.price,
    expenseType: isSelectedGoal ? 'goal' : 'optional',
    mealType: 'none',
    satietyEffect: 0,
    moodEffect: 0,
    savingsOnly: false,
    periodEligible: true,
  });
}

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
export function purchaseProduct(product: ShopProduct, options: PurchaseOptions = {}): PurchaseResult {
  const inventory = useInventoryStore.getState();
  const isFood = product.category === 'food';
  const isCare = product.category === 'care';
  // Еда — расходник: её можно покупать снова и снова, запас копится (foodQty),
  // а не блокируется как «уже куплено» — иначе после первой пачки её нельзя
  // было бы пополнить. Остальные категории по-прежнему покупаются один раз.
  if (!isFood && !isCare && inventory.isProductOwned(product.id)) return 'already_owned';

  const economy = useEconomyStore.getState();
  const meta = toEconomyProductMeta(product);
  const period = usePeriodStore.getState();
  if (period.status === 'active') {
    if (economy.coins !== period.walletBalance || economy.coins < product.price || !period.recordPurchase(meta, options.savingsContribution ?? 0)) {
      return 'insufficient_funds';
    }
  } else if (economy.coins < product.price) {
    return 'insufficient_funds';
  }

  economy.applyCoinsDelta(-product.price, `Покупка: ${product.name}`, {
    periodId: period.status === 'active' ? period.id : undefined,
    category: meta.expenseType === 'mandatory' ? 'mandatory' : 'optional',
  });
  if (isFood) {
    // Эффект еды (здоровье/счастье) применяется не при покупке, а при
    // кормлении на экране «Кухня» — см. features/economy/feed.ts.
    inventory.addFoodQty(product.id, 1);
  } else if (isCare) {
    inventory.addMedicineQty(product.id, 1);
  } else if (product.effects?.health || product.effects?.happiness) {
    usePetStore.getState().applyDelta({
      health: product.effects.health,
      happiness: product.effects.happiness,
    });
  }

  if (product.category === 'toys') {
    usePetStore.getState().recordCareInteraction('buyToy', 'shop');
  }

  // Задание дня «Купи что-нибудь в магазине» засчитывается любой реальной покупкой.
  if (!isFood && !isCare) inventory.addOwnedProduct(product.id);
  completeShopTaskOnce();

  return 'ok';
}

/** Покупка/установка фона комнаты — тратит монеты только если комната ещё не куплена.
 *  Игровая и кухня — независимые «активные фоны» (см. inventoryStore), поэтому
 *  здесь всегда учитывается раздел комнаты (room.section). */
export function purchaseRoom(room: RoomProduct, options: PurchaseOptions = {}): PurchaseResult {
  const inventory = useInventoryStore.getState();
  if (inventory.ownedRoomIds.includes(room.id)) {
    if (room.section === 'kitchen') {
      inventory.setActiveKitchenRoom(room.id);
    } else {
      inventory.setActiveRoom(room.id);
    }
    return 'already_owned';
  }

  const economy = useEconomyStore.getState();
  const period = usePeriodStore.getState();
  const isSelectedGoal = economy.savingsGoal?.id === room.id;
  if (period.status === 'active') {
    const meta = { id: room.id, price: room.price, expenseType: isSelectedGoal ? 'goal' as const : 'optional' as const, mealType: 'none' as const, satietyEffect: 0, moodEffect: 0, savingsOnly: isSelectedGoal, periodEligible: true };
    if (economy.coins !== period.walletBalance || economy.coins < room.price || !period.recordPurchase({ ...meta, savingsOnly: false }, options.savingsContribution ?? 0)) {
      return 'insufficient_funds';
    }
    economy.applyCoinsDelta(-room.price, `Комната: ${room.name}`, {
      periodId: period.id,
      category: isSelectedGoal ? 'goal' : 'optional',
    });
  } else if (room.price > 0) {
    if (economy.coins < room.price) return 'insufficient_funds';
    economy.applyCoinsDelta(-room.price, `Комната: ${room.name}`, { category: isSelectedGoal ? 'goal' : 'optional' });
  }
  inventory.addOwnedRoom(room.id, room.section);
  usePetStore.getState().registerInteraction();

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
  usePetStore.getState().recordCareInteraction('feed', 'free_action');
  usePetStore.getState().registerInteraction();

  return true;
}

/** Выдача лекарства питомцу после покупки в магазине. Покупка и применение
 * намеренно разделены: ребёнок должен сначала найти лекарство в магазине,
 * а затем выполнить действие ухода по подсказке события. */
export function giveMedicine(product: ShopProduct): boolean {
  if (product.category !== 'care') return false;
  const inventory = useInventoryStore.getState();
  if (!inventory.consumeMedicine(product.id)) return false;

  if (product.effects?.health || product.effects?.happiness) {
    usePetStore.getState().applyDelta({
      health: product.effects.health,
      happiness: product.effects.happiness,
    });
  }
  usePetStore.getState().recordCareInteraction('medicine', 'free_action');
  usePetStore.getState().registerInteraction();
  return true;
}
