import { useEffect, useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import { IconBook, IconGift, IconChevronRight } from './icons';

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

// Длительность анимации появления/скрытия — единая константа, чтобы плавный
// уход не обрывался раньше времени размонтированием компонента.
const TRANSITION_MS = 320;
// Лёгкое размытие фона — заметно мягче, чем стандартный Tailwind backdrop-blur.
const BACKDROP_BLUR_PX = 2;

/**
 * Окошко по центру экрана — появляется по кнопке "+" рядом с балансом монет
 * и объясняет, откуда берутся монеты: либо с уроков, либо из наград за
 * задания дня. Намеренно `absolute inset-0` внутри разметки экрана (как и
 * BottomSheet), а НЕ `fixed` — `fixed` вырывается за пределы "рамки телефона"
 * (overflow-hidden контейнера) и в браузере на десктопе перекрывает всю
 * страницу целиком, а не только приложение.
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
    const t = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-[60]">
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: 'rgba(20,14,26,0.5)',
          backdropFilter: `blur(${shown ? BACKDROP_BLUR_PX : 0}px)`,
          WebkitBackdropFilter: `blur(${shown ? BACKDROP_BLUR_PX : 0}px)`,
          opacity: shown ? 1 : 0,
          transition: `opacity ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), -webkit-backdrop-filter ${TRANSITION_MS}ms ease, backdrop-filter ${TRANSITION_MS}ms ease`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-7">
        <div
          className="relative w-full max-w-[300px] rounded-[28px] p-5 pt-6 shadow-2xl"
          style={{
            background: '#fbefe1',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 24px 48px rgba(20,10,30,0.35), 0 4px 14px rgba(20,10,30,0.18)',
            transform: shown ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(16px)',
            opacity: shown ? 1 : 0,
            transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${TRANSITION_MS}ms ease`,
          }}
        >
          {/* Закрыть — крестик в углу, как в обычном модальном окне */}
          <button
            onClick={onClose}
            aria-label="Закрыть"
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
              <img src={coinIcon} alt="" className="h-9 w-9 drop-shadow" />
            </div>
          </div>

          <h2 className="mt-3.5 text-center text-[18px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
            Как заработать монеты?
          </h2>
          <p className="mt-1.5 px-1 text-center text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
            Проходи уроки или забирай награды за выполненные задания дня
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
            <button
              onClick={onOpenLessons}
              className="flex items-center gap-3 rounded-[18px] px-3.5 py-3 text-left transition active:scale-[0.98]"
              style={{ background: VIOLET, boxShadow: BTN_SHADOW }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <IconBook className="h-5 w-5 text-white" />
              </span>
              <span className="text-[14px] font-bold text-white">Уроки</span>
              <IconChevronRight className="ml-auto h-4 w-4 text-white/70" />
            </button>

            <button
              onClick={onOpenRewards}
              className="flex items-center gap-3 rounded-[18px] px-3.5 py-3 text-left transition active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)',
                boxShadow:
                  'inset 0 2px 0 rgba(255,255,255,0.45), inset 0 -2px 3px rgba(150,105,40,0.18), 0 4px 10px rgba(150,105,40,0.16)',
              }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/55">
                <IconGift className="h-5 w-5" />
              </span>
              <span className="text-[14px] font-bold" style={{ color: '#7d6034' }}>
                Награды
              </span>
              <IconChevronRight className="ml-auto h-4 w-4" style={{ color: '#c2a876' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
