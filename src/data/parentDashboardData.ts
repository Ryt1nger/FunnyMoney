// Аналитика для родительского кабинета — считается из настоящих данных игры
// (история транзакций economyStore, купленные товары inventoryStore), без
// выдуманных чисел. Раньше здесь была демо-заглушка (иллюстративные проценты
// "успешных решений", "финансовой грамотности" и т.п.) — её убрали, как только
// стало ясно, какие метрики можно посчитать честно уже сейчас.
import type { Transaction } from '../types';
import { shopProducts } from './shopData';

export interface ChartPoint {
  label: string;
  value: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Монеты, заработанные по дням — последние `days` дней, сегодня включительно. */
export function earnedByDay(transactions: Transaction[], days: number): ChartPoint[] {
  const todayStart = startOfDay(Date.now());
  const buckets = Array.from({ length: days }, (_, i) => {
    const start = todayStart - (days - 1 - i) * DAY_MS;
    return { start, end: start + DAY_MS, total: 0 };
  });
  for (const tx of transactions) {
    if (tx.amount <= 0) continue; // только заработанное, не траты
    const bucket = buckets.find((b) => tx.timestamp >= b.start && tx.timestamp < b.end);
    if (bucket) bucket.total += tx.amount;
  }
  return buckets.map((b) => ({
    label: new Date(b.start).toLocaleDateString('ru-RU', { weekday: 'short' }).replace('.', ''),
    value: b.total,
  }));
}

/** Монеты, заработанные по неделям — последние `weeks` семидневных окон, до сегодня включительно. */
export function earnedByWeek(transactions: Transaction[], weeks: number): ChartPoint[] {
  const todayEnd = startOfDay(Date.now()) + DAY_MS;
  const weekMs = 7 * DAY_MS;
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = todayEnd - (weeks - 1 - i) * weekMs;
    return { start: end - weekMs, end, total: 0 };
  });
  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const bucket = buckets.find((b) => tx.timestamp >= b.start && tx.timestamp < b.end);
    if (bucket) bucket.total += tx.amount;
  }
  return buckets.map((b, i) => ({ label: `${i + 1} нед.`, value: b.total }));
}

export type PurchaseCategoryId = 'food' | 'toys' | 'clothes' | 'rooms';

export interface PurchaseCategoryStat {
  id: PurchaseCategoryId;
  label: string;
  count: number;
}

/** Реальная разбивка покупок по категориям — из инвентаря, а не проценты "на глаз". */
export function purchasesByCategory(ownedProductIds: string[], boughtRoomsCount: number): PurchaseCategoryStat[] {
  const owned = shopProducts.filter((p) => ownedProductIds.includes(p.id));
  const countOf = (cat: 'food' | 'toys' | 'clothes') => owned.filter((p) => p.category === cat).length;
  return [
    { id: 'food', label: 'Еда', count: countOf('food') },
    { id: 'toys', label: 'Игрушки', count: countOf('toys') },
    { id: 'clothes', label: 'Одежда', count: countOf('clothes') },
    { id: 'rooms', label: 'Комнаты', count: boughtRoomsCount },
  ];
}
