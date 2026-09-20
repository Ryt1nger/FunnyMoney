import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import bearFull from '../assets/pet/bear-main.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import levelFlower from '../assets/ui/level-flower.png';
import coinIcon from '../assets/icons/coin.png';
import heartMetricIcon from '../assets/icons/metrics/heart-3d.png';
import smileMetricIcon from '../assets/icons/metrics/smile-3d.png';
import coinsMetricIcon from '../assets/icons/metrics/coins-3d.png';
import GlassMetric from '../components/GlassMetric';
import {
  IconArrowLeft,
  IconPlus,
  IconChevronRight,
  IconHome,
  IconCart,
  IconHeart,
  IconSmile,
} from '../components/icons';
import { rooms, roomsBySection, shopProducts, type ShopProduct } from '../data/shopData';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { feedPet } from '../features/economy/purchase';
import { hapticTap } from '../services/haptics';
import { playFeedCrunchSound } from '../services/feedSound';

// Фон кухни по умолчанию — если своя кухня ещё не куплена/не установлена,
// показываем первую из каталога (см. shopData: rooms, section 'kitchen').
const DEFAULT_KITCHEN_BG = roomsBySection('kitchen')[0].background;

// Свайп вверх по кухне (не по еде) — открыть магазин.
const SWIPE_UP_THRESHOLD = 70;

interface Props {
  bottomInset?: number;
  coins: number;
  level: number;
  xp: number;
  xpToNext: number;
  petName: string;
  health: number;
  happiness: number;
  wealth: number;
  activeKitchenRoomId: string;
  onOpenEarnModal?: () => void;
  onOpenProgress: () => void;
  /** Иконка-корзинка под метриками — открывает магазин сразу на разделе «Еда». */
  onOpenShop: () => void;
  onClose: () => void;
}

interface DragState {
  product: ShopProduct;
  x: number;
  y: number;
}

/**
 * Экран «Кухня» — отдельный от главного экрана: интерьер кухни виден только
 * здесь (см. purchaseRoom/inventoryStore — activeKitchenRoomId никогда не
 * попадает в activeRoomId, который читает Home). Кормление — перетаскивание
 * карточки еды на медведя (pointer capture, без сторонних библиотек DnD).
 */
export default function Kitchen({
  bottomInset = 0,
  coins,
  level,
  xp,
  xpToNext,
  petName,
  health,
  happiness,
  wealth,
  activeKitchenRoomId,
  onOpenEarnModal,
  onOpenProgress,
  onOpenShop,
  onClose,
}: Props) {
  const foodQty = useInventoryStore((s) => s.foodQty);
  const foodItems = shopProducts
    .filter((p) => p.category === 'food' && (foodQty[p.id] ?? 0) > 0)
    .map((product) => ({ product, qty: foodQty[product.id] ?? 0 }));

  const [drag, setDrag] = useState<DragState | null>(null);
  const bearZoneRef = useRef<HTMLDivElement>(null);
  // Корень экрана — плавающая копия карточки координируется относительно него
  // (position: absolute), а не относительно окна (position: fixed): Kitchen
  // рендерится внутри шторки BottomSheet, у которой есть CSS transform
  // (анимация выезда) — transform на предке создаёт свой containing block
  // для fixed-элементов, и вместе с overflow-hidden на той же шторке это
  // обрезало/прятало fixed-плашку. absolute от собственного корня от этой
  // проблемы не зависит.
  const rootRef = useRef<HTMLDivElement>(null);
  // Свайп вверх по кухне (кроме перетаскивания еды — те карточки сами
  // останавливают всплытие своего pointerdown, см. ниже) открывает магазин.
  const swipeUpRef = useRef<{ startX: number; startY: number } | null>(null);

  const background =
    rooms.find((r) => r.id === activeKitchenRoomId)?.background ?? DEFAULT_KITCHEN_BG;

  const xpPercent = Math.min(100, Math.round((xp / xpToNext) * 100));

  function toLocalPoint(clientX: number, clientY: number) {
    const rect = rootRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }

  function handleRootPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    swipeUpRef.current = { startX: e.clientX, startY: e.clientY };
  }

  function handleRootPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const start = swipeUpRef.current;
    swipeUpRef.current = null;
    if (!start) return;
    const dy = start.startY - e.clientY; // положительно — свайп вверх
    const dx = Math.abs(e.clientX - start.startX);
    if (dy > SWIPE_UP_THRESHOLD && dy > dx) onOpenShop();
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>, product: ShopProduct) {
    // Не даём жесту всплыть выше — иначе шторка (BottomSheet) может принять
    // перетаскивание еды за свайп вниз/вверх по разделу.
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ product, ...toLocalPoint(e.clientX, e.clientY) });
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    setDrag((d) => (d ? { ...d, ...toLocalPoint(e.clientX, e.clientY) } : d));
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    setDrag((current) => {
      if (!current) return null;
      const rect = bearZoneRef.current?.getBoundingClientRect();
      if (
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const ok = feedPet(current.product);
        if (ok) {
          hapticTap();
          playFeedCrunchSound();
        }
      }
      return null;
    });
  }

  return (
    <div
      ref={rootRef}
      onPointerDown={handleRootPointerDown}
      onPointerUp={handleRootPointerUp}
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#b9835a]"
    >
      <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover object-bottom" />

      {/* Шапка — тот же вид, что и на главной: аватар/уровень, монеты; плюс кнопка назад. */}
      <div
        className="relative z-20 flex items-start gap-2 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <button
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          aria-label="Назад"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>

        <button
          onClick={onOpenProgress}
          className="flex min-w-0 flex-1 items-center rounded-2xl py-0.5 pr-1 transition active:scale-[0.97]"
          aria-label="Открыть прогресс уровня"
        >
          <div className="relative shrink-0">
            <img
              src={bearAvatar}
              alt={petName}
              className="h-[44px] w-[44px] rounded-full border-2 border-white object-cover shadow-lg"
            />
            <div className="absolute -right-[13px] top-1/2 flex h-[20px] w-[20px] -translate-y-1/2 items-center justify-center drop-shadow">
              <img src={levelFlower} alt="" className="absolute inset-0 h-full w-full" />
              <span className="relative text-[9.5px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {level}
              </span>
            </div>
          </div>

          <div className="ml-[24px] min-w-0">
            <div
              className="truncate text-[13px] font-bold leading-none text-white"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.45)' }}
            >
              {petName}
            </div>
            <div
              className="mt-1.5 h-[8px] w-[92px] overflow-hidden rounded-full"
              style={{ background: 'rgba(18,16,32,0.42)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${xpPercent}%`,
                  background: 'linear-gradient(180deg, #8b88f4 0%, #6a62ea 100%)',
                }}
              />
            </div>
          </div>

          <IconChevronRight className="ml-1 h-3.5 w-3.5 shrink-0 self-center text-white drop-shadow" style={{ opacity: 0.85 }} />
        </button>

        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pl-2.5 pr-1.5 backdrop-blur-md"
          style={{
            background: 'rgba(26,20,40,0.30)',
            borderColor: 'rgba(255,255,255,0.30)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          }}
        >
          <img src={coinIcon} alt="" className="h-[20px] w-[20px]" />
          <span className="text-[14px] font-bold leading-none text-white">{coins}</span>
          <button
            onClick={onOpenEarnModal}
            className="flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md transition active:scale-95"
            style={{ background: 'linear-gradient(180deg, #7c74f5 0%, #5b4de0 100%)' }}
          >
            <IconPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Метрики — как на главной */}
      <div className="relative z-20 mt-3 flex items-center gap-2.5 px-4">
        <GlassMetric
          icon={<img src={heartMetricIcon} alt="" className="h-full w-full object-contain" />}
          iconGradient="transparent"
          label="Здоровье"
          value={health}
          barGradient="linear-gradient(90deg, #fb7f92 0%, #ef4060 100%)"
        />
        <GlassMetric
          icon={<img src={smileMetricIcon} alt="" className="h-full w-full object-contain" />}
          iconGradient="transparent"
          label="Счастье"
          value={happiness}
          barGradient="linear-gradient(90deg, #f9cb63 0%, #efa622 100%)"
        />
        <GlassMetric
          icon={<img src={coinsMetricIcon} alt="" className="h-full w-full object-contain" />}
          iconGradient="transparent"
          label="Богатство"
          value={wealth}
          barGradient="linear-gradient(90deg, #63d98b 0%, #21a44f 100%)"
        />
      </div>

      {/* Вместо настроек/инвентаря на кухне — переход в магазин на раздел «Еда»
          (корзинка, слева) и переход обратно в игровую (домик, справа).
          Тот же стиль кнопки, что и на главной. */}
      <div className="relative z-20 mt-2 flex items-center justify-between px-4">
        <button
          onClick={onOpenShop}
          className="flex h-11 w-11 items-center justify-center rounded-full border text-white backdrop-blur-md transition active:scale-95"
          style={{
            background: 'rgba(26,20,40,0.30)',
            borderColor: 'rgba(255,255,255,0.30)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          }}
          aria-label="Магазин еды"
        >
          <IconCart className="h-6 w-6" />
        </button>
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full border text-white backdrop-blur-md transition active:scale-95"
          style={{
            background: 'rgba(26,20,40,0.30)',
            borderColor: 'rgba(255,255,255,0.30)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          }}
          aria-label="В игровую"
        >
          <IconHome className="h-6 w-6" />
        </button>
      </div>

      {/* Медведь — цель перетаскивания еды. Вся зона (не только силуэт) считается
          «попаданием», чтобы кормление не требовало ювелирной точности от ребёнка.
          Поза статична (без анимации смены при кормлении) — по просьбе: медведь
          остаётся в том же виде, что и сейчас. */}
      <div ref={bearZoneRef} className="relative z-0 min-h-0 flex-1">
        <div className="absolute left-1/2 top-[8%] z-10 -translate-x-1/2 rounded-[18px] bg-white px-3.5 py-2 shadow-lg">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
            <IconHeart className="h-4 w-4" style={{ color: '#ef4060' }} />
            Покорми меня!
          </div>
          <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-white" />
        </div>

        {/* Размер — в vh (доле высоты экрана), а не в % от этой flex-зоны:
            высота подноса «Моя еда» под ним авто-подстраивается под контент
            (см. ниже), из-за чего flex-зона медведя может слегка «дышать» —
            в vh-единицах медведь от этого не меняется в размере (как и на
            главной, где он тоже не зависит от соседних блоков). */}
        <img
          src={bearFull}
          alt={petName}
          draggable={false}
          className="pointer-events-none absolute bottom-0 left-1/2 h-[38vh] w-auto -translate-x-1/2 select-none object-contain drop-shadow-2xl"
        />
      </div>

      {/* Поднос «Моя еда» — короткая шторка снизу с горизонтальной лентой еды.
          Высота — по контенту (не в % экрана), чтобы карточки никогда не
          обрезались нижней навигацией на разных размерах экрана. */}
      <div
        className="relative z-20 shrink-0 rounded-t-[26px] bg-[#fbefe1] px-4 pt-2 shadow-[0_-6px_20px_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: bottomInset + 14 }}
      >
        <div className="mx-auto h-[4px] w-[38px] rounded-full" style={{ background: '#e6d6bf' }} />

        <h2 className="mt-2 text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Моя еда
        </h2>

        {foodItems.length === 0 ? (
          <p className="mt-3 text-[12px] leading-snug" style={{ color: '#7b7a8c' }}>
            Еды пока нет — загляни в магазин и купи что-нибудь для {petName}.
          </p>
        ) : (
          <div className="mt-2.5 flex touch-pan-x gap-2 overflow-x-auto pb-1">
            {foodItems.map(({ product, qty }) => (
              <div
                key={product.id}
                onPointerDown={(e) => handlePointerDown(e, product)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => setDrag(null)}
                className="relative flex w-[84px] shrink-0 touch-none select-none flex-col items-center rounded-[16px] border bg-white/90 p-1.5 shadow-sm"
                style={{
                  borderColor: '#f0e2cb',
                  opacity: drag?.product.id === product.id ? 0.35 : 1,
                }}
              >
                <span
                  className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white"
                  style={{ background: 'rgba(70,52,66,0.72)' }}
                >
                  ×{qty}
                </span>
                <img src={product.image} alt="" draggable={false} className="h-[42px] w-auto object-contain" />
                <div className="mt-1 flex items-center gap-1.5">
                  {!!product.effects?.health && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: '#ef4060' }}>
                      <IconHeart className="h-2.5 w-2.5" />+{product.effects.health}
                    </span>
                  )}
                  {!!product.effects?.happiness && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: '#efa622' }}>
                      <IconSmile className="h-2.5 w-2.5" />+{product.effects.happiness}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Плавающая копия карточки — следует за пальцем/курсором поверх экрана кухни.
          absolute от rootRef, а не fixed от окна — см. комментарий у rootRef выше. */}
      {drag && (
        <img
          src={drag.product.image}
          alt=""
          draggable={false}
          className="pointer-events-none absolute z-[999] h-[60px] w-[60px] object-contain drop-shadow-2xl"
          style={{ left: drag.x - 30, top: drag.y - 60, transform: 'scale(1.1)' }}
        />
      )}
    </div>
  );
}
