import { useMemo, useState, type ReactNode } from 'react';
import bearAvatar from '../assets/pet/bear-avatar.png';
import coinIcon from '../assets/icons/coin.png';
import catFood from '../assets/icons/shop/cat-food.png';
import catToys from '../assets/icons/shop/cat-toys.png';
import catClothes from '../assets/icons/shop/cat-clothes.png';
import catInterior from '../assets/icons/shop/cat-interior.png';
import MaskIcon from '../components/MaskIcon';
import Toggle from '../components/Toggle';
import { IconArrowLeft, IconSettingsGear, IconChevronRight } from '../components/icons';
import { progressLevels, MAX_LEVEL } from '../data/progressLevels';
import { earnedByDay, earnedByWeek, purchasesByCategory, type PurchaseCategoryId, type ChartPoint } from '../data/parentDashboardData';
import { dayTasks } from '../data/dayData';
import { usePetStore } from '../features/pet/petStore';
import { useEconomyStore } from '../features/economy/economyStore';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { useDayProgressStore } from '../features/progress/dayProgressStore';
import { useSettingsStore } from '../features/settings/settingsStore';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const VIOLET_SOLID = '#7574f0';

const CATEGORY_ICONS: Record<PurchaseCategoryId, string> = {
  food: catFood,
  toys: catToys,
  clothes: catClothes,
  rooms: catInterior,
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

/** Линия по неделям — точек мало (4), значения подписаны прямо на графике вместо
 * отдельной всплывающей подсказки. Один ряд — легенда не нужна, заголовок карточки
 * и так называет метрику. Шкала считается от реальных данных, а не фиксирована. */
function EarnedLineChart({ data }: { data: ChartPoint[] }) {
  const width = 300;
  const height = 108;
  const padX = 18;
  const padTop = 22;
  const padBottom = 20;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...data.map((d) => d.value), 1);

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Заработанные монеты по неделям">
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b88f4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8b88f4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={padX} y1={padTop + innerH} x2={width - padX} y2={padTop + innerH} stroke="rgba(120,110,150,0.18)" strokeWidth="1" />
      <path d={areaPath} fill="url(#growthFill)" />
      <path d={linePath} fill="none" stroke={VIOLET_SOLID} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={VIOLET_SOLID} strokeWidth="2.5" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2c2a5e">
            {p.value}
          </text>
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="9" fill="#9a8f80">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Столбики по дням — простые div'ы, как остальные полосы прогресса в приложении. */
function EarnedBarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-[92px] items-end gap-2">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-[68px] w-full items-end overflow-hidden rounded-[8px]" style={{ background: 'rgba(120,110,150,0.12)' }}>
            <div
              className="w-full rounded-[8px]"
              style={{ height: d.value > 0 ? `${Math.max(6, (d.value / max) * 100)}%` : '0%', background: VIOLET }}
            />
          </div>
          <span className="text-[10px] font-semibold capitalize" style={{ color: '#9a8f80' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatTxDate(timestamp: number) {
  const d = new Date(timestamp);
  return (
    d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
    ' · ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  );
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
  // Реальные уровень/опыт — раньше здесь были захардкоженные CURRENT_LEVEL/
  // CURRENT_XP (всегда 1/0), теперь берём из petStore (см. addXp в Day.tsx).
  const currentLevel = pet?.level ?? 1;
  const currentXp = pet?.xp ?? 0;
  const xpToNext = progressLevels[Math.min(currentLevel, MAX_LEVEL) - 1].xpThreshold;
  const currentLevelTitle = progressLevels[Math.min(currentLevel, MAX_LEVEL) - 1].title;
  const xpPercent = Math.min(100, Math.round((currentXp / xpToNext) * 100));
  // Купленные комнаты — минус стартовая, которой владеешь по умолчанию, а не купил сам.
  const boughtRoomsCount = Math.max(0, ownedRoomIds.length - 1);
  const purchasesCount = ownedProductIds.length + boughtRoomsCount;
  const tasksDoneToday = completedTaskIds.length;

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8),
    [transactions],
  );

  const weekChart = useMemo(() => earnedByDay(transactions, 7), [transactions]);
  const monthChart = useMemo(() => earnedByWeek(transactions, 4), [transactions]);
  const categories = useMemo(() => purchasesByCategory(ownedProductIds, boughtRoomsCount), [ownedProductIds, boughtRoomsCount]);
  const categoriesTotal = Math.max(1, categories.reduce((sum, c) => sum + c.count, 0));

  const weekTotal = weekChart.reduce((sum, d) => sum + d.value, 0);
  const monthDelta = monthChart[monthChart.length - 1].value - monthChart[0].value;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      {/* Шапка — тот же бежевый фон, что и весь экран, без отдельной плашки цвета. */}
      <div
        className="flex shrink-0 items-center justify-between px-4 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
          style={{ color: '#2c2a5e' }}
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Родительский кабинет
        </h1>
        <button
          onClick={onOpenZone}
          aria-label="Служебная информация"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
          style={{ color: '#2c2a5e' }}
        >
          <IconSettingsGear className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingBottom: bottomInset + 24 }}>
        {/* Карточка ребёнка */}
        <SectionCard>
          <div className="flex items-center gap-3">
            <img src={bearAvatar} alt={petName} className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md" />
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                {petName}
              </div>
              <div className="text-[12.5px] font-semibold" style={{ color: '#7b7a8c' }}>
                Уровень {currentLevel} · {currentLevelTitle}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-[8px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.18)' }}>
                  <div className="h-full rounded-full" style={{ width: `${xpPercent}%`, background: VIOLET }} />
                </div>
                <span className="shrink-0 text-[11px] font-bold" style={{ color: '#5c5876' }}>
                  {currentXp} / {xpToNext} XP
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

        {/* График заработанных монет — по дням за неделю или по неделям за месяц */}
        <SectionTitle>Заработано монет</SectionTitle>
        <SectionCard>
          <div className="mb-1 flex items-center justify-between">
            <span
              className="text-[13px] font-bold"
              style={{ color: period === 'month' ? (monthDelta >= 0 ? '#3f9a63' : '#c23a52') : '#3f9a63' }}
            >
              {period === 'month'
                ? `${monthDelta >= 0 ? '+' : ''}${monthDelta} монет за 4 недели`
                : `+${weekTotal} монет за неделю`}
            </span>
            {period === 'week' && weekTotal > 0 && (
              <span
                className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                style={{ background: 'rgba(99,217,139,0.16)', color: '#3f9a63' }}
              >
                Есть активность
              </span>
            )}
          </div>
          {period === 'month' ? <EarnedLineChart data={monthChart} /> : <EarnedBarChart data={weekChart} />}
        </SectionCard>

        {/* Покупки по категориям — реальные данные из инвентаря */}
        <SectionTitle>Покупки по категориям</SectionTitle>
        <SectionCard>
          {purchasesCount === 0 ? (
            <p className="text-[12.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Пока ничего не куплено — покупки появятся здесь.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {categories.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(139,136,244,0.14)' }}>
                      <MaskIcon src={CATEGORY_ICONS[c.id]} color={VIOLET_SOLID} size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold" style={{ color: '#2c2a5e' }}>
                      {c.label}
                    </span>
                    <span className="shrink-0 text-[12.5px] font-extrabold" style={{ color: '#2c2a5e' }}>
                      {c.count}
                    </span>
                  </div>
                  <div className="ml-[42px] mt-1.5 h-[7px] overflow-hidden rounded-full" style={{ background: 'rgba(120,110,150,0.16)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.count / categoriesTotal) * 100}%`, background: VIOLET_SOLID }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Покупки и монеты — реальные данные из economyStore */}
        <SectionTitle>Монеты</SectionTitle>
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
                    <span className="shrink-0 text-[12.5px] font-extrabold" style={{ color: tx.amount >= 0 ? '#3f9a63' : '#c23a52' }}>
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
            <Toggle checked={purchaseConfirmationEnabled} onChange={setPurchaseConfirmationEnabled} aria-label="Подтверждение покупок" />
          </div>
        </SectionCard>
        <p className="mt-2 px-1 text-[11px] leading-snug" style={{ color: '#a99a83' }}>
          Скоро здесь появятся лимит покупок в день и ограничение времени в приложении.
        </p>
      </div>
    </div>
  );
}
