// Каталог магазина. Товары — реальные ассеты, нарезанные из наборов дизайна.
// Цены и влияние на питомца — игровой баланс, правится здесь без правок интерфейса.
import imgBowlBlueKibble from '../assets/items/food/bowl-blue-kibble.png';
import imgBowlYellowStew from '../assets/items/food/bowl-yellow-stew.png';
import imgBowlWhiteMix from '../assets/items/food/bowl-white-mix.png';
import imgBowlPinkMix from '../assets/items/food/bowl-pink-mix.png';
import imgBowlGreenKibble from '../assets/items/food/bowl-green-kibble.png';
import imgCanDogBlue from '../assets/items/food/can-dog-blue.png';
import imgCanCatPink from '../assets/items/food/can-cat-pink.png';
import imgCanFishOrange from '../assets/items/food/can-fish-orange.png';
import imgCanChickenGreen from '../assets/items/food/can-chicken-green.png';
import imgCanBeefPurple from '../assets/items/food/can-beef-purple.png';
import imgBagCatPink from '../assets/items/food/bag-cat-pink.png';
import imgBagFishOrange from '../assets/items/food/bag-fish-orange.png';
import imgBagChickenGreen from '../assets/items/food/bag-chicken-green.png';
import imgBagBeefPurple from '../assets/items/food/bag-beef-purple.png';
import imgBagVeggieCream from '../assets/items/food/bag-veggie-cream.png';
import imgTreatSticks from '../assets/items/food/treat-sticks.png';
import imgTreatStars from '../assets/items/food/treat-stars.png';
import imgTreatJerky from '../assets/items/food/treat-jerky.png';
import imgTreatPasteTube from '../assets/items/food/treat-paste-tube.png';
import imgSalmonSteak from '../assets/items/food/salmon-steak.png';
import imgBeefSteak from '../assets/items/food/beef-steak.png';
import imgChickenLeg from '../assets/items/food/chicken-leg.png';
import imgCarrots from '../assets/items/food/carrots.png';
import imgMeatCubes from '../assets/items/food/meat-cubes.png';
import imgBoneToyCard from '../assets/items/toys/bone-toy-card.png';
import imgBallBluePaw from '../assets/items/toys/ball-blue-paw.png';
import imgRopeKnot from '../assets/items/toys/rope-knot.png';
import imgTeddyBearBrown from '../assets/items/toys/teddy-bear-brown.png';
import imgDuckYellow from '../assets/items/toys/duck-yellow.png';
import imgFeatherWand from '../assets/items/toys/feather-wand.png';
import imgCarrotPlush from '../assets/items/toys/carrot-plush.png';
import imgFrisbeeBlue from '../assets/items/toys/frisbee-blue.png';
import imgLaserPointer from '../assets/items/toys/laser-pointer.png';
import imgPuzzleFeeder from '../assets/items/toys/puzzle-feeder.png';
import imgBallTower from '../assets/items/toys/ball-tower.png';
import imgButterflyToy from '../assets/items/toys/butterfly-toy.png';
import imgMouseRobot from '../assets/items/toys/mouse-robot.png';
import imgPompomPink from '../assets/items/toys/pompom-pink.png';
import imgSpinnerBlue from '../assets/items/toys/spinner-blue.png';
import imgFishPlushBlue from '../assets/items/toys/fish-plush-blue.png';
import imgCameraPet from '../assets/items/toys/camera-pet.png';
import imgFeederRobotCat from '../assets/items/toys/feeder-robot-cat.png';
import imgScratchingPost from '../assets/items/toys/scratching-post.png';
import imgYarnBall from '../assets/items/toys/yarn-ball.png';
import imgBoneBiscuit from '../assets/items/toys/bone-biscuit.png';
import imgOctopusPlushPurple from '../assets/items/toys/octopus-plush-purple.png';
import imgDroneToy from '../assets/items/toys/drone-toy.png';
import imgBallsSpikyPair from '../assets/items/toys/balls-spiky-pair.png';
import imgHoodieBluePaw from '../assets/items/clothing/hoodie-blue-paw.png';
import imgHoodieDinoGreen from '../assets/items/clothing/hoodie-dino-green.png';
import imgJacketVarsityBlue from '../assets/items/clothing/jacket-varsity-blue.png';
import imgSweaterPurpleHeart from '../assets/items/clothing/sweater-purple-heart.png';
import imgVestGreenPuffer from '../assets/items/clothing/vest-green-puffer.png';
import imgDressPinkBow from '../assets/items/clothing/dress-pink-bow.png';
import imgTuxedoBlack from '../assets/items/clothing/tuxedo-black.png';
import imgCapWhitePaw from '../assets/items/clothing/cap-white-paw.png';
import imgBeanieRed from '../assets/items/clothing/beanie-red.png';
import imgHatBearYellow from '../assets/items/clothing/hat-bear-yellow.png';
import imgHatPinkBow from '../assets/items/clothing/hat-pink-bow.png';
import imgHatDinoGreen from '../assets/items/clothing/hat-dino-green.png';
import imgBandanaRedPaw from '../assets/items/clothing/bandana-red-paw.png';
import imgCollarRedBell from '../assets/items/clothing/collar-red-bell.png';
import imgGlassesBluePaw from '../assets/items/clothing/glasses-blue-paw.png';
import imgGlassesPinkHeart from '../assets/items/clothing/glasses-pink-heart.png';
import imgGlassesStarGold from '../assets/items/clothing/glasses-star-gold.png';
import imgBackpackBluePaw from '../assets/items/clothing/backpack-blue-paw.png';
import imgBackpackBunnyPink from '../assets/items/clothing/backpack-bunny-pink.png';
import imgBackpackDogYellow from '../assets/items/clothing/backpack-dog-yellow.png';
import imgBedRoundBlue from '../assets/items/interior/bed-round-blue.png';
import imgPlantPot from '../assets/items/interior/plant-pot.png';
import imgPetHouse from '../assets/items/interior/pet-house.png';
import imgLampMoon from '../assets/items/interior/lamp-moon.png';
import imgTeddyBear from '../assets/items/interior/teddy-bear.png';
import imgBowlBlueFood from '../assets/items/interior/bowl-blue-food.png';
import imgRopeToyBlue from '../assets/items/interior/rope-toy-blue.png';
import imgPompomBlue from '../assets/items/interior/pompom-blue.png';
import imgMedicine from '../assets/lesson-items/medicine.png';

export type ShopCategoryId = 'popular' | 'food' | 'care' | 'toys' | 'clothes' | 'interior';

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: Exclude<ShopCategoryId, 'popular'>;
  /** попадает в подборку «Популярные товары» */
  popular?: boolean;
  favorite?: boolean;
  /** влияние на состояние питомца — используется, когда подключим экономику */
  effects?: { health?: number; happiness?: number };
}

export const shopProducts: ShopProduct[] = [
  {
    id: 'medicine-pet',
    name: 'Лекарство для питомца',
    price: 30,
    image: imgMedicine,
    category: 'care',
    popular: true,
    effects: { health: 20 },
  },
  {
    id: 'bowl-blue-kibble',
    name: 'Корм для питомца',
    price: 100,
    image: imgBowlBlueKibble,
    category: 'food',
    popular: true,
    favorite: true,
    effects: { health: 20 },
  },
  {
    id: 'bowl-yellow-stew',
    name: 'Мясное рагу',
    price: 120,
    image: imgBowlYellowStew,
    category: 'food',
    favorite: true,
    effects: { health: 22 },
  },
  {
    id: 'bowl-white-mix',
    name: 'Куриное ассорти',
    price: 110,
    image: imgBowlWhiteMix,
    category: 'food',
    favorite: true,
    effects: { health: 20 },
  },
  {
    id: 'bowl-pink-mix',
    name: 'Овощное ассорти',
    price: 95,
    image: imgBowlPinkMix,
    category: 'food',
    favorite: true,
    effects: { health: 18 },
  },
  {
    id: 'bowl-green-kibble',
    name: 'Хрустящие гранулы',
    price: 90,
    image: imgBowlGreenKibble,
    category: 'food',
    favorite: true,
    effects: { health: 18 },
  },
  {
    id: 'can-dog-blue',
    name: 'Консервы для собак',
    price: 70,
    image: imgCanDogBlue,
    category: 'food',
    favorite: true,
    effects: { health: 14 },
  },
  {
    id: 'can-cat-pink',
    name: 'Консервы для кошек',
    price: 70,
    image: imgCanCatPink,
    category: 'food',
    favorite: true,
    effects: { health: 14 },
  },
  {
    id: 'can-fish-orange',
    name: 'Консервы с рыбой',
    price: 75,
    image: imgCanFishOrange,
    category: 'food',
    favorite: true,
    effects: { health: 15 },
  },
  {
    id: 'can-chicken-green',
    name: 'Консервы с курицей',
    price: 75,
    image: imgCanChickenGreen,
    category: 'food',
    favorite: true,
    effects: { health: 15 },
  },
  {
    id: 'can-beef-purple',
    name: 'Консервы с говядиной',
    price: 80,
    image: imgCanBeefPurple,
    category: 'food',
    favorite: true,
    effects: { health: 16 },
  },
  {
    id: 'bag-cat-pink',
    name: 'Пачка корма для кошек',
    price: 140,
    image: imgBagCatPink,
    category: 'food',
    favorite: true,
    effects: { health: 26 },
  },
  {
    id: 'bag-fish-orange',
    name: 'Пачка корма с рыбой',
    price: 145,
    image: imgBagFishOrange,
    category: 'food',
    favorite: true,
    effects: { health: 26 },
  },
  {
    id: 'bag-chicken-green',
    name: 'Пачка корма с курицей',
    price: 145,
    image: imgBagChickenGreen,
    category: 'food',
    favorite: true,
    effects: { health: 26 },
  },
  {
    id: 'bag-beef-purple',
    name: 'Пачка корма с говядиной',
    price: 150,
    image: imgBagBeefPurple,
    category: 'food',
    favorite: true,
    effects: { health: 28 },
  },
  {
    id: 'bag-veggie-cream',
    name: 'Пачка корма с овощами',
    price: 135,
    image: imgBagVeggieCream,
    category: 'food',
    favorite: true,
    effects: { health: 24 },
  },
  {
    id: 'treat-sticks',
    name: 'Жевательные палочки',
    price: 45,
    image: imgTreatSticks,
    category: 'food',
    favorite: true,
    effects: { happiness: 8 },
  },
  {
    id: 'treat-stars',
    name: 'Лакомство «Звёздочки»',
    price: 40,
    image: imgTreatStars,
    category: 'food',
    favorite: true,
    effects: { happiness: 8 },
  },
  {
    id: 'treat-jerky',
    name: 'Мясные снеки',
    price: 50,
    image: imgTreatJerky,
    category: 'food',
    favorite: true,
    effects: { happiness: 9 },
  },
  {
    id: 'treat-paste-tube',
    name: 'Лакомая паста',
    price: 55,
    image: imgTreatPasteTube,
    category: 'food',
    favorite: true,
    effects: { happiness: 9 },
  },
  {
    id: 'salmon-steak',
    name: 'Стейк из лосося',
    price: 130,
    image: imgSalmonSteak,
    category: 'food',
    favorite: true,
    effects: { health: 24 },
  },
  {
    id: 'beef-steak',
    name: 'Говяжий стейк',
    price: 135,
    image: imgBeefSteak,
    category: 'food',
    favorite: true,
    effects: { health: 25 },
  },
  {
    id: 'chicken-leg',
    name: 'Куриная ножка',
    price: 85,
    image: imgChickenLeg,
    category: 'food',
    favorite: true,
    effects: { health: 17 },
  },
  {
    id: 'carrots',
    name: 'Морковь с горошком',
    price: 60,
    image: imgCarrots,
    category: 'food',
    favorite: true,
    effects: { health: 12 },
  },
  {
    id: 'meat-cubes',
    name: 'Мясные кубики',
    price: 115,
    image: imgMeatCubes,
    category: 'food',
    favorite: true,
    effects: { health: 21 },
  },
  {
    id: 'bone-toy-card',
    name: 'Игрушка «Косточка»',
    price: 150,
    image: imgBoneToyCard,
    category: 'toys',
    popular: true,
    favorite: true,
    effects: { happiness: 15 },
  },
  {
    id: 'ball-blue-paw',
    name: 'Мячик с лапкой',
    price: 90,
    image: imgBallBluePaw,
    category: 'toys',
    favorite: true,
    effects: { happiness: 10 },
  },
  {
    id: 'rope-knot',
    name: 'Канат-узел',
    price: 120,
    image: imgRopeKnot,
    category: 'toys',
    favorite: true,
    effects: { happiness: 13 },
  },
  {
    id: 'teddy-bear-brown',
    name: 'Плюшевый мишка',
    price: 210,
    image: imgTeddyBearBrown,
    category: 'toys',
    favorite: true,
    effects: { happiness: 20 },
  },
  {
    id: 'duck-yellow',
    name: 'Уточка-пищалка',
    price: 95,
    image: imgDuckYellow,
    category: 'toys',
    favorite: true,
    effects: { happiness: 11 },
  },
  {
    id: 'feather-wand',
    name: 'Дразнилка с перьями',
    price: 130,
    image: imgFeatherWand,
    category: 'toys',
    favorite: true,
    effects: { happiness: 14 },
  },
  {
    id: 'carrot-plush',
    name: 'Плюшевая морковка',
    price: 105,
    image: imgCarrotPlush,
    category: 'toys',
    favorite: true,
    effects: { happiness: 11 },
  },
  {
    id: 'frisbee-blue',
    name: 'Фрисби',
    price: 110,
    image: imgFrisbeeBlue,
    category: 'toys',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'laser-pointer',
    name: 'Лазерная указка',
    price: 140,
    image: imgLaserPointer,
    category: 'toys',
    favorite: true,
    effects: { happiness: 14 },
  },
  {
    id: 'puzzle-feeder',
    name: 'Миска-головоломка',
    price: 230,
    image: imgPuzzleFeeder,
    category: 'toys',
    favorite: true,
    effects: { happiness: 18 },
  },
  {
    id: 'ball-tower',
    name: 'Башня с шариками',
    price: 250,
    image: imgBallTower,
    category: 'toys',
    favorite: true,
    effects: { happiness: 21 },
  },
  {
    id: 'butterfly-toy',
    name: 'Бабочка на пружинке',
    price: 115,
    image: imgButterflyToy,
    category: 'toys',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'mouse-robot',
    name: 'Робо-мышка',
    price: 280,
    image: imgMouseRobot,
    category: 'toys',
    favorite: true,
    effects: { happiness: 23 },
  },
  {
    id: 'pompom-pink',
    name: 'Помпончик',
    price: 45,
    image: imgPompomPink,
    category: 'toys',
    favorite: true,
    effects: { happiness: 6 },
  },
  {
    id: 'spinner-blue',
    name: 'Спиннер-игрушка',
    price: 125,
    image: imgSpinnerBlue,
    category: 'toys',
    favorite: true,
    effects: { happiness: 13 },
  },
  {
    id: 'fish-plush-blue',
    name: 'Плюшевая рыбка',
    price: 105,
    image: imgFishPlushBlue,
    category: 'toys',
    favorite: true,
    effects: { happiness: 11 },
  },
  {
    id: 'camera-pet',
    name: 'Камера для питомца',
    price: 350,
    image: imgCameraPet,
    category: 'toys',
    favorite: true,
    effects: { happiness: 24 },
  },
  {
    id: 'feeder-robot-cat',
    name: 'Робот-кормушка',
    price: 340,
    image: imgFeederRobotCat,
    category: 'toys',
    favorite: true,
    effects: { happiness: 25 },
  },
  {
    id: 'scratching-post',
    name: 'Когтеточка',
    price: 270,
    image: imgScratchingPost,
    category: 'toys',
    favorite: true,
    effects: { happiness: 21 },
  },
  {
    id: 'yarn-ball',
    name: 'Клубок пряжи',
    price: 80,
    image: imgYarnBall,
    category: 'toys',
    favorite: true,
    effects: { happiness: 9 },
  },
  {
    id: 'bone-biscuit',
    name: 'Косточка-печенье',
    price: 60,
    image: imgBoneBiscuit,
    category: 'toys',
    favorite: true,
    effects: { happiness: 8 },
  },
  {
    id: 'octopus-plush-purple',
    name: 'Плюшевый осьминог',
    price: 160,
    image: imgOctopusPlushPurple,
    category: 'toys',
    favorite: true,
    effects: { happiness: 16 },
  },
  {
    id: 'drone-toy',
    name: 'Игрушечный дрон',
    price: 360,
    image: imgDroneToy,
    category: 'toys',
    favorite: true,
    effects: { happiness: 27 },
  },
  {
    id: 'balls-spiky-pair',
    name: 'Массажные мячики',
    price: 85,
    image: imgBallsSpikyPair,
    category: 'toys',
    favorite: true,
    effects: { happiness: 9 },
  },
  {
    id: 'hoodie-blue-paw',
    name: 'Толстовка',
    price: 250,
    image: imgHoodieBluePaw,
    category: 'clothes',
    popular: true,
    favorite: true,
    effects: { happiness: 10 },
  },
  {
    id: 'hoodie-dino-green',
    name: 'Толстовка «Динозавр»',
    price: 280,
    image: imgHoodieDinoGreen,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'jacket-varsity-blue',
    name: 'Бомбер',
    price: 320,
    image: imgJacketVarsityBlue,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 13 },
  },
  {
    id: 'sweater-purple-heart',
    name: 'Свитер с сердечком',
    price: 260,
    image: imgSweaterPurpleHeart,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 11 },
  },
  {
    id: 'vest-green-puffer',
    name: 'Жилетка',
    price: 240,
    image: imgVestGreenPuffer,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 10 },
  },
  {
    id: 'dress-pink-bow',
    name: 'Платье с бантом',
    price: 290,
    image: imgDressPinkBow,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'tuxedo-black',
    name: 'Смокинг',
    price: 380,
    image: imgTuxedoBlack,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 15 },
  },
  {
    id: 'cap-white-paw',
    name: 'Кепка с лапкой',
    price: 150,
    image: imgCapWhitePaw,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 7 },
  },
  {
    id: 'beanie-red',
    name: 'Вязаная шапка',
    price: 160,
    image: imgBeanieRed,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 7 },
  },
  {
    id: 'hat-bear-yellow',
    name: 'Шапка-мишка',
    price: 180,
    image: imgHatBearYellow,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 8 },
  },
  {
    id: 'hat-pink-bow',
    name: 'Шапка с бантиком',
    price: 175,
    image: imgHatPinkBow,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 8 },
  },
  {
    id: 'hat-dino-green',
    name: 'Шапка-динозавр',
    price: 190,
    image: imgHatDinoGreen,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 9 },
  },
  {
    id: 'bandana-red-paw',
    name: 'Бандана',
    price: 120,
    image: imgBandanaRedPaw,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 6 },
  },
  {
    id: 'collar-red-bell',
    name: 'Ошейник с бубенчиком',
    price: 145,
    image: imgCollarRedBell,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 6 },
  },
  {
    id: 'glasses-blue-paw',
    name: 'Очки с лапками',
    price: 170,
    image: imgGlassesBluePaw,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 8 },
  },
  {
    id: 'glasses-pink-heart',
    name: 'Очки-сердечки',
    price: 170,
    image: imgGlassesPinkHeart,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 8 },
  },
  {
    id: 'glasses-star-gold',
    name: 'Очки-звёзды',
    price: 185,
    image: imgGlassesStarGold,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 9 },
  },
  {
    id: 'backpack-blue-paw',
    name: 'Рюкзак с лапкой',
    price: 300,
    image: imgBackpackBluePaw,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'backpack-bunny-pink',
    name: 'Рюкзак-зайка',
    price: 310,
    image: imgBackpackBunnyPink,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'backpack-dog-yellow',
    name: 'Рюкзак-щенок',
    price: 310,
    image: imgBackpackDogYellow,
    category: 'clothes',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'bed-round-blue',
    name: 'Уютная лежанка',
    price: 300,
    image: imgBedRoundBlue,
    category: 'interior',
    popular: true,
    favorite: true,
    effects: { health: 5 },
  },
  {
    id: 'plant-pot',
    name: 'Комнатное растение',
    price: 200,
    image: imgPlantPot,
    category: 'interior',
    popular: true,
    favorite: true,
    effects: { happiness: 5 },
  },
  {
    id: 'pet-house',
    name: 'Домик',
    price: 400,
    image: imgPetHouse,
    category: 'interior',
    popular: true,
    favorite: true,
    effects: { happiness: 15 },
  },
  {
    id: 'lamp-moon',
    name: 'Лампа-луна',
    price: 350,
    image: imgLampMoon,
    category: 'interior',
    favorite: true,
    effects: { happiness: 12 },
  },
  {
    id: 'teddy-bear',
    name: 'Плюшевый друг',
    price: 220,
    image: imgTeddyBear,
    category: 'interior',
    favorite: true,
    effects: { happiness: 10 },
  },
  {
    id: 'bowl-blue-food',
    name: 'Миска для еды',
    price: 130,
    image: imgBowlBlueFood,
    category: 'interior',
    favorite: true,
    effects: { health: 6 },
  },
  {
    id: 'rope-toy-blue',
    name: 'Канат для комнаты',
    price: 120,
    image: imgRopeToyBlue,
    category: 'interior',
    favorite: true,
    effects: { happiness: 7 },
  },
  {
    id: 'pompom-blue',
    name: 'Подвесной помпон',
    price: 70,
    image: imgPompomBlue,
    category: 'interior',
    favorite: true,
    effects: { happiness: 5 },
  },
];

export function productsByCategory(category: ShopCategoryId): ShopProduct[] {
  if (category === 'popular') return shopProducts.filter((p) => p.popular);
  return shopProducts.filter((p) => p.category === category);
}

// ——— Комнаты: фоны главного экрана. Покупаются с предпросмотром ———
import roomDay from '../assets/backgrounds/room-day.jpg';
import roomDay2 from '../assets/backgrounds/room-day-2.jpg';
import roomGreen from '../assets/backgrounds/room-green.jpg';
import roomNight from '../assets/backgrounds/room-night.jpg';
import roomKitchenCitrus from '../assets/backgrounds/room-kitchen-citrus.jpg';
import roomKitchenPaw from '../assets/backgrounds/room-kitchen-paw.jpg';
import roomKitchenGreen from '../assets/backgrounds/room-kitchen-green.jpg';
import roomKitchenSpace from '../assets/backgrounds/room-kitchen-space.jpg';

/** Раздел интерьера в магазине: игровая (обычные комнаты) или кухня (столовая). */
export type RoomSection = 'playroom' | 'kitchen';

export interface RoomProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  /** фон комнаты для главного экрана */
  background: string;
  /** стартовая комната уже принадлежит игроку */
  owned?: boolean;
  /** раздел вкладки «Интерьер» в магазине — «Игровая» или «Кухня» */
  section: RoomSection;
}

export const rooms: RoomProduct[] = [
  {
    id: 'room-day',
    name: 'Светлая комната',
    description: 'Твоя стартовая комната',
    price: 0,
    background: roomDay,
    owned: true,
    section: 'playroom',
  },
  {
    id: 'room-day-2',
    name: 'Солнечная комната',
    description: 'Больше света и места для игр',
    price: 800,
    background: roomDay2,
    section: 'playroom',
  },
  {
    id: 'room-green',
    name: 'Зелёная комната',
    description: 'Мягкий ковёр и много растений',
    price: 1000,
    background: roomGreen,
    section: 'playroom',
  },
  {
    id: 'room-night',
    name: 'Ночная комната',
    description: 'Звёзды на ковре и ночник',
    price: 1200,
    background: roomNight,
    section: 'playroom',
  },
  {
    id: 'room-kitchen-citrus',
    name: 'Цветочная кухня',
    description: 'Голубой кафель и корзинка мандаринов',
    price: 900,
    background: roomKitchenCitrus,
    section: 'kitchen',
  },
  {
    id: 'room-kitchen-paw',
    name: 'Кухня с лапками',
    description: 'Голубые шкафчики и посуда с лапками',
    price: 900,
    background: roomKitchenPaw,
    section: 'kitchen',
  },
  {
    id: 'room-kitchen-green',
    name: 'Зелёная кухня',
    description: 'Много растений и уютный свет',
    price: 900,
    background: roomKitchenGreen,
    section: 'kitchen',
  },
  {
    id: 'room-kitchen-space',
    name: 'Космическая кухня',
    description: 'Звёзды, планеты и ночная гирлянда',
    price: 950,
    background: roomKitchenSpace,
    section: 'kitchen',
  },
];

export function roomsBySection(section: RoomSection): RoomProduct[] {
  return rooms.filter((r) => r.section === section);
}
