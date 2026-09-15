export type ShopCategory = 'food' | 'toys' | 'clothes' | 'interior';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  emoji: string;
  effects: { health?: number; happiness?: number };
}

export const shopItems: ShopItem[] = [
  { id: 'food-bowl', name: 'Корм для питомца', category: 'food', price: 100, emoji: '🍖', effects: { health: 20 } },
  { id: 'toy-bone', name: 'Игрушка "Косточка"', category: 'toys', price: 150, emoji: '🦴', effects: { happiness: 15 } },
  { id: 'bed', name: 'Уютная лежанка', category: 'interior', price: 300, emoji: '🛏️', effects: { happiness: 10, health: 5 } },
  { id: 'hoodie', name: 'Толстовка', category: 'clothes', price: 250, emoji: '🧥', effects: { happiness: 10 } },
  { id: 'plant', name: 'Комнатное растение', category: 'interior', price: 200, emoji: '🪴', effects: { happiness: 5 } },
  { id: 'house', name: 'Домик', category: 'interior', price: 400, emoji: '🏠', effects: { happiness: 15 } },
];

export function getItemsByCategory(category: ShopCategory | 'all'): ShopItem[] {
  if (category === 'all') return shopItems;
  return shopItems.filter((i) => i.category === category);
}
