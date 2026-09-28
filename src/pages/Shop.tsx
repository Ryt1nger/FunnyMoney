import { useEffect, useState } from 'react';
import heroImg from '../assets/heroes/hero-shop.jpg';
import coinIcon from '../assets/icons/coin.png';
import titleBag from '../assets/icons/shop/title-bag.png';
import catFood from '../assets/icons/shop/cat-food.png';
import catToys from '../assets/icons/shop/cat-toys.png';
import catClothes from '../assets/icons/shop/cat-clothes.png';
import catInterior from '../assets/icons/shop/cat-interior.png';
import MaskIcon from '../components/MaskIcon';
import { IconArrowLeft, IconPlus, IconCheck } from '../components/icons';
import {
  productsByCategory,
  roomsBySection,
  type RoomProduct,
  type RoomSection,
  type ShopCategoryId,
  type ShopProduct,
} from '../data/shopData';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { getProductPurchaseFunding, getRoomPurchaseFunding, purchaseProduct, toEconomyProductMeta } from '../features/economy/purchase';
import { useEconomyStore } from '../features/economy/economyStore';
import ConfirmPurchaseModal, { type PurchaseEffect } from '../components/ConfirmPurchaseModal';

const CATEGORIES: { id: ShopCategoryId; label: string; icon: string }[] = [
  { id: 'food', label: 'Еда', icon: catFood },
  { id: 'toys', label: 'Игрушки', icon: catToys },
  { id: 'clothes', label: 'Одежда', icon: catClothes },
  { id: 'interior', label: 'Интерьер', icon: catInterior },
];

const INTERIOR_SECTIONS: { id: RoomSection; label: string }[] = [
  { id: 'playroom', label: 'Игровая' },
  { id: 'kitchen', label: 'Кухня' },
];

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const BTN_SHADOW =
  'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)';

/** Короткое текстовое описание товара для модалки подтверждения — без цифр,
 * сами цифры (влияние на метрики) выносятся отдельно в buildPurchaseEffects. */
function describeProduct(product: ShopProduct): string {
  return product.description;
}

/** Влияние покупки на три метрики игры — Здоровье, Счастье и Богатство.
 * Показываем все три всегда (в игре нет метрики "сытость" — только эти три):
 * Здоровье/Счастье берём из эффектов товара (0, если товар их не даёт),
 * Богатство — всегда отрицательное, в процентах от текущего доступного
 * баланса (сколько своих денег ребёнок сейчас потратит). */
function buildPurchaseEffects(product: ShopProduct, availableCoins: number): PurchaseEffect[] {
  const meta = toEconomyProductMeta(product);
  const wealthPercent = -Math.round((product.price / Math.max(1, availableCoins)) * 100);
  return [
    { label: 'Сытость', value: meta.satietyEffect ?? 0, icon: '🍽️', color: '#f43f5e' },
    { label: 'Счастье', value: meta.moodEffect ?? 0, icon: '😊', color: '#f59e0b' },
    { label: 'Богатство', value: wealthPercent, icon: '💰', color: '#22c55e', suffix: '%' },
  ];
}

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  ownedRoomIds: string[];
  onClose: () => void;
  /** открыть просмотр комнаты перед покупкой — категория «Интерьер» продаёт фоны, а не мелкие предметы */
  onRoomSelect: (room: RoomProduct) => void;
  /** плюсик у баланса — то же окно "как заработать монеты", что и на главной */
  onOpenEarnModal?: () => void;
  /** родительский контроль: если выключено — покупки проходят сразу, без окна
   * подтверждения. По умолчанию подтверждение действует для всего каталога. */
  confirmationEnabled?: boolean;
  /** Открыт корзинкой с экрана кухни — показываем только «Еду» и кухонный
   *  интерьер (без игрушек/одежды/игровой комнаты). Из нижнего меню магазин
   *  как обычно полный (по умолчанию false). */
  kitchenOnly?: boolean;
  /** стартовая категория при открытии магазина из сценария/события */
  initialCategory?: ShopCategoryId;
  onProductPurchased?: (product: ShopProduct) => void;
}

export default function Shop({
  bottomInset = 0,
  coins,
  ownedRoomIds,
  onClose,
  onRoomSelect,
  onOpenEarnModal,
  confirmationEnabled = true,
  kitchenOnly = false,
  initialCategory,
  onProductPurchased,
}: Props) {
  const categories = kitchenOnly ? CATEGORIES.filter((c) => c.id === 'food' || c.id === 'interior') : CATEGORIES;
  const [category, setCategory] = useState<ShopCategoryId>(initialCategory ?? 'food');
  // Подраздел вкладки «Интерьер» — игровая (обычные комнаты) или кухня (столовая).
  // В режиме kitchenOnly выбора нет — всегда кухня.
  const [interiorSection, setInteriorSection] = useState<RoomSection>(kitchenOnly ? 'kitchen' : 'playroom');
  const [entered, setEntered] = useState(false);
  const ownedProductIds = useInventoryStore((s) => s.ownedProductIds);
  const foodQty = useInventoryStore((s) => s.foodQty);
  const selectedGoalId = useEconomyStore((s) => s.savingsGoal?.id);
  const withdrawFromSavings = useEconomyStore((s) => s.withdrawFromSavings);
  const products = category === 'interior' ? [] : productsByCategory(category);
  const interiorRooms = roomsBySection(kitchenOnly ? 'kitchen' : interiorSection);
  // Подтверждение покупки включено для всего каталога, включая еду.
  const [confirmProduct, setConfirmProduct] = useState<ShopProduct | null>(null);
  const [shortfallProduct, setShortfallProduct] = useState<ShopProduct | null>(null);

  function handleBuy(product: ShopProduct, savingsContribution = 0) {
    const result = purchaseProduct(product, { savingsContribution });
    if (result === 'ok') onProductPurchased?.(product);
  }

  function requestBuy(product: ShopProduct) {
    // Еда — расходник, покупается сколько угодно раз (запас копится); остальное — один раз.
    if (product.category !== 'food' && ownedProductIds.includes(product.id)) return;
    const funding = getProductPurchaseFunding(product);
    // Сначала расходуется остаток категории, выбранный при распределении.
    // Любая недостающая часть требует отдельного согласия взять накопления.
    if (funding.savingsNeeded > 0) {
      if (funding.canUseSavings) setShortfallProduct(product);
      else onOpenEarnModal?.();
      return;
    }
    // Любая покупка, включая еду, проходит подтверждение. Отключить его можно
    // только явной настройкой родительского режима.
    if (!confirmationEnabled) {
      handleBuy(product);
    } else {
      setConfirmProduct(product);
    }
  }

  // фото шапки проявляется, кремовый лист выезжает снизу
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка с иллюстрацией магазина */}
      <div
        className="relative h-[170px] shrink-0 overflow-hidden bg-[#6d5a63] transition-opacity duration-500"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '68% 40%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(64,48,58,0.92) 0%, rgba(64,48,58,0.70) 42%, rgba(64,48,58,0) 68%)',
          }}
        />

        {/* pt заменён на calc с env(safe-area-inset-top) — на телефонах с "чёлкой"/
            статус-баром кнопка иначе оказывается под системным интерфейсом и не нажимается. */}
        <div
          className="safe-area-topbar relative flex items-start justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        >
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-1.5 backdrop-blur-md"
            style={{
              background: 'rgba(26,20,40,0.30)',
              borderColor: 'rgba(255,255,255,0.30)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            }}
          >
            <img src={coinIcon} alt="" className="h-[22px] w-[22px]" />
            <span className="text-[15px] font-bold leading-none text-white">{coins}</span>
            <button
              onClick={onOpenEarnModal}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition active:scale-95"
              style={{ background: VIOLET }}
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-3 px-4">
          <div className="flex items-center gap-2">
            <img src={titleBag} alt="" className="h-[22px] w-auto" />
            <h1
              className="text-[26px] font-extrabold leading-none text-white"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}
            >
              Магазин
            </h1>
          </div>
          <p
            className="mt-1.5 whitespace-pre-line text-[13px] font-semibold leading-tight text-white/95"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {'Покупай полезные вещи\nдля своего питомца!'}
          </p>
        </div>
      </div>

      {/* Кремовый лист поверх шапки */}
      <div
        className="-mt-5 flex-1 overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-4 pt-3 transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Полоса категорий — единый блок с разделителями, как в макете.
            С кухни (kitchenOnly) видно только «Еду» и «Интерьер». */}
        <div data-tour="shop-categories" className="flex overflow-hidden rounded-[20px] bg-white/60 p-1.5">
          {categories.map(({ id, label, icon }, i) => {
            const active = category === id;
            return (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[16px] px-0.5 py-2 transition"
                style={active ? { background: VIOLET, boxShadow: '0 4px 10px rgba(92,90,216,0.30)' } : undefined}
              >
                {!active && i > 0 && (
                  <span className="absolute left-0 top-1/2 h-6 w-px -translate-y-1/2 bg-[#e6d6bf]" />
                )}
                <MaskIcon src={icon} color={active ? '#ffffff' : '#6f6355'} size={22} />
                <span
                  className="whitespace-nowrap text-[8.5px] font-semibold leading-none"
                  style={{ color: active ? '#ffffff' : '#6f6355' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Заголовок подборки */}
        <div className="mt-4 flex items-center">
          <h2 className="text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
            {categories.find((c) => c.id === category)?.label}
          </h2>
        </div>

        {/* Интерьер продаёт фоны комнаты целиком: тап открывает превью с медведем перед покупкой.
            Разделён на подразделы — игровая и кухня (столовая для кормления питомца).
            В режиме kitchenOnly выбора нет (всегда кухня) — переключатель не нужен. */}
        {category === 'interior' && !kitchenOnly && (
          <div className="mt-3 flex gap-2">
            {INTERIOR_SECTIONS.map(({ id, label }) => {
              const active = interiorSection === id;
              return (
                <button
                  key={id}
                  onClick={() => setInteriorSection(id)}
                  className="rounded-full px-3.5 py-1.5 text-[12px] font-bold transition"
                  style={
                    active
                      ? { background: VIOLET, color: '#ffffff', boxShadow: '0 3px 8px rgba(92,90,216,0.28)' }
                      : { background: 'rgba(255,255,255,0.6)', color: '#6f6355' }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {category === 'interior' ? (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {interiorRooms.map((room, idx) => {
              const owned = ownedRoomIds.includes(room.id);
              const isGoal = selectedGoalId === room.id;
              const canAfford = getRoomPurchaseFunding(room).savingsNeeded === 0;
              return (
                <button
                  key={room.id}
                  data-tour={idx === 0 ? 'shop-products' : undefined}
                  onClick={() => onRoomSelect(room)}
                  className="relative flex flex-col overflow-hidden rounded-[18px] border bg-white/85 text-left shadow-sm transition active:scale-[0.98]"
                  style={{ borderColor: '#f0e2cb', opacity: owned || canAfford ? 1 : 0.78 }}
                >
                  <div className="relative h-[150px] w-full overflow-hidden">
                    <img src={room.background} alt="" className="h-full w-full object-cover object-top" />
                    {!owned && (
                      <span
                        className="absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[9px] font-extrabold text-white shadow-sm"
                        style={{ background: isGoal ? '#35b96b' : '#9b73e8' }}
                      >
                        {isGoal ? 'Моя цель' : 'Желание'}
                      </span>
                    )}
                    {owned && (
                      <span
                        className="absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                        style={{ background: 'rgba(70,52,66,0.55)' }}
                      >
                        Твоя
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="min-h-[26px] text-[10.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                      {room.name}
                    </div>
                    <div className="mt-1 min-h-[20px] text-[8.5px] font-semibold leading-tight text-[#8c7d70]">
                      {room.description}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {owned ? (
                        <span className="text-[11px] font-bold" style={{ color: '#7fae6a' }}>
                          Установлена
                        </span>
                      ) : (
                        <>
                          <img src={coinIcon} alt="" className="h-[15px] w-[15px]" />
                          <span className="text-[11.5px] font-bold" style={{ color: '#4a4560' }}>
                            {room.price}
                          </span>
                          <span className="ml-1 text-[9px] font-semibold text-[#5360d9]">{isGoal ? 'из копилки' : 'из бюджета желаний'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            {products.map((p, idx) => {
              const isFood = p.category === 'food';
              const owned = !isFood && ownedProductIds.includes(p.id);
              const qty = foodQty[p.id] ?? 0;
              const meta = toEconomyProductMeta(p);
              const canAfford = getProductPurchaseFunding(p).savingsNeeded === 0;
              const badge = meta.expenseType === 'mandatory' ? 'Обязательное' : meta.expenseType === 'goal' ? 'Моя цель' : 'Желание';
              return (
                <button
                  key={p.id}
                  data-tour={idx === 0 ? 'shop-products' : undefined}
                  onClick={() => {
                    if (!owned) requestBuy(p);
                  }}
                  disabled={owned}
                  className="relative flex flex-col rounded-[18px] border bg-white/85 p-2 text-left shadow-sm transition active:scale-[0.98] disabled:active:scale-100"
                  style={{ borderColor: '#f0e2cb' }}
                >
                  <div className="relative mb-1.5 flex h-[74px] items-center justify-center rounded-[14px] bg-[#faf1e3]">
                    <img src={p.image} alt="" className="max-h-[66px] w-auto object-contain" />
                    <span className="absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[8px] font-extrabold text-white" style={{ background: meta.expenseType === 'mandatory' ? '#f36b76' : meta.expenseType === 'goal' ? '#35b96b' : '#9b73e8' }}>{badge}</span>
                    {isFood && qty > 0 && (
                      <span
                        className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold text-white"
                        style={{ background: 'rgba(70,52,66,0.72)' }}
                      >
                        ×{qty}
                      </span>
                    )}
                  </div>
                  <div
                    className="min-h-[26px] text-[10.5px] font-bold leading-tight"
                    style={{ color: '#2c2a5e' }}
                  >
                    {p.name}
                  </div>
                  <div className="mt-1 min-h-[25px] text-[8.5px] font-semibold leading-tight text-[#8c7d70]">
                    {p.description}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <img src={coinIcon} alt="" className="h-[15px] w-[15px]" />
                    <span className="text-[11.5px] font-bold" style={{ color: '#4a4560' }}>
                      {p.price}
                    </span>
                  </div>
                  <span
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-full py-[5px] text-[11px] font-bold text-white"
                    style={{
                      background: owned ? '#9bd6a8' : canAfford ? VIOLET : '#c9c2d8',
                      boxShadow: owned || !canAfford ? undefined : BTN_SHADOW,
                    }}
                  >
                    {owned ? (
                      <>
                        <IconCheck className="h-3 w-3" /> Куплено
                      </>
                    ) : (
                      'Купить'
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmPurchaseModal
        item={confirmProduct ? {
          name: confirmProduct.name,
          image: confirmProduct.image,
          price: confirmProduct.price,
          source: toEconomyProductMeta(confirmProduct).expenseType === 'goal' ? 'savings' : 'wallet',
          categoryLabel: toEconomyProductMeta(confirmProduct).expenseType === 'mandatory' ? 'Обязательное' : toEconomyProductMeta(confirmProduct).expenseType === 'goal' ? 'Моя цель' : 'Желание',
          description: describeProduct(confirmProduct),
          effects: buildPurchaseEffects(confirmProduct, coins),
        } : null}
        onCancel={() => setConfirmProduct(null)}
        onConfirm={() => {
          if (confirmProduct) handleBuy(confirmProduct);
          setConfirmProduct(null);
        }}
      />

      {shortfallProduct && (
        <div className="absolute inset-0 z-[64] flex items-center justify-center bg-[rgba(20,14,26,0.5)] px-5">
          <div className="w-full rounded-[24px] bg-white p-4 text-center shadow-2xl">
            <h2 className="text-[18px] font-black text-[#111b72]">Использовать накопления?</h2>
            <p className="mt-2 text-[12px] font-semibold leading-snug text-[#777da8]">
              В категории «{getProductPurchaseFunding(shortfallProduct).categoryLabel}» не хватает {getProductPurchaseFunding(shortfallProduct).savingsNeeded} монет.
              Можно взять их из копилки, но хорошо подумай: это твои накопления на важную цель. Точно потратить их сейчас?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setShortfallProduct(null)} className="h-11 rounded-[14px] bg-[#f0eef7] text-[12px] font-extrabold text-[#686d9a]">Отмена</button>
              <button
                onClick={() => {
                  const product = shortfallProduct;
                  const amount = getProductPurchaseFunding(product).savingsNeeded;
                  if (!withdrawFromSavings(amount)) return;
                  setShortfallProduct(null);
                  handleBuy(product, amount);
                }}
                className="h-11 rounded-[14px] text-[12px] font-extrabold text-white"
                style={{ background: VIOLET }}
              >
                Использовать и купить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
