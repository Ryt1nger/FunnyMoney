import { economyProducts, type EconomyProduct } from './economyCatalog';

export type ShopCategoryId = 'popular' | 'food' | 'care' | 'toys' | 'clothes' | 'interior';

export interface ShopProduct extends EconomyProduct {
  category: Exclude<ShopCategoryId, 'popular'>;
  popular?: boolean;
  favorite?: boolean;
}

// Совместимый экспорт для экранов магазина, экономики и родительского кабинета.
// Популярные товары теперь не добавляются отдельно: витрина показывает только
// позиции, утвержденные экономикой игры.
export const shopProducts: ShopProduct[] = economyProducts;

export function productsByCategory(category: ShopCategoryId): ShopProduct[] {
  if (category === 'popular') return shopProducts.slice(0, 8);
  return shopProducts.filter((p) => p.category === category);
}

import roomDay from '../assets/backgrounds/room-day.jpg';
import roomDay2 from '../assets/backgrounds/room-day-2.jpg';
import roomGreen from '../assets/backgrounds/room-green.jpg';
import roomNight from '../assets/backgrounds/room-night.jpg';
import roomKitchenCitrus from '../assets/backgrounds/room-kitchen-citrus.jpg';
import roomKitchenPaw from '../assets/backgrounds/room-kitchen-paw.jpg';
import roomKitchenGreen from '../assets/backgrounds/room-kitchen-green.jpg';
import roomKitchenSpace from '../assets/backgrounds/room-kitchen-space.jpg';

export type RoomSection = 'playroom' | 'kitchen';

export interface RoomProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  background: string;
  owned?: boolean;
  section: RoomSection;
}

export const rooms: RoomProduct[] = [
  { id: 'room-day', name: 'Светлая комната', description: 'Базовая стартовая комната', price: 0, background: roomDay, owned: true, section: 'playroom' },
  { id: 'room-day-2', name: 'Солнечная комната', description: '+80% настроения', price: 700, background: roomDay2, section: 'playroom' },
  { id: 'room-green', name: 'Зеленая комната', description: '+90% настроения', price: 900, background: roomGreen, section: 'playroom' },
  { id: 'room-night', name: 'Ночная комната', description: '+100% настроения', price: 1100, background: roomNight, section: 'playroom' },
  { id: 'room-kitchen-citrus', name: 'Цветочная кухня', description: '+85% настроения', price: 800, background: roomKitchenCitrus, section: 'kitchen' },
  { id: 'room-kitchen-paw', name: 'Кухня с лапками', description: '+85% настроения', price: 800, background: roomKitchenPaw, section: 'kitchen' },
  { id: 'room-kitchen-green', name: 'Зеленая кухня', description: '+85% настроения', price: 800, background: roomKitchenGreen, section: 'kitchen' },
  { id: 'room-kitchen-space', name: 'Космическая кухня', description: '+95% настроения', price: 1000, background: roomKitchenSpace, section: 'kitchen' },
];

export function roomsBySection(section: RoomSection): RoomProduct[] {
  return rooms.filter((r) => r.section === section);
}
