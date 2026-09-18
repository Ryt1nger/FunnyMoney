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
import { productsByCategory, rooms, type RoomProduct, type ShopCategoryId, type ShopProduct } from '../data/shopData';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { purchaseProduct } from '../features/economy/purchase';
import ConfirmPurchaseModal from '../components/ConfirmPurchaseModal';

const CATEGORIES: { id: ShopCategoryId; label: string; icon: string }[] = [
  { id: 'food', label: 'Еда', icon: catFood },
  { id: 'toys', label: 'Игрушки', icon: catToys },
  { id: 'clothes', label: 'Одежда', icon: catClothes },
  { id: 'interior', label: 'Интерьер', icon: catInterior },
];

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const BTN_SHADOW =
  'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)';

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  ownedRoomIds: string[];
  onClose: () => void;
  /** открыть просмотр комнаты перед покупкой — категория «Интерьер» продаёт фоны, а не мелкие предметы */
  onRoomSelect: (room: RoomProduct) => void;
}

export default function Shop({ bottomInset = 0, coins, ownedRoomIds, onClose, onRoomSelect }: Props) {
  const [category, setCategory] = useState<ShopCategoryId>('food');
  const [entered, setEntered] = useState(false);
  const ownedProductIds = useInventoryStore((s) => s.ownedProductIds);
  const products = category === 'interior' ? [] : productsByCategory(category);
  // Подтверждение покупки — для всего, кроме еды (см. запрос: "уведомление
  // при покупке чего угодно кроме еды"). Еда покупается сразу, без лишнего клика.
  const [confirmProduct, setConfirmProduct] = useState<ShopProduct | null>(null);

  function handleBuy(product: ShopProduct) {
    purchaseProduct(product); // 'ok' | 'already_owned' | 'insufficient_funds' — кнопка сама отражает итог по инвентарю/балансу
  }

  function requestBuy(product: ShopProduct) {
    if (product.category === 'food') {
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

        <div className="relative flex items-start justify-between px-4 pt-4">
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
        {/* Полоса категорий — единый блок с разделителями, как в макете */}
        <div className="flex overflow-hidden rounded-[20px] bg-white/60 p-1.5">
          {CATEGORIES.map(({ id, label, icon }, i) => {
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
            {CATEGORIES.find((c) => c.id === category)?.label}
          </h2>
        </div>

        {/* Интерьер продаёт фоны комнаты целиком: тап открывает превью с медведем перед покупкой */}
        {category === 'interior' ? (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {rooms.map((room) => {
              const owned = ownedRoomIds.includes(room.id);
              return (
                <button
                  key={room.id}
                  onClick={() => onRoomSelect(room)}
                  className="relative flex flex-col overflow-hidden rounded-[18px] border bg-white/85 text-left shadow-sm transition active:scale-[0.98]"
                  style={{ borderColor: '#f0e2cb' }}
                >
                  <div className="relative h-[150px] w-full overflow-hidden">
                    <img src={room.background} alt="" className="h-full w-full object-cover object-top" />
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
            {products.map((p) => {
              const owned = ownedProductIds.includes(p.id);
              const canAfford = coins >= p.price;
              return (
                <div
                  key={p.id}
                  className="relative flex flex-col rounded-[18px] border bg-white/85 p-2 shadow-sm"
                  style={{ borderColor: '#f0e2cb' }}
                >
                  <div className="relative mb-1.5 flex h-[74px] items-center justify-center rounded-[14px] bg-[#faf1e3]">
                    <img src={p.image} alt="" className="max-h-[66px] w-auto object-contain" />
                  </div>
                  <div
                    className="min-h-[26px] text-[10.5px] font-bold leading-tight"
                    style={{ color: '#2c2a5e' }}
                  >
                    {p.name}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <img src={coinIcon} alt="" className="h-[15px] w-[15px]" />
                    <span className="text-[11.5px] font-bold" style={{ color: '#4a4560' }}>
                      {p.price}
                    </span>
                  </div>
                  <button
                    onClick={() => !owned && requestBuy(p)}
                    disabled={owned || !canAfford}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-full py-[5px] text-[11px] font-bold text-white transition active:translate-y-[1px] active:scale-[0.98] disabled:active:translate-y-0 disabled:active:scale-100"
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
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmPurchaseModal
        item={confirmProduct ? { name: confirmProduct.name, image: confirmProduct.image, price: confirmProduct.price } : null}
        onCancel={() => setConfirmProduct(null)}
        onConfirm={() => {
          if (confirmProduct) handleBuy(confirmProduct);
          setConfirmProduct(null);
        }}
      />
    </div>
  );
}
