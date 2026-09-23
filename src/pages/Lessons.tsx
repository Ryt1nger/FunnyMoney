import { useEffect, useState } from 'react';
import heroImg from '../assets/heroes/hero-lessons.jpg';
import coinIcon from '../assets/icons/coin.png';
import xpIcon from '../assets/icons/xp-star.png';
import { lessonCards } from '../data/lessonsData';
import { IconArrowLeft, IconPlus, IconStar } from '../components/icons';
import bookHero from '../assets/icons/book-3d.png';


const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const LESSON_THEMES = [
  { title: 'Выбор', lessonIds: ['what-is-money', 'needs-vs-wants'] },
  { title: 'Покупки', lessonIds: ['piggy-bank', 'impulse-buying'] },
  { title: 'Накопления', lessonIds: ['financial-goal', 'plan-and-fact'] },
];

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  level: number;
  xp: number;
  xpToNext: number;
  onClose: () => void;
  /** плюсик у баланса — то же окно "как заработать монеты", что и на главной */
  onOpenEarnModal?: () => void;
}

export default function Lessons({ bottomInset = 0, coins, level, xp, xpToNext, onClose, onOpenEarnModal }: Props) {
  const [entered, setEntered] = useState(false);

  // фото проявляется, кремовый лист выезжает снизу — вместо резкого показа
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const xpPercent = Math.min(100, Math.round((xp / xpToNext) * 100));
  const list = lessonCards;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка с иллюстрацией */}
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

        <div
          className="safe-area-topbar relative flex items-start justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        >
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
              onClick={onOpenEarnModal}
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
            {'6 уроков и практика\nпро настоящие финансовые решения!'}
          </p>
        </div>
      </div>

      {/* Кремовый лист поверх шапки */}
      <div
        className="-mt-5 flex-1 overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-4 pt-4 transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Карточка уровня */}
        <div className="relative rounded-[22px] bg-white/70 p-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <IconStar className="h-9 w-9 shrink-0 drop-shadow" />
            <div className="min-w-0 flex-1">
              <div
                className="w-fit rounded-full px-3 py-1 text-[13px] font-bold text-white"
                style={{ background: VIOLET }}
              >
                Уровень {level}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="h-[9px] flex-1 overflow-hidden rounded-full"
                  style={{ background: 'rgba(120,110,150,0.22)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${xpPercent}%`, background: VIOLET }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-bold" style={{ color: '#5c5876' }}>
                  {xp} / {xpToNext} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mt-4 text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Курс «Монетки под контролем»
        </h2>

        {/* Три короткие темы по два урока */}
        <div className="mt-2.5 flex flex-col gap-4">
          {LESSON_THEMES.map((theme) => (
            <section key={theme.title}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[13px] font-extrabold" style={{ color: '#5d57c9' }}>{theme.title}</h3>
                <div className="h-px flex-1 bg-[#ded8ef]" />
              </div>
              <div className="flex flex-col gap-2.5">
              {list.filter((lesson) => theme.lessonIds.includes(lesson.id)).map((lesson) => (
            <div key={lesson.id} className="relative flex min-h-[100px] gap-3 rounded-[22px] bg-white/80 p-2.5 shadow-sm">
              <img
                src={lesson.image}
                alt=""
                className="h-[70px] w-[70px] shrink-0 rounded-[16px] object-cover"
              />
              <div className="min-w-0 flex-1 pr-24">
                <div className="line-clamp-2 text-[13px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                  {lesson.title}
                </div>
                <p
                  className="mt-1 truncate text-[10.5px] leading-tight"
                  style={{ color: '#7b7a8c' }}
                >
                  {lesson.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <img src={coinIcon} alt="" className="h-4 w-4" />
                    <span className="text-[11px] font-bold" style={{ color: '#4a4560' }}>
                      +{lesson.coins}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <img src={xpIcon} alt="" className="h-4 w-4" />
                    <span className="text-[11px] font-bold" style={{ color: '#4a4560' }}>
                      +{lesson.xp} XP
                    </span>
                  </span>
                </div>
              </div>

              <span
                className="absolute right-2.5 top-2.5 rounded-full px-2 py-[3px] text-[10px] font-bold"
                style={{ background: 'rgba(120,110,150,0.18)', color: '#7b7a8c' }}
              >
                {lesson.step}/{lesson.total}
              </span>
              <button
                className="absolute bottom-2.5 right-2.5 rounded-full px-4 py-1.5 text-[13px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.98]"
                style={{
                  background: VIOLET,
                  boxShadow:
                    'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
                }}
              >
                Начать
              </button>
            </div>
              ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-3 rounded-[20px] border border-[#ead9ac] bg-[#fff7dc] p-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#a9772f]">Финальный блок</div>
          <div className="mt-1 text-[14px] font-extrabold" style={{ color: '#2c2a5e' }}>Приложение и взрослый помощник</div>
          <p className="mt-1 text-[11px] leading-snug" style={{ color: '#7b7a8c' }}>
            Как пользоваться приложением безопасно: ребёнок принимает решения, а взрослый помогает и поддерживает.
          </p>
        </div>
      </div>
    </div>
  );
}
