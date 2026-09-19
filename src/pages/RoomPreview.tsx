import { useEffect, useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import { IconArrowLeft, IconChevronLeft, IconChevronRight } from '../components/icons';
import type { RoomProduct } from '../data/shopData';
import ConfirmPurchaseModal from '../components/ConfirmPurchaseModal';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

interface Props {
  /** все комнаты интерьера — переключаемся между ними стрелками, не выходя из просмотра */
  rooms: RoomProduct[];
  /** с какой комнаты открыли просмотр (тап по карточке в магазине) */
  initialRoomId: string;
  coins: number;
  ownedRoomIds: string[];
  /** прямо сейчас стоит в комнате питомца */
  activeRoomId: string;
  onBack: () => void;
  /** купить/установить — компонент сам решает по owned/active, что означает нажатие */
  onBuy: (room: RoomProduct) => void;
  /** плюсик у баланса — то же окно "как заработать монеты", что и на главной;
   * открывается вместо покупки, если монет не хватает */
  onOpenEarnModal?: () => void;
  /** родительский контроль (родительский кабинет): если выключено — покупка
   * комнаты проходит сразу, без окна "точно купить?" */
  confirmationEnabled?: boolean;
}

/**
 * Фон комнаты со сменой через fade — тот же приём "entered", что и в остальных
 * экранах (opacity 0→1 через rAF), только перезапускается при смене src.
 */
function RoomBackground({ src }: { src: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, [src]);

  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-300"
      style={{ opacity: show ? 1 : 0 }}
    />
  );
}

/**
 * Предпросмотр комнаты перед покупкой: только фон комнаты и кнопка покупки.
 * Фоны листаются стрелками влево/вправо по кругу, как карусель, не закрывая просмотр.
 */
export default function RoomPreview({
  rooms,
  initialRoomId,
  coins,
  ownedRoomIds,
  activeRoomId,
  onBack,
  onBuy,
  onOpenEarnModal,
  confirmationEnabled = true,
}: Props) {
  const [index, setIndex] = useState(() => {
    const i = rooms.findIndex((r) => r.id === initialRoomId);
    return i >= 0 ? i : 0;
  });

  const room = rooms[index];
  const owned = ownedRoomIds.includes(room.id);
  const active = activeRoomId === room.id;
  const enough = coins >= room.price;
  // Подтверждение — только для реальной покупки новой комнаты, а не для
  // "Установить" уже купленную (это не трата монет, спрашивать не о чем).
  const [confirmOpen, setConfirmOpen] = useState(false);

  const go = (delta: number) => {
    setIndex((i) => (i + delta + rooms.length) % rooms.length);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#b9835a]">
      <RoomBackground src={room.background} />

      {/* Верхняя строка: назад, название комнаты и баланс монет */}
      <div className="relative flex items-center gap-3 px-4 pt-5">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <div
          className="min-w-0 flex-1 rounded-full border px-3.5 py-1.5 backdrop-blur-md"
          style={{
            background: 'rgba(26,20,40,0.30)',
            borderColor: 'rgba(255,255,255,0.30)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          }}
        >
          <div className="truncate text-[13px] font-bold leading-none text-white">{room.name}</div>
          <div className="mt-0.5 truncate text-[10px] leading-none text-white/75">Так будет выглядеть комната</div>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2.5 backdrop-blur-md"
          style={{
            background: 'rgba(26,20,40,0.30)',
            borderColor: 'rgba(255,255,255,0.30)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          }}
        >
          <img src={coinIcon} alt="" className="h-[22px] w-[22px]" />
          <span className="text-[15px] font-bold leading-none text-white">{coins}</span>
        </div>
      </div>

      {/* Точки-индикатор — какая комната сейчас показана */}
      {rooms.length > 1 && (
        <div className="relative z-10 mt-2.5 flex items-center justify-center gap-1.5">
          {rooms.map((r, i) => (
            <span
              key={r.id}
              className="h-[6px] rounded-full transition-all"
              style={{
                width: i === index ? 16 : 6,
                background: i === index ? '#ffffff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* Стрелки карусели — листаем фоны по кругу, не выходя из просмотра */}
      {rooms.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Предыдущая комната"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-90"
          >
            <IconChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Следующая комната"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-90"
          >
            <IconChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Покупка */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-5">
        <div className="rounded-[22px] bg-white/92 p-3 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                {room.name}
              </div>
              <div className="text-[11.5px] leading-tight" style={{ color: '#7b7a8c' }}>
                {room.description}
              </div>
            </div>
            {!owned && (
              <div className="flex shrink-0 items-center gap-1">
                <img src={coinIcon} alt="" className="h-[18px] w-[18px]" />
                <span className="text-[15px] font-bold" style={{ color: '#4a4560' }}>
                  {room.price}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (active) return;
              if (owned) {
                onBuy(room);
                return;
              }
              // Не хватает монет — вместо попытки покупки показываем то же
              // окно "как заработать монеты", что и по кнопке "+" у баланса.
              if (!enough) {
                onOpenEarnModal?.();
                return;
              }
              if (confirmationEnabled) {
                setConfirmOpen(true);
              } else {
                onBuy(room);
              }
            }}
            disabled={active}
            className="mt-2.5 w-full rounded-full py-2.5 text-[14px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.99] disabled:opacity-60"
            style={{
              background: active || (!owned && !enough) ? 'linear-gradient(180deg, #b9b6c9 0%, #9d9ab0 100%)' : VIOLET,
              boxShadow:
                active || (!owned && !enough)
                  ? 'none'
                  : 'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
            }}
          >
            {active ? 'Уже установлена' : owned ? 'Установить' : enough ? 'Купить комнату' : 'Не хватает монет'}
          </button>
        </div>
      </div>

      <ConfirmPurchaseModal
        item={confirmOpen ? { name: room.name, image: room.background, price: room.price } : null}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onBuy(room);
        }}
      />
    </div>
  );
}
