import { useEffect, useLayoutEffect, useRef, useState, type UIEvent } from 'react';
import heroImg from '../assets/heroes/hero-stats.jpg';
import podiumImg from '../assets/icons/stats/podium-stage.png';
import shieldGold from '../assets/icons/stats/shield-gold.png';
import laurelLeft from '../assets/icons/stats/laurel-left.png';
import laurelRight from '../assets/icons/stats/laurel-right.png';
import flagIcon from '../assets/icons/stats/flag.png';
import confettiGold1 from '../assets/icons/stats/confetti-gold-1.png';
import confettiGold2 from '../assets/icons/stats/confetti-gold-2.png';
import confettiGold3 from '../assets/icons/stats/confetti-gold-3.png';
import confettiBlue1 from '../assets/icons/stats/confetti-blue-1.png';
import confettiBlue2 from '../assets/icons/stats/confetti-blue-2.png';
import confettiBlue3 from '../assets/icons/stats/confetti-blue-3.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import AnimalAvatar from '../components/AnimalAvatar';
import { IconArrowLeft } from '../components/icons';
import {
  podium,
  aboveMe,
  justAboveMe,
  belowMe,
  me,
  league,
  climbGoal,
  type LeaderboardEntry,
} from '../data/statsData';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

interface Props {
  bottomInset?: number;
  onClose: () => void;
}

// Центры колец и подписных ячеек подиума — замерены по пикселям ассета
// podium-stage.png (1400x762, конфетти обрезаны отдельно), в процентах от
// ширины/высоты картинки, чтобы не съезжать при ресайзе.
const RING_GEOMETRY: Record<number, { left: number; top: number; size: number }> = {
  1: { left: 50.2, top: 36.0, size: 21.4 },
  2: { left: 15.8, top: 50.8, size: 17.8 },
  3: { left: 82.6, top: 52.1, size: 17.1 },
};

// Пустые "плашки" на постаментах — имя и XP пишем прямо в них.
const PLAQUE_GEOMETRY: Record<number, { left: number; top: number; width: number; height: number }> = {
  1: { left: 50.0, top: 84.4, width: 20.5, height: 15.0 },
  2: { left: 16.3, top: 88.3, width: 20.5, height: 12.8 },
  3: { left: 83.8, top: 88.3, width: 20.7, height: 12.9 },
};

// Конфетти рассыпаны хаотично НАД подиумом (над коронами), а не аккуратной
// строкой под ним, как было на исходном ассете.
const CONFETTI: { src: string; left: number; top: number; size: number; rotate: number }[] = [
  { src: confettiGold1, left: 6, top: -8, size: 30, rotate: -18 },
  { src: confettiBlue1, left: 20, top: 2, size: 22, rotate: 24 },
  { src: confettiGold2, left: 34, top: -14, size: 24, rotate: 12 },
  { src: confettiBlue2, left: 46, top: -20, size: 20, rotate: -30 },
  { src: confettiGold3, left: 58, top: -12, size: 26, rotate: 22 },
  { src: confettiBlue3, left: 71, top: -2, size: 22, rotate: -14 },
  { src: confettiGold1, left: 83, top: -16, size: 22, rotate: 34 },
  { src: confettiBlue1, left: 93, top: -4, size: 20, rotate: -22 },
];

/**
 * size — фиксированный размер в px (для строк списка), с белой обводкой-бейджем.
 * fill — растянуть на весь родитель (для колец подиума): там свою обводку не
 * рисуем — кольцо уже нарисовано на ассете podium-stage.png, а двойная рамка
 * и была причиной "кривых" аватарок.
 */
function Avatar({ entry, size, fill }: { entry: LeaderboardEntry; size?: number; fill?: boolean }) {
  const dim = fill ? undefined : { width: size, height: size };
  const sizeClass = fill ? 'h-full w-full' : '';
  const ringClass = fill ? '' : 'border-2 border-white shadow-md';
  if (entry.isMe) {
    return (
      <img
        src={bearAvatar}
        alt=""
        className={`${sizeClass} rounded-full ${ringClass} object-cover`}
        style={dim}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex items-center justify-center overflow-hidden rounded-full ${ringClass}`}
      style={{ ...dim, background: entry.bg }}
    >
      <AnimalAvatar species={entry.species} className="h-[80%] w-[80%]" />
    </div>
  );
}

// Компактная строка рейтинга — уменьшена (аватар/паддинги/шрифты чуть меньше),
// чтобы список выглядел легче и в закреплённой панели помещалось 4 строки.
function Row({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={
        'flex items-center gap-2.5 rounded-[16px] px-2.5 py-2 transition ' +
        (entry.isMe ? 'shadow-lg' : 'bg-white/70 shadow-sm')
      }
      style={entry.isMe ? { background: VIOLET } : undefined}
    >
      <span
        className="w-4 shrink-0 text-center text-[12.5px] font-extrabold"
        style={{ color: entry.isMe ? '#ffffff' : '#7b7a8c' }}
      >
        {entry.rank}
      </span>
      <Avatar entry={entry} size={34} />
      <span
        className="flex-1 truncate text-[13px] font-bold"
        style={{ color: entry.isMe ? '#ffffff' : '#2c2a5e' }}
      >
        {entry.name}
      </span>
      <span
        className="shrink-0 text-[12px] font-bold"
        style={{ color: entry.isMe ? '#ffffff' : '#2c2a5e' }}
      >
        {entry.xp.toLocaleString('ru-RU')} XP
      </span>
    </div>
  );
}

export default function Stats({ bottomInset = 0, onClose }: Props) {
  const [entered, setEntered] = useState(false);
  const [fogOpacity, setFogOpacity] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearMeRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Один общий список: сразу открываем так, чтобы было видно и баннер цели
  // ("задание"), и наше место в рейтинге — прокручиваем ровно до баннера
  // цели (а не до самих плашек рядом с игроком), тогда оба блока попадают
  // на экран одновременно. Всё, что выше — топ-3 и топ-лист — скрыто
  // прокруткой и подёрнуто туманом сверху, который рассеивается при скролле.
  useLayoutEffect(() => {
    if (scrollRef.current && goalRef.current) {
      scrollRef.current.scrollTop = goalRef.current.offsetTop - 48;
      setFogOpacity(1);
    }
  }, []);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setFogOpacity(Math.min(1, e.currentTarget.scrollTop / 40));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка с иллюстрацией — высота как на остальных экранах (170px);
          сама шапка НЕ обрезает контент, чтобы плашка лиги могла свободно
          выступать за нижний край и не пряталась под кремовой секцией. */}
      <div
        className="relative z-20 h-[170px] shrink-0 transition-opacity duration-500"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-b-[2px] bg-[#6b5940]">
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: '30% 38%' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(45,36,58,0.85) 0%, rgba(45,36,58,0.55) 45%, rgba(45,36,58,0) 68%)',
            }}
          />
        </div>

        {/* Контент шапки поверх картинки, z-index выше кремовой секции ниже —
            если плашка лиги вылезет за нижний край шапки, она останется НАД
            статистикой, а не окажется под ней. */}
        <div className="relative z-20 flex items-start px-4 pt-4">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-20 mt-2 px-4">
          <h1
            className="text-[26px] font-extrabold leading-none text-white"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}
          >
            Статистика
          </h1>
          <p
            className="mt-1.5 whitespace-pre-line text-[13px] font-semibold leading-tight text-white/95"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {'Соревнуйся, учись\nи становись финансовым профи!'}
          </p>

          {/* Лига — реальный ассет щита, лавры по бокам как декоративный аксент */}
          <div className="mt-2.5 inline-flex items-center">
            <img src={laurelLeft} alt="" className="h-8 w-auto -mr-1 select-none" draggable={false} />
            <div
              className="inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 backdrop-blur-md"
              style={{
                background: 'rgba(26,20,40,0.32)',
                borderColor: 'rgba(255,255,255,0.30)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              }}
            >
              <img src={shieldGold} alt="" className="h-8 w-auto select-none" draggable={false} />
              <span className="leading-tight">
                <span className="block text-[13px] font-bold text-white">{league.name}</span>
                <span className="block text-[11px] font-medium text-white/85">{league.hint}</span>
              </span>
            </div>
            <img src={laurelRight} alt="" className="h-8 w-auto -ml-1 select-none" draggable={false} />
          </div>
        </div>
      </div>

      {/* Кремовый лист поверх шапки — подиум зафиксирован сверху и не сдвигается
          при прокрутке; листается только список под ним. */}
      <div
        className="relative z-10 -mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[26px] bg-[#fbefe1] transition-transform duration-[420ms]"
        style={{
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Подиум топ-3 — закреплён, отступ сверху под конфетти над коронами */}
        <div className="relative shrink-0 px-4 pt-8">
          <div className="relative w-full" style={{ paddingTop: `${(762 / 1400) * 100}%` }}>
            <img
              src={podiumImg}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
              draggable={false}
            />

            {/* Аватарки в кольцах */}
            {podium.map((entry) => {
              const g = RING_GEOMETRY[entry.rank];
              return (
                <div
                  key={entry.rank}
                  className="absolute"
                  style={{
                    left: `${g.left}%`,
                    top: `${g.top}%`,
                    width: `${g.size}%`,
                    aspectRatio: '1 / 1',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Avatar entry={entry} fill />
                </div>
              );
            })}

            {/* Имя + XP прямо в пустых плашках на постаментах */}
            {podium.map((entry) => {
              const p = PLAQUE_GEOMETRY[entry.rank];
              return (
                <div
                  key={entry.rank}
                  className="absolute flex flex-col items-center justify-center overflow-hidden px-1"
                  style={{
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    width: `${p.width}%`,
                    height: `${p.height}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-full truncate text-center text-[11px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                    {entry.name}
                  </div>
                  <div className="w-full truncate text-center text-[9.5px] font-bold leading-tight" style={{ color: '#8b8398' }}>
                    {entry.xp.toLocaleString('ru-RU')} XP
                  </div>
                </div>
              );
            })}

            {/* Конфетти хаотично рассыпано над коронами */}
            {CONFETTI.map((c, i) => (
              <img
                key={i}
                src={c.src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute select-none"
                style={{
                  left: `${c.left}%`,
                  top: `${c.top}%`,
                  width: c.size,
                  transform: `translate(-50%, -50%) rotate(${c.rotate}deg)`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Под подиумом — единый прокручиваемый список: топ-лист, баннер цели,
            плашки рядом с игроком. Открывается сразу на своём месте, а то, что
            выше (топ-лист), подёрнуто туманом, который рассеивается при скролле. */}
        <div className="relative min-h-0 flex-1">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10"
            style={{
              background:
                'linear-gradient(180deg, #fbefe1 0%, rgba(251,239,225,0.85) 45%, rgba(251,239,225,0) 100%)',
              backdropFilter: 'blur(3px)',
              opacity: fogOpacity,
              transition: 'opacity 120ms linear',
            }}
          />
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto px-4 pt-3"
            style={{ paddingBottom: bottomInset + 24 }}
          >
            {/* Топ-лист (места 4-6) */}
            <div className="flex flex-col gap-2">
              {aboveMe.map((entry) => (
                <Row key={entry.rank} entry={entry} />
              ))}
            </div>

            {/* Баннер цели — до него и прокручиваем список при открытии */}
            <div
              ref={goalRef}
              className="mt-2 mb-3 flex items-center gap-3 rounded-[20px] p-3"
              style={{ background: 'rgba(139,136,244,0.14)', border: '1px solid rgba(139,136,244,0.30)' }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: VIOLET }}
              >
                <img src={flagIcon} alt="" className="h-5 w-5 select-none" draggable={false} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {climbGoal.title}
                </div>
                <div className="mt-0.5 truncate text-[11px]" style={{ color: '#7b7a8c' }}>
                  {climbGoal.subtitle}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(120,110,150,0.22)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(climbGoal.progress / climbGoal.total) * 100}%`, background: VIOLET }}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] font-bold" style={{ color: '#5c5876' }}>
                    {climbGoal.progress} / {climbGoal.total} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Плашки рядом с игроком — 1 место перед нами, мы, 2 после. Именно
                сюда прокручиваем список при открытии экрана. */}
            <div ref={nearMeRef} className="flex flex-col gap-1.5 pt-1">
              <Row entry={justAboveMe} />
              <Row entry={me} />
              {belowMe.map((entry) => (
                <Row key={entry.rank} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
