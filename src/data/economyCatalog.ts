import type { ShopCategoryId } from './shopData';

// Ассортимент из «Экономика игры и ассортимент магазина.pdf».
// Эффекты хранятся в тех же полях, которые использует игровая экономика:
// health = сытость, happiness = настроение.
export interface EconomyProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Exclude<ShopCategoryId, 'popular'>;
  effects: { health?: number; happiness?: number };
}

const asset = (name: string) => new URL(`../assets/economy/${name}.png`, import.meta.url).href;
const food = (id: string, name: string, price: number, health: number, description: string, happiness = 0): EconomyProduct => ({ id, name, price, image: asset(id), category: 'food', description, effects: { health, ...(happiness ? { happiness } : {}) } });
const toy = (id: string, name: string, price: number, happiness: number, description: string): EconomyProduct => ({ id, name, price, image: asset(id), category: 'toys', description, effects: { happiness } });
const clothes = (id: string, name: string, price: number, happiness: number, description: string): EconomyProduct => ({ id, name, price, image: asset(id), category: 'clothes', description, effects: { happiness } });

export const economyProducts: EconomyProduct[] = [
  food('oatmeal', 'Овсянка', 50, 25, 'Перекус: +25% сытости.'),
  food('fruit_salad', 'Фруктовый салат', 50, 25, 'Перекус: +25% сытости.'),
  food('honey', 'Мед', 60, 30, 'Перекус: +30% сытости.'),
  food('berry_smoothie', 'Ягодный смузи', 70, 30, 'Перекус: +30% сытости, +10% настроения.', 10),
  food('syrniki', 'Сырники', 70, 35, 'Перекус: +35% сытости.'),
  food('sandwich', 'Сэндвич', 120, 55, 'Полноценный обед: +55% сытости.'),
  food('baked_potato', 'Печеная картошка', 120, 55, 'Полноценный обед: +55% сытости.'),
  food('chicken_soup', 'Куриный суп', 140, 60, 'Полноценный обед: +60% сытости.'),
  food('cheese_pasta', 'Сырная паста', 140, 60, 'Полноценный обед: +60% сытости.'),
  food('pelmeni', 'Пельмешки', 140, 60, 'Полноценный обед: +60% сытости.'),
  food('cheese_soup', 'Сырный суп', 140, 60, 'Полноценный обед: +60% сытости.'),
  food('pancakes', 'Оладушки', 150, 50, 'Полноценный обед: +50% сытости, +15% настроения.', 15),
  food('fish_steak', 'Стейк из рыбы', 190, 60, 'Праздник: +60% сытости, +20% настроения.', 20),
  food('pizza', 'Пицца', 200, 60, 'Праздник: +60% сытости, +30% настроения.', 30),
  food('chocolate_cake', 'Шоколадный торт', 210, 40, 'Праздник: +40% сытости, +50% настроения.', 50),

  toy('balloon', 'Воздушный шарик', 60, 15, 'Мелкая радость: +15% настроения.'),
  toy('paw_fidget', 'Таба-лапка', 80, 20, 'Мелкая радость: +20% настроения.'),
  toy('pop_it', 'Поп-ит', 80, 20, 'Мелкая радость: +20% настроения.'),
  toy('squish', 'Сквиш', 80, 20, 'Мелкая радость: +20% настроения.'),
  toy('slime', 'Слайм', 90, 25, 'Мелкая радость: +25% настроения.'),
  toy('paw_ball', 'Мячик с лапкой', 90, 25, 'Мелкая радость: +25% настроения.'),
  toy('frisbee', 'Фрисби', 110, 30, 'Мелкая радость: +30% настроения.'),
  toy('spring_butterfly', 'Бабочка на пружинке', 115, 30, 'Мелкая радость: +30% настроения.'),
  toy('feather_wand', 'Дразнилка с перьями', 130, 32, 'Мелкая радость: +32% настроения.'),
  toy('pumpkin_lamp', 'Лампа-тыква', 150, 35, 'Мелкая радость: +35% настроения.'),
  toy('teddy_bear', 'Плюшевый мишка', 210, 40, 'Средняя покупка: +40% настроения.'),
  toy('capybara', 'Игрушка «Капибара»', 250, 45, 'Средняя покупка: +45% настроения.'),
  toy('beach_ball', 'Мяч', 280, 45, 'Средняя покупка: +45% настроения.'),
  toy('skateboard', 'Скейтборд', 800, 75, 'Главная мечта: +75% настроения.'),
  toy('scooter', 'Самокат', 1000, 85, 'Главная мечта: +85% настроения.'),
  toy('camera', 'Фотоаппарат', 1200, 85, 'Главная мечта: +85% настроения.'),
  toy('blogger_kit', 'Набор блогера', 1400, 90, 'Главная мечта: +90% настроения.'),
  toy('smartwatch', 'Смарт-часы', 1600, 100, 'Главная мечта: +100% настроения.'),
  toy('vr_headset', 'VR-шлем', 2000, 100, 'Главная мечта: +100% настроения.'),

  clothes('bandana', 'Бандана', 90, 20, 'Легкий аксессуар: +20% настроения.'),
  clothes('bell_collar', 'Ошейник с бубенчиком', 100, 22, 'Легкий аксессуар: +22% настроения.'),
  clothes('paw_cap', 'Кепка с лапкой', 120, 25, 'Легкий аксессуар: +25% настроения.'),
  clothes('knit_hat', 'Вязаная шапка', 120, 25, 'Легкий аксессуар: +25% настроения.'),
  clothes('paw_glasses', 'Очки с лапками', 130, 28, 'Легкий аксессуар: +28% настроения.'),
  clothes('heart_glasses', 'Очки-сердечки', 130, 28, 'Легкий аксессуар: +28% настроения.'),
  clothes('star_glasses', 'Очки-звезды', 140, 30, 'Легкий аксессуар: +30% настроения.'),
  clothes('bear_hat', 'Шапка-мишка', 140, 30, 'Легкий аксессуар: +30% настроения.'),
  clothes('bow_hat', 'Шапка с бантиком', 140, 30, 'Легкий аксессуар: +30% настроения.'),
  clothes('dino_hat', 'Шапка-динозавр', 150, 32, 'Легкий аксессуар: +32% настроения.'),
  clothes('vest', 'Жилетка', 180, 35, 'Основная одежда: +35% настроения.'),
  clothes('hoodie', 'Толстовка', 200, 40, 'Основная одежда: +40% настроения.'),
  clothes('heart_sweater', 'Свитер с сердечком', 210, 40, 'Основная одежда: +40% настроения.'),
  clothes('dino_hoodie', 'Толстовка «Динозавр»', 230, 45, 'Основная одежда: +45% настроения.'),
  clothes('pink_dress', 'Платье с бантом', 240, 45, 'Основная одежда: +45% настроения.'),
  clothes('backpack_paw', 'Рюкзак с лапкой', 250, 50, 'Основная одежда: +50% настроения.'),
  clothes('backpack_bunny', 'Рюкзак-зайка', 260, 50, 'Основная одежда: +50% настроения.'),
  clothes('backpack_puppy', 'Рюкзак-щенок', 260, 50, 'Основная одежда: +50% настроения.'),
  clothes('bomber', 'Бомбер', 300, 60, 'Премиум-наряд: +60% настроения.'),
  clothes('tuxedo', 'Смокинг', 380, 70, 'Премиум-наряд: +70% настроения.'),
];
