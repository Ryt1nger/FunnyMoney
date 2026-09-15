import { useEffect, useState } from 'react';
import heroImg from '../assets/heroes/hero-stats.jpg';
import podiumImg from '../assets/icons/stats/podium-stage.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import { IconArrowLeft, IconFlag, IconShieldCrown } from '../components/icons';
import { podium, aboveMe, belowMe, me, league, climbGoal, type LeaderboardEntry } from '../data/statsData';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

interface Props {
  bottomInset?: number;
  onClose: () => void;
}

// Порядок отображения над подиумом: 2 место слева, 1 в центре (выше), 3 справа —
// геометрия совпадает с расположением колец на ассете podium-stage.png.
const podiumOrder = [podium[1], podium[0], podium[2]];

// Центры колец и диаметры аватарок — замерены по пикселям ассета (1400x966),
// в процентах от ширины/высоты картинки, чтобы не съезжать при ресайзе.
const RING_GEOMETRY: Record<number, { left: number; top: number; size: number; emojiPx: number }> = {
  1: { left: 50.2, top: 28.4, size: 21.4, emojiPx: 38 },
  2: { left: 15.8, top: 40.1, size: 17.8, emojiPx: 32 },
  3: { left: 82.6, top: 41.1, size: 17.1, emojiPx: 30 },
};

/**
 * size — фиксированный размер в px (для строк списка).
 * fill — растянуть на весь родитель (для колец подиума, где размер задаётся
 * процентом снаружи); emojiPx тогда передаётся отдельно — % от font-size
 * тут не сработает, т.к. у родителя нет собственного font-size в px.
 */
function Avatar({
  entry,
  size,
  fill,
  emojiPx,
}: {
  entry: LeaderboardEntry;
  size?: number;
  fill?: boolean;
  emojiPx?: number;
}) {
  const dim = fill ? undefined : { width: size, height: size };
  const sizeClass = fill ? 'h-full w-full' : '';
  const fontSize = emojiPx ?? (size ?? 40) * 0.52;
  if (entry.isMe) {
    return (
      <img
        src={bearAvatar}
        alt=""
        className={`${sizeClass} rounded-full border-2 border-white object-cover shadow-md`}
        style={dim}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full border-2 border-white shadow-md`}
      style={{ ...dim, background: entry.bg }}
    >
      <span style={{ fontSize, lineHeight: 1 }}>{entry.emoji}</span>
    </div>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div
      className={
        'flex items-center gap-3 rounded-[20px] px-3 py-2.5 transition ' +
        (entry.isMe ? 'shadow-lg' : 'bg-white/70 shadow-sm')
      }
      style={entry.isMe ? { background: VIOLET } : undefined}
    >
      <span
        className="w-5 shrink-0 text-center text-[14px] font-extrabold"
        style={{ color: entry.isMe ? '#ffffff' : '#7b7a8c' }}
      >
        {entry.rank}
      </span>
      <Avatar entry={entry} size={40} />
      <span
        className="flex-1 truncate text-[14.5px] font-bold"
        style={{ color: entry.isMe ? '#ffffff' : '#2c2a5e' }}
      >
        {entry.name}
      </span>
      <span
        className="shrink-0 text-[13.5px] font-bold"
        style={{ color: entry.isMe ? '#ffffff' : '#2c2a5e' }}
      >
        {entry.xp.toLocaleString('ru-RU')} XP
      </span>
    </div>
  );
}

export default function Stats({ bottomInset = 0, onClose }: Props) {
  const [entered, setEntered] = useState(false);
  const [period, setPeriod] = useState<'week' | 'all'>('week');

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка с иллюстрацией */}
      <div
        className="relative h-[200px] shrink-0 overflow-hidden bg-[#6b5940] transition-opacity duration-500"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '30% 42%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(45,36,58,0.85) 0%, rgba(45,36,58,0.55) 45%, rgba(45,36,58,0) 68%)',
          }}
        />

        <div className="relative flex items-start px-4 pt-4">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-2 px-4">
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

          <div
            className="mt-2.5 inline-flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3.5 backdrop-blur-md"
            style={{
              background: 'rgba(26,20,40,0.32)',
              borderColor: 'rgba(255,255,255,0.30)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            }}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(180deg, #fcd34d 0%, #ea9a12 100%)' }}
            >
              <IconShieldCrown className="h-4 w-4 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-bold text-white">{league.name}</span>
              <span className="block text-[11px] font-medium text-white/85">{league.hint}</span>
            </span>
          </div>
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
        {/* Переключатель периода */}
        <div
          className="flex items-center gap-1 rounded-full p-1"
          style={{ background: 'rgba(120,110,150,0.14)' }}
        >
          {(
            [
              ['week', 'Неделя'],
              ['all', 'Всё время'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              className="flex-1 rounded-full py-2 text-[13.5px] font-bold transition active:scale-[0.98]"
              style={
                period === id
                  ? { background: VIOLET, color: '#ffffff', boxShadow: '0 4px 10px rgba(92,90,216,0.28)' }
                  : { color: '#7b7a8c' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Подиум топ-3 */}
        <div className="relative mt-4">
          <div className="relative w-full" style={{ paddingTop: `${(966 / 1400) * 100}%` }}>
            <img
              src={podiumImg}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
              draggable={false}
            />
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
                  <Avatar entry={entry} fill emojiPx={g.emojiPx} />
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex gap-2">
            {podiumOrder.map((entry) => (
              <div key={entry.rank} className="flex-1 rounded-[16px] bg-white/70 px-2 py-2 text-center shadow-sm">
                <div className="truncate text-[12.5px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {entry.name}
                </div>
                <div className="text-[11px] font-bold" style={{ color: '#7b7a8c' }}>
                  {entry.xp.toLocaleString('ru-RU')} XP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Список рядом с местом игрока */}
        <div className="mt-4 flex flex-col gap-2">
          {aboveMe.map((entry) => (
            <Row key={entry.rank} entry={entry} />
          ))}
        </div>

        {/* Баннер цели */}
        <div
          className="mt-2 flex items-center gap-3 rounded-[20px] p-3"
          style={{ background: 'rgba(139,136,244,0.14)', border: '1px solid rgba(139,136,244,0.30)' }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: VIOLET }}
          >
            <IconFlag className="h-[18px] w-[18px] text-white" />
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

        {/* Игрок + окружение */}
        <div className="mt-2 flex flex-col gap-2">
          <Row entry={me} />
          {belowMe.map((entry) => (
            <Row key={entry.rank} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
