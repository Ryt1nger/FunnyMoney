import { useEffect, useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import { IconArrowLeft, IconCart } from '../components/icons';
import { shopProducts, rooms } from '../data/shopData';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  ownedProductIds: string[];
  ownedRoomIds: string[];
  activeRoomId: string;
  onClose: () => void;
}

/** Инвентарь: всё, что уже куплено в магазине — товары и фоны комнат. */
export default function Inventory({
  bottomInset = 0,
  coins,
  ownedProductIds,
  ownedRoomIds,
  activeRoomId,
  onClose,
}: Props) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const ownedProducts = shopProducts.filter((p) => ownedProductIds.includes(p.id));
  const ownedRooms = rooms.filter((r) => ownedRoomIds.includes(r.id));

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      <div
        className="relative shrink-0 overflow-hidden px-4 pb-4 pt-4 transition-opacity duration-500"
        style={{ background: '#6d5a63', opacity: entered ? 1 : 0 }}
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
          <IconCart className="h-6 w-6 text-white" />
          <h1 className="text-[22px] font-extrabold leading-none text-white">Инвентарь</h1>
        </div>
      </div>

      <div
        className="-mt-3 flex-1 overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-4 pt-4 transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <h2 className="text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Комнаты
        </h2>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          {ownedRooms.map((room) => (
            <div
              key={room.id}
              className="relative flex flex-col overflow-hidden rounded-[18px] border bg-white/85 text-left shadow-sm"
              style={{ borderColor: '#f0e2cb' }}
            >
              <div className="relative h-[100px] w-full overflow-hidden">
                <img src={room.background} alt="" className="h-full w-full object-cover object-top" />
                {room.id === activeRoomId && (
                  <span
                    className="absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
                    style={{ background: VIOLET }}
                  >
                    Активна
                  </span>
                )}
              </div>
              <div className="p-2 text-[11px] font-bold" style={{ color: '#2c2a5e' }}>
                {room.name}
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-5 text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Товары
        </h2>
        {ownedProducts.length === 0 ? (
          <p className="mt-2 text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
            Пока пусто — загляни в магазин и купи что-нибудь для питомца, покупки появятся здесь.
          </p>
        ) : (
          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            {ownedProducts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-[18px] border bg-white/85 p-2 shadow-sm"
                style={{ borderColor: '#f0e2cb' }}
              >
                <div className="relative mb-1.5 flex h-[70px] items-center justify-center rounded-[14px] bg-[#faf1e3]">
                  <img src={p.image} alt="" className="max-h-[62px] w-auto object-contain" />
                </div>
                <div className="min-h-[26px] text-[10.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                  {p.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
