import bearFull from '../assets/pet/bear-main.png';
import bearSilhouette from '../assets/pet/bear-main-trim.png';
import coinIcon from '../assets/icons/coin.png';
import { IconArrowLeft } from '../components/icons';
import type { RoomProduct } from '../data/shopData';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

interface Props {
  room: RoomProduct;
  coins: number;
  /** уже куплена игроком (независимо от статического поля room.owned) */
  owned: boolean;
  /** прямо сейчас стоит в комнате питомца */
  active: boolean;
  onBack: () => void;
  /** купить/установить — компонент сам решает по owned/active, что означает нажатие */
  onBuy: (room: RoomProduct) => void;
}

/**
 * Предпросмотр комнаты перед покупкой: главный экран без интерфейса —
 * только питомец на новом фоне и кнопка покупки.
 */
export default function RoomPreview({ room, coins, owned, active, onBack, onBuy }: Props) {
  const enough = coins >= room.price;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#b9835a]">
      <img src={room.background} alt="" className="absolute inset-0 h-full w-full object-cover object-bottom" />

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

      {/* Питомец на новом фоне — тот же масштаб и тень, что и на главном экране */}
      <div className="absolute inset-x-0 bottom-[190px] top-[76px]">
        <div className="relative h-full w-full">
          <img
            src={bearSilhouette}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute left-1/2 h-[58%] w-auto select-none"
            style={{
              bottom: '6.6%',
              transformOrigin: 'bottom center',
              transform: 'translateX(-52%) scaleY(-0.18) skewX(-22deg)',
              filter: 'brightness(0) blur(5px)',
              opacity: 0.5,
            }}
          />
          {/* Плотное касание прямо под лапами — как на главном экране, сдвинуто к центру ковра */}
          <div
            className="absolute bottom-[4.4%] left-1/2 h-[14px] w-[100px] rounded-[50%]"
            style={{
              transform: 'translateX(-52%)',
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(20,10,2,0.55) 0%, rgba(20,10,2,0.28) 50%, rgba(20,10,2,0) 76%)',
              filter: 'blur(3px)',
            }}
          />
          <img
            src={bearFull}
            alt=""
            draggable={false}
            className="pointer-events-none absolute bottom-0 left-1/2 h-[62%] w-auto -translate-x-1/2 select-none object-contain drop-shadow-2xl"
          />
        </div>
      </div>

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
            onClick={() => onBuy(room)}
            disabled={active || (!owned && !enough)}
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
    </div>
  );
}
