import { useEffect, useState } from 'react';
import heroImg from '../assets/heroes/hero-progress.jpg';
import coinIcon from '../assets/icons/coin.png';
import hoodieImg from '../assets/items/clothing/hoodie-blue-paw.png';
import capImg from '../assets/items/clothing/cap-white-paw.png';
import { IconArrowLeft, IconPlus, IconStar, IconLock, IconCheck, IconChevronRight, IconGift } from '../components/icons';
import { progressLevels, MAX_LEVEL, LEVEL_COIN_REWARD } from '../data/progressLevels';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const VIOLET_SOLID = '#7574f0';

interface Props {
  /** высота нижней навигации: содержимое не должно прятаться под баром */
  bottomInset?: number;
  coins: number;
  level: number;
  xp: number;
  onClose: () => void;
  /** плюсик у баланса — то же окно "как заработать монеты", что и на главной */
  onOpenEarnModal?: () => void;
}

function LevelNode({ index, currentLevel }: { index: number; currentLevel: number }) {
  const state = index < currentLevel ? 'done' : index === currentLevel ? 'current' : 'locked';
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md transition"
      style={{
        background:
          state === 'locked' ? 'rgba(120,110,150,0.18)' : state === 'current' ? VIOLET : VIOLET_SOLID,
        boxShadow: state === 'current' ? '0 0 0 4px rgba(139,136,244,0.28)' : undefined,
      }}
    >
      {state === 'done' && <IconCheck className="h-5 w-5 text-white" />}
      {state === 'current' && <IconStar className="h-6 w-6" />}
      {state === 'locked' && <IconLock className="h-4 w-4" style={{ color: '#a29cb8' }} />}
    </div>
  );
}

function RewardCard({
  icon,
  label,
  earned,
}: {
  icon: React.ReactNode;
  label: string;
  earned: boolean;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-1.5 rounded-[18px] bg-white/80 px-2 py-3 shadow-sm">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: earned ? 'rgba(139,136,244,0.16)' : 'rgba(120,110,150,0.14)', opacity: earned ? 1 : 0.6 }}
      >
        {icon}
      </div>
      <span className="text-center text-[11px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
        {label}
      </span>
      <span
        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: earned ? VIOLET_SOLID : 'rgba(120,110,150,0.25)' }}
      >
        {earned ? <IconCheck className="h-3 w-3 text-white" /> : <IconLock className="h-2.5 w-2.5" style={{ color: '#fff' }} />}
      </span>
    </div>
  );
}

export default function Progress({ bottomInset = 0, coins, level, xp, onClose, onOpenEarnModal }: Props) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const current = progressLevels[Math.min(level, MAX_LEVEL) - 1] ?? progressLevels[0];
  const isMaxLevel = level >= MAX_LEVEL;
  const xpToNext = current.xpThreshold;
  const xpPercent = Math.min(100, Math.round((xp / xpToNext) * 100));
  const nextLevelData = !isMaxLevel ? progressLevels[level] : null;
  const accessoryImg = current.accessory === 'cap' ? capImg : hoodieImg;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#7d6270]">
      {/* Шапка с иллюстрацией — тот же паттерн, что и у остальных разделов.
          Растягиваем на всё, что не занимает кремовая секция снизу (см. ниже) —
          так на баннере видно больше медведя и фона. */}
      <div
        className="relative flex-1 overflow-hidden bg-[#7d6270] transition-opacity duration-500"
        style={{ opacity: entered ? 1 : 0 }}
      >
        {/* Само фото — в исходном масштабе (баннер широкий и невысокий), иначе
            object-cover в увеличенной шапке слишком сильно обрезает и "зумит"
            картинку. Место ниже фото до кремовой секции — просто фон блока. */}
        <div className="absolute inset-x-0 top-0 h-[170px] overflow-hidden">
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: '68% 45%' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(70,52,66,0.92) 0%, rgba(70,52,66,0.72) 38%, rgba(70,52,66,0) 62%)',
            }}
          />
        </div>

        {/* pt заменён на calc с env(safe-area-inset-top) — на телефонах с "чёлкой"/
            статус-баром кнопка иначе оказывается под системным интерфейсом и не нажимается. */}
        <div
          className="relative flex items-start justify-between px-4"
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
          <h1
            className="text-[26px] font-extrabold leading-none text-white"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}
          >
            Прогресс
          </h1>
          <p
            className="mt-1.5 whitespace-pre-line text-[13px] font-semibold leading-tight text-white/95"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {'Проходи уровни и получай награды!'}
          </p>
        </div>
      </div>

      {/* Кремовый лист — опущена ниже и уменьшена на ~30% (была flex-1, занимала
          всё оставшееся место; теперь фиксированная высота 56% экрана, а шапка
          сверху сама растягивается на освободившееся место). */}
      <div
        className="-mt-5 h-[56%] shrink-0 overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-4 pt-4 transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Карточка уровня + прогресс XP */}
        <div className="rounded-[22px] bg-white/70 p-3 shadow-md">
          <div
            className="w-fit rounded-full px-3 py-1 text-[13px] font-bold text-white"
            style={{ background: VIOLET }}
          >
            Уровень {level}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-[9px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.22)' }}>
              <div className="h-full rounded-full" style={{ width: `${xpPercent}%`, background: VIOLET }} />
            </div>
            <span className="shrink-0 text-[11px] font-bold" style={{ color: '#5c5876' }}>
              {xp} / {xpToNext} XP
            </span>
          </div>

          {/* Трекер 5 уровней развития */}
          <div className="mt-4 flex items-center">
            {progressLevels.map((lvl, idx) => (
              <div key={lvl.level} className="flex flex-1 items-center last:flex-none">
                <LevelNode index={lvl.level} currentLevel={level} />
                {idx < progressLevels.length - 1 && (
                  <div
                    className="mx-1 h-[3px] flex-1 rounded-full"
                    style={{ background: lvl.level < level ? VIOLET_SOLID : 'rgba(120,110,150,0.18)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Баннер достижения текущего уровня */}
        <div
          className="mt-3 flex items-center gap-3 rounded-[22px] p-3"
          style={{ background: 'rgba(139,136,244,0.14)', border: '1px solid rgba(139,136,244,0.30)' }}
        >
          <IconStar className="h-10 w-10 shrink-0 drop-shadow" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
              {current.title}
            </div>
            <div className="mt-0.5 text-[12px] leading-tight" style={{ color: '#7b7a8c' }}>
              {current.subtitle}
            </div>
          </div>
        </div>

        {/* Награды уровня */}
        <h2 className="mt-4 text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Награды уровня
        </h2>
        <div className="mt-2 flex gap-2.5">
          <RewardCard
            icon={<img src={coinIcon} alt="" className="h-6 w-6" />}
            label={`${LEVEL_COIN_REWARD} монет`}
            earned
          />
          <RewardCard
            icon={<img src={accessoryImg} alt="" className="h-8 w-8 object-contain" />}
            label="Аксессуар"
            earned
          />
          <RewardCard icon={<IconGift className="h-7 w-7" />} label="Подарок" earned={false} />
        </div>

        {/* Следующий уровень — информационная строка, не кликабельна */}
        <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-white/60 px-3.5 py-3 opacity-70">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(120,110,150,0.20)' }}>
            <IconLock className="h-4 w-4" style={{ color: '#7b7a8c' }} />
          </span>
          <span className="flex-1 text-[13px] font-bold" style={{ color: '#7b7a8c' }}>
            {isMaxLevel || !nextLevelData
              ? 'Достигнут максимальный уровень'
              : `Следующий уровень — ${Math.max(0, nextLevelData.xpThreshold - xp)} XP`}
          </span>
          <IconChevronRight className="h-4 w-4 shrink-0" style={{ color: '#a9a4b8' }} />
        </div>
      </div>
    </div>
  );
}
