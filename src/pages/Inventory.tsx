import { useEffect, useMemo, useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import catToys from '../assets/icons/shop/cat-toys.png';
import catClothes from '../assets/icons/shop/cat-clothes.png';
import MaskIcon from '../components/MaskIcon';
import { IconArrowLeft, IconBackpackLight, IconCheck } from '../components/icons';
import { shopProducts, type ShopCategoryId } from '../data/shopData';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

// Комнаты сюда не входят — это фон/оформление, а не «товар» в привычном
// смысле; инвентарь показывает только предметы, сгруппированные как в магазине.
// Еда тоже не входит — она расходуется и живёт в подносе «Моя еда» на экране
// «Кухня» (см. Kitchen.tsx), а не в инвентаре как разовая покупка.
const CATEGORIES: { id: Exclude<ShopCategoryId, 'popular' | 'interior' | 'food'>; label: string; icon: string }[] = [
  { id: 'toys', label: 'Игрушки', icon: catToys },
  { id: 'clothes', label: 'Одежда', icon: catClothes },
];

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  ownedProductIds: string[];
  onClose: () => void;
}

/** Инвентарь: товары, уже купленные в магазине, сгруппированные по тем же категориям. */
export default function Inventory({ bottomInset = 0, coins, ownedProductIds, onClose }: Props) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const ownedProducts = useMemo(
    () => shopProducts.filter((p) => ownedProductIds.includes(p.id)),
    [ownedProductIds],
  );

  // Открываем первую категорию, в которой реально что-то есть — если в ней
  // пусто, а в других что-то куплено, показывать пустой экран смысла нет.
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>(() => {
    const firstWithItems = CATEGORIES.find((c) => ownedProducts.some((p) => p.category === c.id));
    return firstWithItems?.id ?? 'toys';
  });

  const products = ownedProducts.filter((p) => p.category === category);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      <div
        className="safe-area-topbar relative shrink-0 overflow-hidden px-4 pb-5 transition-opacity duration-500"
        style={{
          background: '#6d5a63',
          opacity: entered ? 1 : 0,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        }}
      >
        <div className="flex items-start justify-between">
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
            <img src={coinIcon} alt="" className="h-6 w-6" />
            <span className="text-[15px] font-bold leading-none text-white">{coins}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <IconBackpackLight className="h-6 w-6" />
          <h1 className="text-[22px] font-extrabold leading-none text-white">Инвентарь</h1>
        </div>
      </div>

      <div
        className="-mt-1 flex-1 overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-4 pt-3 transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Полоса категорий — тот же вид, что и в магазине */}
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

        <div className="mt-4 flex items-center">
          <h2 className="text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
            {CATEGORIES.find((c) => c.id === category)?.label}
          </h2>
        </div>

        {products.length === 0 ? (
          <p className="mt-3 text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
            Пока пусто — загляни в магазин и купи что-нибудь для питомца, покупки появятся здесь.
          </p>
        ) : (
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="relative flex flex-col rounded-[17px] border bg-white/85 p-1.5 shadow-sm"
                style={{ borderColor: '#f0e2cb' }}
              >
                <div className="relative mb-1.5 flex h-[70px] items-center justify-center rounded-[13px] bg-[#faf1e3]">
                  <img src={p.image} alt="" className="max-h-[63px] w-auto object-contain" />
                </div>
                <div className="min-h-[24px] text-[10px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                  {p.name}
                </div>
                <div
                  className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-full py-[4px] text-[10.5px] font-bold text-white"
                  style={{ background: '#9bd6a8' }}
                >
                  <IconCheck className="h-3 w-3" /> Куплено
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
