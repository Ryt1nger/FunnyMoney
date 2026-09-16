import { useEffect, useState } from 'react';
import heroImg from '../assets/heroes/hero-lessons.jpg';
import coinIcon from '../assets/icons/coin.png';
import bookHero from '../assets/icons/book-3d.png';
import { IconArrowLeft, IconPlus, IconBook } from '../components/icons';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  onClose: () => void;
}

/**
 * Уроки ещё не готовы (контент в разработке) — вместо реального списка
 * показываем честную заглушку с тем же оформлением раздела, чтобы переход
 * с главной ("Событие дня" → "На урок") вёл на что-то осмысленное.
 */
export default function LessonsPlaceholder({ bottomInset = 0, coins, onClose }: Props) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      <div
        className="relative h-[170px] shrink-0 overflow-hidden bg-[#7d6270] transition-opacity duration-500"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '62% 38%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(70,52,66,0.92) 0%, rgba(70,52,66,0.72) 38%, rgba(70,52,66,0) 62%)',
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
            <img src={coinIcon} alt="" className="h-6 w-6" />
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
            <img src={bookHero} alt="" className="h-7 w-7" />
            <h1
              className="text-[26px] font-extrabold leading-none text-white"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}
            >
              Уроки
            </h1>
          </div>
          <p
            className="mt-1.5 whitespace-pre-line text-[13px] font-semibold leading-tight text-white/95"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {'Изучай, играй, развивай\nфинансовые навыки!'}
          </p>
        </div>
      </div>

      <div
        className="-mt-5 flex flex-1 flex-col items-center justify-center overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-6 pt-4 text-center transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full shadow-md"
          style={{ background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)' }}
        >
          <IconBook className="h-8 w-8" style={{ color: '#a9772f' }} />
        </div>
        <h2 className="mt-4 text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Уроки уже готовятся
        </h2>
        <p className="mt-2 max-w-[260px] text-[13px] leading-snug" style={{ color: '#7b7a8c' }}>
          Скоро здесь появятся настоящие задания, которые помогут Мишке — и тебе — лучше разбираться в деньгах.
          А пока загляни в магазин или покорми питомца на главной!
        </p>
      </div>
    </div>
  );
}
