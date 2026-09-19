import { useMemo, useState, type ReactNode } from 'react';
import bearAvatar from '../assets/pet/bear-avatar.png';
import coinIcon from '../assets/icons/coin.png';
import walletIcon from '../assets/icons/categories/wallet.png';
import piggyIcon from '../assets/icons/categories/piggy.png';
import bookIcon from '../assets/icons/categories/book.png';
import cartIcon from '../assets/icons/categories/cart.png';
import MaskIcon from '../components/MaskIcon';
import Toggle from '../components/Toggle';
import { IconArrowLeft, IconSettingsGear, IconCheck, IconChevronRight } from '../components/icons';
import { progressLevels, CURRENT_LEVEL, CURRENT_XP } from '../data/progressLevels';
import {
  learningResults,
  financialGrowthByMonth,
  activityByWeek,
  skillStats,
  type SkillStatus,
} from '../data/parentDashboardData';
import { dayTasks } from '../data/dayData';
import { usePetStore } from '../features/pet/petStore';
import { useEconomyStore } from '../features/economy/economyStore';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { useDayProgressStore } from '../features/progress/dayProgressStore';
import { useSettingsStore } from '../features/settings/settingsStore';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const VIOLET_SOLID = '#7574f0';

const XP_TO_NEXT = progressLevels[CURRENT_LEVEL - 1].xpThreshold;
const CURRENT_LEVEL_TITLE = progressLevels[CURRENT_LEVEL - 1].title;

const SKILL_ICONS: Record<'wallet' | 'piggy' | 'book' | 'cart', string> = {
  wallet: walletIcon,
  piggy: piggyIcon,
  book: bookIcon,
  cart: cartIcon,
};

const SKILL_COLORS: Record<SkillStatus, { bar: string; badge: string; text: string }> = {
  good: { bar: '#63d98b', badge: 'rgba(99,217,139,0.16)', text: '#3f9a63' },
  medium: { bar: '#f2b23c', badge: 'rgba(242,178,60,0.18)', text: '#a9781f' },
  needs_work: { bar: '#ef4060', badge: 'rgba(239,64,96,0.14)', text: '#c23a52' },
};

interface Props {
  bottomInset?: number;
  onBack: () => void;
  /** шестерёнка в шапке — открывает служебный раздел (о приложении, сброс прогресса) */
  onOpenZone: () => void;
}

function SectionCard({ children }: { children: ReactNode }) {
  return <div className="rounded-[20px] bg-white/85 p-3.5 shadow-sm">{children}</div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2.5 mt-5 text-[15px] font-extrabold" style={{ color: '#2c2a5e' }}>
      {children}
    </h2>
  );
}

/** Линия роста по неделям — 4 точки, значения подписаны прямо на графике (точек мало,
 * отдельная всплывающая подсказка тут не добавляет пользы). Один ряд — легенда не нужна,
 * название графика и так называет метрику. */
function GrowthLineChart({ data }: { data: { label: string; value: number }[] }) {
  const width = 300;
  const height = 108;
  const padX = 18;
  const padTop = 22;
  const padBottom = 20;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - (d.value / 100) * innerH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Рост финансовой грамотности по неделям">
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b88f4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8b88f4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* базовая линия */}
      <line x1={padX} y1={padTop + innerH} x2={width - padX} y2={padTop + innerH} stroke="rgba(120,110,150,0.18)" strokeWidth="1" />
      <path d={areaPath} fill="url(#growthFill)" />
      <path d={linePath} fill="none" stroke={VIOLET_SOLID} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={VIOLET_SOLID} strokeWidth="2.5" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2c2a5e">
            {p.value}%
          </text>
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="9" fill="#9a8f80">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Столбики активности по дням — простые div'ы, как остальные полосы прогресса в приложении. */
function ActivityBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-[92px] items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-[68px] w-full items-end overflow-hidden rounded-[8px]" style={{ background: 'rgba(120,110,150,0.12)' }}>
            <div
              className="w-full rounded-[8px]"
              style={{ height: `${Math.max(6, (d.value / max) * 100)}%`, background: VIOLET }}
            />
          </div>
          <span className="text-[10px] font-semibold" style={{ color: '#9a8f80' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatTxDate(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' · ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function ParentDashboard({ bottomInset = 0, onBack, onOpenZone }: Props) {
  const pet = usePetStore((s) => s.pet);
  const coins = useEconomyStore((s) => s.coins);
  const totalSpent = useEconomyStore((s) => s.totalSpent);
  const transactions = useEconomyStore((s) => s.transactions);
  const ownedRoomIds = useInventoryStore((s) => s.ownedRoomIds);
  const ownedProductIds = useInventoryStore((s) => s.ownedProductIds);
  const streakDays = useDayProgressStore((s) => s.streak);
  const completedTaskIds = useDayProgressStore((s) => s.completedTaskIds);
  const purchaseConfirmationEnabled = useSettingsStore((s) => s.purchaseConfirmationEnabled);
  const setPurchaseConfirmationEnabled = useSettingsStore((s) => s.setPurchaseConfirmationEnabled);

  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [historyOpen, setHistoryOpen] = useState(false);

  const petName = pet?.name ?? 'Мишка';
  const xpPercent = Math.min(100, Math.round((CURRENT_XP / XP_TO_NEXT) * 100));
  // Покупки в комнатах — минус стартовая комната, которую владеешь по умолчанию,
  // а не купил сам.
  const purchasesCount = ownedProductIds.length + Math.max(0, ownedRoomIds.length - 1);
  const tasksDoneToday = completedTaskIds.length;

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8),
    [transactions],
  );

  const growthDelta = financialGrowthByMonth[financialGrowthByMonth.length - 1].value - financialGrowthByMonth[0].value;
  const weekXpTotal = activityByWeek.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка — как у остальных служебных экранов (Настройки/Инвентарь): сплошной
          цвет, без фото, шестерёнка ведёт в старый служебный раздел (о приложении/сброс). */}
      <div className="relative flex shrink-0 items-center justify-between px-4 pb-4 pt-4" style={{ background: '#6d5a63' }}>
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md transition active:scale-95"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-extrabold text-white">Родительский кабинет</h1>
        <button
          onClick={onOpenZone}
          aria-label="Служебная информация"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md transition active:scale-95"
        >
          <IconSettingsGear className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4" style={{ paddingBottom: bottomInset + 24 }}>
        {/* Карточка ребёнка */}
        <SectionCard>
          <div className="flex items-center gap-3">
            <img src={bearAvatar} alt={petName} className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md" />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                {petName}
              </div>
              <div className="text-[12.5px] font-semibold" style={{ color: '#7b7a8c' }}>
                Уровень {CURRENT_LEVEL} · {CURRENT_LEVEL_TITLE}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-[8px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.18)' }}>
                  <div className="h-full rounded-full" style={{ width: `${xpPercent}%`, background: VIOLET }} />
                </div>
                <span className="shrink-0 text-[11px] font-bold" style={{ color: '#5c5876' }}>
                  {CURRENT_XP} / {XP_TO_NEXT} XP
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Переключатель периода */}
        <div className="mt-3 flex overflow-hidden rounded-full bg-white/60 p-1">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 rounded-full py-2 text-[12.5px] font-bold transition"
              style={
                period === p
                  ? { background: VIOLET, color: '#fff', boxShadow: '0 4px 10px rgba(92,90,216,0.3)' }
                  : { color: '#7b7a8c' }
              }
            >
              {p === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>

        {/* Быстрые показатели — реальные данные из игры */}
        <div className="mt-3 flex gap-2.5">
          <SectionCard>
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Серия
              </span>
              <span className="text-[18px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {streakDays} дн.
              </span>
            </div>
          </SectionCard>
          <SectionCard>
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Задания сегодня
              </span>
              <span className="text-[18px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {tasksDoneToday} из {dayTasks.length}
              </span>
            </div>
          </SectionCard>
          <SectionCard>
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Покупки
              </span>
              <span className="text-[18px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {purchasesCount}
              </span>
            </div>
          </SectionCard>
        </div>

        {/* Результаты обучения */}
        <SectionTitle>Результаты обучения</SectionTitle>
        <SectionCard>
          <div className="flex gap-2.5">
            <div className="flex flex-1 items-center gap-2.5 rounded-[16px] p-2.5" style={{ background: 'rgba(99,217,139,0.10)' }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(99,217,139,0.22)' }}>
                <IconCheck className="h-5 w-5" style={{ color: '#3f9a63' }} />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold leading-tight" style={{ color: '#7b7a8c' }}>
                  Успешные решения
                </div>
                <div className="text-[17px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                  {learningResults.successPercent}%
                </div>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2.5 rounded-[16px] p-2.5" style={{ background: 'rgba(239,64,96,0.08)' }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]" style={{ background: 'rgba(239,64,96,0.16)' }}>
                ⚠️
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold leading-tight" style={{ color: '#7b7a8c' }}>
                  Ошибки
                </div>
                <div className="text-[17px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                  {learningResults.errorPercent}%
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#3f9a63' }}>
            <span>↗</span>
            На {learningResults.improvementVsLastMonth}% лучше, чем месяц назад
          </div>
        </SectionCard>

        {/* График — линия роста за месяц или столбики активности за неделю (тот же переключатель выше) */}
        <SectionTitle>{period === 'month' ? 'Рост финансовой грамотности' : 'Учебный прогресс'}</SectionTitle>
        <SectionCard>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[13px] font-bold" style={{ color: '#3f9a63' }}>
              {period === 'month' ? `+${growthDelta}% за 4 недели` : `+${weekXpTotal} XP за неделю`}
            </span>
            {period === 'week' && (
              <span
                className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                style={{ background: 'rgba(99,217,139,0.16)', color: '#3f9a63' }}
              >
                ▲ Хороший темп
              </span>
            )}
          </div>
          {period === 'month' ? <GrowthLineChart data={financialGrowthByMonth} /> : <ActivityBarChart data={activityByWeek} />}
        </SectionCard>

        {/* Финансовые навыки */}
        <SectionTitle>Что уже получается</SectionTitle>
        <SectionCard>
          <div className="flex flex-col gap-3">
            {skillStats.map((s) => {
              const colors = SKILL_COLORS[s.status];
              return (
                <div key={s.id}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: colors.badge }}>
                      <MaskIcon src={SKILL_ICONS[s.icon]} color={colors.text} size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold" style={{ color: s.status === 'needs_work' ? colors.text : '#2c2a5e' }}>
                      {s.label}
                      {s.note && <span className="ml-1 font-semibold" style={{ color: colors.text }}>— {s.note}</span>}
                    </span>
                    <span className="shrink-0 text-[12.5px] font-extrabold" style={{ color: '#2c2a5e' }}>
                      {s.percent}%
                    </span>
                  </div>
                  <div className="ml-[42px] mt-1.5 h-[7px] overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.16)' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.percent}%`, background: colors.bar }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Покупки и монеты — реальные данные из economyStore */}
        <SectionTitle>Покупки и монеты</SectionTitle>
        <SectionCard>
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Потрачено
              </div>
              <div className="flex items-center gap-1 text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {totalSpent}
                <img src={coinIcon} alt="" className="h-4 w-4" />
              </div>
            </div>
            <div className="h-9 w-px" style={{ background: '#eeddc3' }} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold" style={{ color: '#9a8f80' }}>
                Баланс
              </div>
              <div className="flex items-center gap-1 text-[16px] font-extrabold" style={{ color: '#2c2a5e' }}>
                {coins}
                <img src={coinIcon} alt="" className="h-4 w-4" />
              </div>
            </div>
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[12px] font-bold transition active:scale-[0.97]"
              style={{ background: '#f0e6d3', color: '#6f6355' }}
            >
              История
              <IconChevronRight className={`h-3.5 w-3.5 transition-transform ${historyOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {historyOpen && (
            <div className="mt-3 flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: '#f0e2cb' }}>
              {recentTransactions.length === 0 ? (
                <p className="text-[12px] leading-snug" style={{ color: '#9a8f80' }}>
                  Транзакций пока нет.
                </p>
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold" style={{ color: '#2c2a5e' }}>
                        {tx.reason}
                      </div>
                      <div className="text-[10px]" style={{ color: '#9a8f80' }}>
                        {formatTxDate(tx.timestamp)}
                      </div>
                    </div>
                    <span
                      className="shrink-0 text-[12.5px] font-extrabold"
                      style={{ color: tx.amount >= 0 ? '#3f9a63' : '#c23a52' }}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </SectionCard>

        {/* Управление */}
        <SectionTitle>Управление</SectionTitle>
        <SectionCard>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold" style={{ color: '#2c2a5e' }}>
                Подтверждение покупок
              </div>
              <div className="mt-0.5 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
                Окно «Точно купить?» перед каждой покупкой (кроме еды)
              </div>
            </div>
            <Toggle
              checked={purchaseConfirmationEnabled}
              onChange={setPurchaseConfirmationEnabled}
              aria-label="Подтверждение покупок"
            />
          </div>
        </SectionCard>
        <p className="mt-2 px-1 text-[11px] leading-snug" style={{ color: '#a99a83' }}>
          Скоро здесь появятся лимит покупок в день и ограничение времени в приложении.
        </p>
      </div>
    </div>
  );
}
