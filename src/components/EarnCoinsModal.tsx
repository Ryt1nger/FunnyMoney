import { useEffect, useState } from 'react';
import { IconBook, IconGift, IconChevronRight, IconCoinStack } from './icons';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const BTN_SHADOW =
  'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Открыть раздел уроков */
  onOpenLessons: () => void;
  /** Открыть раздел наград (вкладка "Награды" на экране "День") */
  onOpenRewards: () => void;
}

/**
 * Окошко по центру экрана — появляется по кнопке "+" рядом с балансом монет
 * и объясняет, откуда берутся монеты: либо с уроков, либо из наград за
 * задания дня. В отличие от BottomSheet (боковые разделы), это лёгкая
 * модалка-подсказка, поэтому анимация — плавное появление/исчезание и
 * масштабирование, а не выезд снизу.
 */
export default function EarnCoinsModal({ open, onClose, onOpenLessons, onOpenRewards }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 z-40 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center px-7">
        <div
          className="pointer-events-auto w-full max-w-[300px] rounded-[28px] p-5 shadow-2xl transition-all duration-300"
          style={{
            background: '#fbefe1',
            transform: shown ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(10px)',
            opacity: shown ? 1 : 0,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(180deg, #f9cb63 0%, #efa622 100%)',
                boxShadow: '0 6px 14px rgba(239,166,34,0.35)',
              }}
            >
              <IconCoinStack className="h-8 w-8 text-white" />
            </div>
          </div>

          <h2 className="mt-3 text-center text-[17px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
            Как заработать монеты?
          </h2>
          <p className="mt-1.5 text-center text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
            Проходи уроки или забирай награды за выполненные задания дня
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={onOpenLessons}
              className="flex items-center gap-2.5 rounded-[18px] px-3.5 py-3 text-left transition active:scale-[0.98]"
              style={{ background: VIOLET, boxShadow: BTN_SHADOW }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
                <IconBook className="h-5 w-5 text-white" />
              </span>
              <span className="text-[13.5px] font-bold text-white">Уроки</span>
              <IconChevronRight className="ml-auto h-4 w-4 text-white/70" />
            </button>

            <button
              onClick={onOpenRewards}
              className="flex items-center gap-2.5 rounded-[18px] px-3.5 py-3 text-left transition active:scale-[0.98]"
              style={{ background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)' }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/50">
                <IconGift className="h-5 w-5" />
              </span>
              <span className="text-[13.5px] font-bold" style={{ color: '#7d6034' }}>
                Награды
              </span>
              <IconChevronRight className="ml-auto h-4 w-4" style={{ color: '#c2a876' }} />
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-3 w-full rounded-full py-2 text-[12.5px] font-bold transition active:scale-[0.98]"
            style={{ color: '#a19cb0' }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  );
}
