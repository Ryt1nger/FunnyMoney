import { useEffect, useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import { playPurchaseSound } from '../services/soundEffects';
import { hapticSuccess } from '../services/haptics';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const BTN_SHADOW =
  'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)';

// Те же тайминги/кривая, что и в EarnCoinsModal — одинаковый почерк анимации
// у всех модалок приложения.
const TRANSITION_MS = 380;
const EASE = 'cubic-bezier(0.25, 0.8, 0.25, 1)';
const BACKDROP_BLUR_PX = 2;

interface Props {
  /** null — окно закрыто; объект — что подтверждаем купить */
  item: { name: string; image: string; price: number; source?: 'wallet' | 'savings'; categoryLabel?: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Подтверждение покупки — "точно хотите купить?" с ценой на кнопке.
 * Визуально и по анимации — копия EarnCoinsModal (тот же контейнер, тот же
 * двойной rAF на вход/выход, та же кривая), чтобы все модалки в приложении
 * выглядели и двигались одинаково.
 */
export default function ConfirmPurchaseModal({ item, onCancel, onConfirm }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  // Запоминаем последний показанный товар отдельно от `item`, чтобы во время
  // анимации закрытия (item уже null) карточка не успевала мигнуть пустым контентом.
  const [lastItem, setLastItem] = useState(item);

  useEffect(() => {
    if (item) {
      setLastItem(item);
      setMounted(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [item]);

  if (!mounted || !lastItem) return null;

  function confirm() {
    // Настоящий отклик на покупку — более чёткий "звон монеты" и вибро (оба
    // гейтятся своими настройками внутри сервисов, здесь проверять не нужно).
    playPurchaseSound();
    hapticSuccess();
    onConfirm();
  }

  return (
    <div className="absolute inset-0 z-[65]">
      <div
        onClick={onCancel}
        className="absolute inset-0"
        style={{
          background: 'rgba(20,14,26,0.5)',
          backdropFilter: `blur(${shown ? BACKDROP_BLUR_PX : 0}px)`,
          WebkitBackdropFilter: `blur(${shown ? BACKDROP_BLUR_PX : 0}px)`,
          opacity: shown ? 1 : 0,
          transition: `opacity ${TRANSITION_MS}ms ${EASE}, -webkit-backdrop-filter ${TRANSITION_MS}ms ease, backdrop-filter ${TRANSITION_MS}ms ease`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-7">
        <div
          className="relative w-full max-w-[300px] rounded-[28px] p-5 pt-6 shadow-2xl"
          style={{
            background: '#fbefe1',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 24px 48px rgba(20,10,30,0.35), 0 4px 14px rgba(20,10,30,0.18)',
            transform: shown ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(14px)',
            opacity: shown ? 1 : 0,
            transition: `transform ${TRANSITION_MS}ms ${EASE}, opacity ${TRANSITION_MS}ms ease`,
          }}
        >
          <button
            onClick={onCancel}
            aria-label="Отмена"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#a19cb0] transition active:scale-90"
            style={{ background: 'rgba(120,110,150,0.10)' }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>

          <div className="flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(180deg, #fde3a7 0%, #f7c463 100%)',
                boxShadow: '0 8px 18px rgba(239,166,34,0.38), inset 0 2px 3px rgba(255,255,255,0.6)',
              }}
            >
              <img src={lastItem.image} alt="" className="h-11 w-11 object-contain drop-shadow" />
            </div>
          </div>

          <h2 className="mt-3.5 text-center text-[18px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
            Точно хотите купить?
          </h2>
          <p className="mt-1.5 px-1 text-center text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
            {lastItem.name}
          </p>

          {lastItem.categoryLabel && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-[#5c62c9]">
              <span className="rounded-full bg-[#e9e7ff] px-2.5 py-1">{lastItem.categoryLabel}</span>
              {lastItem.source === 'savings' && <span className="rounded-full bg-[#e8f8ed] px-2.5 py-1 text-[#149456]">из копилки</span>}
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={confirm}
              // У кнопки уже есть свой яркий звук покупки (playPurchaseSound) —
              // общий тихий тап здесь звучал бы поверх него и мешался.
              data-no-tap-sound
              className="flex w-full items-center justify-center gap-2 rounded-[18px] px-3.5 py-3 text-[14px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.98]"
              style={{ background: VIOLET, boxShadow: BTN_SHADOW }}
            >
              Купить за {lastItem.price}
              <img src={coinIcon} alt="" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
