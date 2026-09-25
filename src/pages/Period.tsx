import { useEffect, useState, type ReactNode } from 'react';
import { useEconomyStore } from '../features/economy/economyStore';
import { usePeriodStore } from '../features/economy/periodStore';
import { usePetStore } from '../features/pet/petStore';
import { ECONOMY_RULES, validateBudgetPlan, type BudgetPlan } from '../core/economy';
import { PERIODS, type PeriodContent } from '../data/periodsData';
import { IconArrowLeft, IconPlus, IconLock, IconCheck, IconStar, IconHome, IconHeart, IconPiggy, IconCoinStack, IconChevronRight } from '../components/icons';
import coinIcon from '../assets/icons/coin.png';

interface Props {
  bottomInset?: number;
  onClose: () => void;
  onOpenPiggy?: (amount: number) => void;
}

// Цвета взяты из референса дизайна (см. присланные скриншоты «Периоды»).
const BLUE = '#111b72';
const GRADIENT_BLUE = 'linear-gradient(135deg, #6c7bf5 0%, #3f4fd8 100%)';

function CoinValue({ value }: { value: number | null }) {
  return (
    <span className="flex items-center gap-1 text-[15px] font-black" style={{ color: BLUE }}>
      <img src={coinIcon} alt="" className="h-[18px] w-[18px]" />
      {value === null ? '—' : value}
    </span>
  );
}

// Четыре карточки распределения бюджета — иконка + подпись + сумма (или "—",
// пока план периода ещё не подтверждён). "Остаток" убрали по просьбе —
// это была пятая карточка, которая не помещалась в ряд и вылезала за края.
function DistributionGrid({ plan, income }: { plan: { mandatory: number; optional: number; savings: number } | null; income: number }) {
  const items = [
    { label: 'Обязательное', value: plan?.mandatory ?? null, bg: '#e8f0ff', icon: <IconHome className="h-6 w-6 text-[#3b6fe0]" /> },
    { label: 'Желания', value: plan?.optional ?? null, bg: '#ffe9ef', icon: <IconHeart className="h-6 w-6 text-[#ef4b6b]" /> },
    { label: 'Накопления', value: plan?.savings ?? null, bg: '#f1e9ff', icon: <IconPiggy className="h-6 w-6 text-[#8b5cf6]" /> },
    { label: 'В кошельке', value: income, bg: '#e6f9ee', icon: <IconCoinStack className="h-6 w-6 text-[#22a35a]" /> },
  ];
  return (
    <div className="mt-3 grid grid-cols-4 gap-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1 rounded-[16px] px-1 py-2.5 text-center" style={{ background: item.bg }}>
          {item.icon}
          <span className="text-[9.5px] font-bold leading-tight" style={{ color: BLUE }}>{item.label}</span>
          <CoinValue value={item.value} />
        </div>
      ))}
    </div>
  );
}

function DistributionInputRow({
  icon,
  label,
  bg,
  value,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  bg: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[16px] p-2.5" style={{ background: bg }}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70">{icon}</span>
      <span className="flex-1 text-[11.5px] font-extrabold" style={{ color: BLUE }}>{label}</span>
      <div className="flex h-10 w-[104px] shrink-0 items-center rounded-[12px] bg-white px-2.5">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-right text-[16px] font-black outline-none"
          style={{ color: BLUE }}
        />
        <img src={coinIcon} alt="" className="ml-1 h-4 w-4" />
      </div>
    </div>
  );
}

function EventRow({ event, state }: { event: PeriodContent['events'][number]; state: 'done' | 'pending' | 'locked' }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[16px] bg-[#f7f5ff] p-2">
      <img src={event.image} alt="" className={`h-11 w-11 shrink-0 rounded-[12px] object-cover ${state === 'locked' ? 'grayscale opacity-60' : ''}`} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11.5px] font-extrabold" style={{ color: BLUE }}>{event.title}</div>
        {event.subtitle && <div className="truncate text-[9.5px] font-semibold text-[#8a8fbf]">{event.subtitle}</div>}
      </div>
      {state === 'done' && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e7f8ee] text-[#22a35a]"><IconCheck className="h-3.5 w-3.5" /></span>
      )}
      {state === 'locked' && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eceef7] text-[#9a9fc4]"><IconLock className="h-3 w-3" /></span>
      )}
      {state === 'pending' && <IconChevronRight className="h-4 w-4 shrink-0 text-[#b7bce0]" />}
    </div>
  );
}

export default function Period({ bottomInset = 0, onClose, onOpenPiggy }: Props) {
  const coins = useEconomyStore((s) => s.coins);
  const period = usePeriodStore();
  // Текущий доступный период определяется реальным игровым прогрессом
  // (usePeriodStore().id); 1 и 2 периоды впереди него — заблокированы, как
  // и задумано в референсе. Сами события периода (карточки ниже) — пока
  // оформление: в геймплейном сторе ещё нет модели "событий периода",
  // поэтому статусы done/pending подставляются по прогрессу текущего
  // периода, а не хранятся по каждому событию отдельно.
  const currentId = Math.min(3, Math.max(1, period.id));
  const [tab, setTab] = useState<1 | 2 | 3>(currentId as 1 | 2 | 3);
  const [editingPlan, setEditingPlan] = useState(false);
  const [mandatoryInput, setMandatoryInput] = useState('');
  const [optionalInput, setOptionalInput] = useState('');
  const [savingsInput, setSavingsInput] = useState('');
  const [completionError, setCompletionError] = useState('');
  const content = PERIODS[tab - 1];
  const isCurrent = tab === currentId;
  const isPast = tab < currentId;
  // "locked" здесь — только статус отображения (показываем анонс "Что тебя
  // ждёт" и плашку про будущий период). По просьбе пользователя сама вкладка
  // при этом остаётся кликабельной — переключаться между периодами можно
  // свободно, замок — лишь визуальная подсказка, а не блокировка кнопки.
  const status: 'locked' | 'planning' | 'active' | 'completed' = isPast
    ? 'completed'
    : isCurrent
      ? period.status
      : 'locked';
  const isLocked = status === 'locked';
  const pastSummary = period.history?.find((item) => item.id === tab);

  // Выходим из режима ввода при уходе с вкладки планирования или после
  // того, как план уже подтверждён реальным стором — чтобы не показывать
  // чужие цифры на чужом периоде.
  useEffect(() => {
    if (!(isCurrent && status === 'planning')) {
      setEditingPlan(false);
      setMandatoryInput('');
      setOptionalInput('');
      setSavingsInput('');
    }
  }, [tab, isCurrent, status]);

  const plan = isCurrent ? period.plan : isPast ? pastSummary?.plan ?? null : null;
  const income = isLocked ? 0 : isCurrent ? period.walletBalance : pastSummary?.income ?? 0;
  const doneCount = status === 'completed' ? content.events.length : status === 'active' ? 1 : 0;
  const showPlanButtons = isCurrent && status === 'planning';
  const budgetTooSmall = showPlanButtons && income < 3;

  // Черновик из трёх полей ввода — ребёнок вписывает суммы сам, ничего не
  // подставляется автоматически. Валидность считается на каждый рендер:
  // "Остаток" сразу показывает и перебор бюджета, и пустую категорию.
  const draftPlan: BudgetPlan | null = editingPlan ? {
    mandatory: Number(mandatoryInput) || 0,
    optional: Number(optionalInput) || 0,
    savings: Number(savingsInput) || 0,
  } : null;
  const draftTotal = draftPlan ? draftPlan.mandatory + draftPlan.optional + draftPlan.savings : 0;
  const draftRemaining = income - draftTotal;
  const draftValidation = editingPlan && draftPlan ? validateBudgetPlan(income, draftPlan) : null;

  function startEditingPlan() {
    setMandatoryInput('');
    setOptionalInput('');
    setSavingsInput('');
    setEditingPlan(true);
  }

  function cancelEditingPlan() {
    setEditingPlan(false);
    setMandatoryInput('');
    setOptionalInput('');
    setSavingsInput('');
  }

  function handleConfirm() {
    if (!draftPlan || !draftValidation?.valid) return;
    if (period.confirmPlan(draftPlan)) {
      usePetStore.getState().addXp(ECONOMY_RULES.planRewardXp);
      setEditingPlan(false);
      setMandatoryInput('');
      setOptionalInput('');
      setSavingsInput('');
    }
  }

  function handleComplete() {
    if (status !== 'active') return;
    if (!period.completePeriod()) {
      setCompletionError('Сначала пройди два урока темы «Выбор».');
      return;
    }
    if (!period.rewardFlags.periodRewardGranted) {
      useEconomyStore.getState().applyCoinsDelta(content.rewardCoins, `Награда за период ${period.id}`, {
        periodId: period.id,
        category: 'reward',
      });
      usePetStore.getState().addXp(content.rewardXp);
      usePeriodStore.getState().markPeriodRewardGranted();
    }
    setCompletionError('');
  }

  function handleAdvance() {
    if (status !== 'completed') return;
    if (period.id < 3) {
      period.advancePeriod(coins, useEconomyStore.getState().savingsBalance ?? 0);
      setTab((period.id + 1) as 1 | 2 | 3);
      return;
    }
    onClose();
  }

  const distributionCard = (
    <div className="rounded-[22px] bg-white p-3.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-black" style={{ color: BLUE }}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef0ff] text-[#5d6cfc]">◐</span>
          Распределение
        </div>
        {editingPlan ? (
          <button onClick={cancelEditingPlan} className="text-[11px] font-bold text-[#8a8fbf]">
            Отмена
          </button>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eceef7] text-[10px] font-black text-[#8a8fbf]">?</span>
        )}
      </div>

      {editingPlan ? (
        // Режим ручного ввода: ребёнок сам вписывает суммы по трём категориям —
        // ничего не подставляется автоматически. "Остаток" реагирует на ввод
        // сразу же и одновременно ловит и перебор бюджета, и пустую категорию.
        <div className="mt-3 space-y-1.5">
          <p className="text-[10.5px] font-semibold leading-snug text-[#8a8fbf]">
            Впиши, сколько монет отправить в каждую категорию — сумма не должна превышать доход периода.
          </p>
          <DistributionInputRow
            icon={<IconHome className="h-5 w-5 text-[#3b6fe0]" />}
            label="Обязательное"
            bg="#e8f0ff"
            value={mandatoryInput}
            onChange={setMandatoryInput}
          />
          <DistributionInputRow
            icon={<IconHeart className="h-5 w-5 text-[#ef4b6b]" />}
            label="Желания"
            bg="#ffe9ef"
            value={optionalInput}
            onChange={setOptionalInput}
          />
          <DistributionInputRow
            icon={<IconPiggy className="h-5 w-5 text-[#8b5cf6]" />}
            label="Накопления"
            bg="#f1e9ff"
            value={savingsInput}
            onChange={setSavingsInput}
          />

          <div className="flex items-center justify-between rounded-[14px] bg-[#f4f1e6] px-3 py-2">
            <span className="text-[10.5px] font-bold text-[#8a8fbf]">Остаток из {income}</span>
            <span className="text-[13px] font-black" style={{ color: draftRemaining < 0 ? '#ed4e5d' : BLUE }}>
              {draftRemaining}
            </span>
          </div>
          {draftValidation?.error === 'required_categories_missing' && (
            <p className="text-[10px] font-bold text-[#a1740f]">В каждой категории должно быть больше 0.</p>
          )}
          {draftValidation?.error === 'over_budget' && (
            <p className="text-[10px] font-bold text-[#ed4e5d]">Это больше, чем доход периода — уменьши суммы.</p>
          )}

          <button
            disabled={!draftValidation?.valid}
            onClick={handleConfirm}
            className="mt-1 flex h-11 w-full items-center justify-center gap-1.5 rounded-[14px] text-[12.5px] font-extrabold text-white disabled:bg-[#d9d4c6] disabled:text-[#a29c8c]"
            style={{ background: draftValidation?.valid ? GRADIENT_BLUE : undefined }}
          >
            Подтвердить
          </button>
        </div>
      ) : (
        <>
          <DistributionGrid plan={isLocked ? null : plan} income={isLocked ? 0 : income} />
          {status === 'active' && onOpenPiggy && plan && (
            <button
              onClick={() => onOpenPiggy(plan.savings)}
              className="mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] bg-[#f1e9ff] text-[11.5px] font-extrabold text-[#6a4bc7]"
            >
              <IconPiggy className="h-4 w-4" />
              Пополнить копилку по плану
            </button>
          )}
          {showPlanButtons && (
            <div className="mt-3 space-y-1.5">
              <button
                onClick={startEditingPlan}
                disabled={budgetTooSmall}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[14px] border-2 text-[12.5px] font-extrabold disabled:opacity-50"
                style={{ borderColor: '#5d6cfc', color: '#3f4fd8' }}
              >
                Распределить
              </button>
              {budgetTooSmall && (
                <p className="rounded-[12px] bg-[#fff4df] px-3 py-2 text-center text-[10px] font-bold text-[#a1740f]">
                  Сначала заработай монеты в уроках или практике — для плана нужны средства в кошельке.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  function ctaLabel() {
    if (status === 'locked') return 'Пока недоступно';
    if (status === 'active') return 'Завершить период';
    if (status === 'completed' && period.id < 3) return 'Следующий период';
    return 'Продолжить игру';
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f8f4ec]">
      {/* Шапка с иллюстрацией периода — та же схема, что на Магазине/Дне/
          Статистике: фиксированная высота 170px, shrink-0 (не скроллится
          вместе с контентом), кнопка "назад" и баланс монет наложены прямо
          на фото (без отдельной светлой полосы над картинкой), тёмный
          диагональный градиент слева даёт контраст под ними и под заголовком
          независимо от того, что именно на фото. safe-area-topbar + calc()
          с пробелами вокруг "+" — иначе на телефоне с "чёлкой"/островком
          calc() невалиден, браузer отбрасывает paddingTop целиком, и кнопки
          прилипают к самому верху экрана. */}
      <div className="relative h-[170px] shrink-0 overflow-hidden">
        <img src={content.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(17,27,114,0.78) 0%, rgba(17,27,114,0.48) 42%, rgba(17,27,114,0) 68%)',
          }}
        />

        <div
          className="safe-area-topbar relative flex items-start justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        >
          <button
            onClick={onClose}
            aria-label="Назад"
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
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5d6cfc] text-white shadow-md">
              <IconPlus className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="relative mt-3 px-4 text-white">
          <h1 className="text-[26px] font-black leading-none drop-shadow">Периоды</h1>
          <p className="mt-1.5 max-w-[210px] text-[11px] font-semibold leading-snug text-white/90 drop-shadow">
            Сюжетные истории, где каждый выбор влияет на результат.
          </p>
        </div>
      </div>

      {/* Кремовый "лист" со скруглёнными верхними углами наезжает на низ
          иллюстрации (-mt-5), как на Магазине/Дне/Статистике — иначе граница
          между фото и контентом была прямым прямоугольным обрезом. */}
      <div
        className="relative z-10 -mt-5 flex-1 overflow-y-auto rounded-t-[26px] bg-[#f8f4ec] px-3 pt-4"
        style={{ paddingBottom: bottomInset + (editingPlan ? 220 : 18) }}
      >
        {/* В режиме ручного ввода карточка "Распределение" поднимается на
            самый верх светлой секции (как ввод суммы в Копилке), а всё
            остальное — переключатель периодов, карточка периода, события —
            сворачивается ниже, освобождая место под клавиатуру. */}
        {editingPlan && <div className="mb-2.5">{distributionCard}</div>}

        <div
          className={`overflow-hidden transition-all duration-300 ${
            editingPlan ? 'pointer-events-none max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
          }`}
        >
          {/* Переключатель периодов — прогресс-бар в стиле уроков: пройденные
              и текущий period доступны, будущие показаны с замком. */}
          <div className="flex gap-1.5">
            {PERIODS.map((p) => {
              const locked = p.id > currentId;
              const active = p.id === tab;
              return (
                <button
                  key={p.id}
                  onClick={() => setTab(p.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 px-1.5 text-[11.5px] font-extrabold transition"
                  style={{ background: active ? GRADIENT_BLUE : '#f1ede1', color: active ? '#fff' : '#8f8a7c' }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                    style={{ background: active ? '#fff' : '#d8d2c2', color: active ? '#3f4fd8' : '#fff' }}
                  >
                    {p.id}
                  </span>
                  <span className="truncate">Период {p.id}</span>
                  {locked && <IconLock className="h-3 w-3 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Карточка периода: картинка, заголовок/описание, прогресс по
              событиям и награды за прохождение. */}
          <div className="mt-3 rounded-[22px] bg-white p-3 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
            <div className="flex gap-3">
              <img src={content.card} alt="" className="h-[92px] w-[92px] shrink-0 rounded-[16px] object-cover" />
              <div className="min-w-0">
                <div className="text-[12px] font-black" style={{ color: BLUE }}>Период {content.id}</div>
                <div className="text-[15px] font-black leading-tight" style={{ color: BLUE }}>{content.subtitle}</div>
                <p className="mt-1 text-[10.5px] font-semibold leading-snug text-[#8a8fbf]">{content.description}</p>
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color: BLUE }}>
                  <IconStar className="h-4 w-4 text-[#7c6cf5]" />
                  {doneCount} из {content.events.length} событий
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eeeaf7]">
                  <div className="h-full rounded-full bg-[#7c6cf5]" style={{ width: `${Math.round((doneCount / content.events.length) * 100)}%` }} />
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <div className="flex items-center gap-1 rounded-[12px] bg-[#fff6df] px-2 py-1.5">
                  <img src={coinIcon} alt="" className="h-4 w-4" />
                  <span className="text-[11px] font-black text-[#a1740f]">+{content.rewardCoins}</span>
                </div>
                <div className="flex items-center gap-1 rounded-[12px] bg-[#f1ecff] px-2 py-1.5">
                  <IconStar className="h-3.5 w-3.5 text-[#7c6cf5]" />
                  <span className="text-[11px] font-black text-[#5c4bc9]">+{content.rewardXp}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Распределение бюджета — реальные цифры для текущего периода
              (из usePeriodStore), "—" пока план не подтверждён, для будущих
              периодов и заблокированных — тоже "—". Сама карточка — тот же
              distributionCard, что и наверху в режиме ввода: здесь она просто
              стоит на обычном месте, пока editingPlan === false. */}
          <div className="mt-2.5">{distributionCard}</div>
          {isPast && pastSummary && (
            <div className="mt-2.5 rounded-[18px] bg-[#f1f8f3] px-3 py-2.5 text-[10.5px] font-bold text-[#24754b]">
              Факт периода: обязательное {pastSummary.actual.mandatory}, желания {pastSummary.actual.optional}, накопления {pastSummary.actual.savings}. Остаток в кошельке: {pastSummary.endingWalletBalance}.
            </div>
          )}

          {/* События периода: список меняется по статусу — locked показывает
              анонс ("Что тебя ждёт"), planning/active — что появится в игре,
              completed — что уже сделано. */}
          <div className="mt-2.5 rounded-[22px] bg-white p-3.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-black" style={{ color: BLUE }}>
              {status === 'completed' ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e7f8ee] text-[#22a35a]"><IconCheck className="h-3.5 w-3.5" /></span>
              ) : status === 'locked' ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef0ff] text-[#5d6cfc]"><IconStar className="h-3.5 w-3.5" /></span>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef0ff] text-[#5d6cfc]">☰</span>
              )}
              {status === 'completed' ? 'Что уже сделано' : status === 'locked' ? 'Что тебя ждёт' : 'События периода'}
            </div>
            <div className="space-y-1.5">
              {status !== 'locked' && status !== 'completed' && doneCount === 0 && (
                <p className="rounded-[14px] bg-[#f7f5ff] px-3 py-3 text-center text-[10.5px] font-bold text-[#8a8fbf]">
                  Пройденных событий пока нет — они появятся здесь по ходу периода.
                </p>
              )}
              {content.events
                .map((event, i) => ({
                  event,
                  // locked — превью всего списка ("Что тебя ждёт"), completed —
                  // всё пройдено. В остальных статусах в списке остаются только
                  // уже пройденные события (i < doneCount), непройденные не
                  // показываем — их порядок и появление определяет сама игра.
                  state: (status === 'locked' ? 'locked' : 'done') as 'done' | 'pending' | 'locked',
                  visible: status === 'locked' || status === 'completed' || i < doneCount,
                }))
                .filter(({ visible }) => visible)
                .map(({ event, state }) => (
                  <EventRow key={event.id} event={event} state={state} />
                ))}
            </div>
            {status === 'locked' && (
              <div className="mt-2.5 flex items-center gap-2 rounded-[14px] bg-[#eceef7] px-3 py-2 text-[10.5px] font-bold text-[#8a8fbf]">
                <IconLock className="h-3.5 w-3.5 shrink-0" />
                Откроется после периода {tab - 1}
              </div>
            )}
          </div>

          {/* Кнопку внизу больше не показываем на статусе "planning" — там её
              заменяет связка Распределить/Подтвердить в карточке выше. */}
          {status !== 'planning' && (
            <>
            {completionError && status === 'active' && (
              <p className="mt-3 rounded-[14px] bg-[#fff4df] px-3 py-2 text-center text-[10.5px] font-bold text-[#a1740f]">{completionError}</p>
            )}
            <button
              disabled={status === 'locked'}
              onClick={status === 'active' ? handleComplete : status === 'completed' ? handleAdvance : onClose}
              className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-[16px] text-[13px] font-extrabold text-white disabled:bg-[#d9d4c6] disabled:text-[#a29c8c]"
              style={{ background: status === 'locked' ? undefined : GRADIENT_BLUE }}
            >
            {ctaLabel()}
            {status !== 'locked' && <IconChevronRight className="h-4 w-4" />}
            </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
