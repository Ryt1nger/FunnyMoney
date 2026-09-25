import { useEffect, useState } from 'react';
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
    { label: 'Доход', value: income, bg: '#e6f9ee', icon: <IconCoinStack className="h-6 w-6 text-[#22a35a]" /> },
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

export default function Period({ bottomInset = 0, onClose }: Props) {
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
  // Черновик распределения — заполняется кнопкой "Распределить" и живёт
  // только на экране, пока игрок не нажмёт "Подтвердить" (тогда он уходит в
  // period.confirmPlan и становится настоящим planом периода).
  const [draftPlan, setDraftPlan] = useState<BudgetPlan | null>(null);
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

  // Сбрасываем черновик при уходе с вкладки планирования или после того, как
  // план уже подтверждён реальным стором — чтобы не показывать чужие цифры.
  useEffect(() => {
    if (!(isCurrent && status === 'planning')) {
      setDraftPlan(null);
    }
  }, [tab, isCurrent, status]);

  const plan = isCurrent ? period.plan : isPast ? { mandatory: 0, optional: 0, savings: 0 } : null;
  const income = isLocked ? 0 : isCurrent ? period.income : content.rewardCoins * 5; // грубая оценка для прошлых периодов — см. комментарий выше
  const doneCount = status === 'completed' ? content.events.length : status === 'active' ? 1 : 0;
  const displayPlan = isCurrent && status === 'planning' && draftPlan ? draftPlan : plan;
  const draftValidation = draftPlan ? validateBudgetPlan(income, draftPlan) : null;
  const showPlanButtons = isCurrent && status === 'planning';

  function handleDistribute() {
    // Разумный дефолт: обязательное/желания/накопления, сумма равна доходу
    // периода (200), остаток 0 — игрок может отредактировать позже, когда
    // появится ручной ввод; пока это "хороший и понятный фронт".
    setDraftPlan({ mandatory: 120, optional: 30, savings: 50 });
  }

  function handleConfirm() {
    if (!draftPlan || !draftValidation?.valid) return;
    period.confirmPlan(draftPlan);
    usePetStore.getState().addXp(ECONOMY_RULES.planRewardXp);
    setDraftPlan(null);
  }

  function ctaLabel() {
    if (status === 'locked') return 'Пока недоступно';
    return 'Продолжить игру';
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8f4ec]" style={{ paddingBottom: bottomInset + 18 }}>
      {/* Шапка — фон-иллюстрация периода, заголовок раздела статичен (не
          меняется от вкладки), кнопка назад и счётчик монет — поверх неё. */}
      <div className="relative h-[230px] w-full overflow-hidden">
        <img src={content.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Тёмная плёнка сверху и снизу — не даёт кнопке "назад" и счётчику
            монет "слипаться" со светлыми участками фона (небо, окно и т.п.
            на некоторых иллюстрациях) и добавляет визуальный отступ от
            самого верха экрана. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/0 to-transparent bg-no-repeat"
          style={{ backgroundSize: '100% 110px', backgroundPosition: 'top' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-black/5" />
        <div
          className="relative z-10 flex items-center justify-between px-3.5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top,0px)+30px)' }}
        >
          <button onClick={onClose} aria-label="Назад" className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
            <IconArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div className="flex items-center gap-1.5 rounded-full bg-black/35 py-1 pl-2 pr-1 text-white backdrop-blur-sm">
            <img src={coinIcon} alt="" className="h-5 w-5" />
            <span className="text-[13px] font-black">{coins}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5d6cfc]"><IconPlus className="h-3.5 w-3.5 text-white" /></span>
          </div>
        </div>
        <div className="relative z-10 mt-3 px-4 text-white">
          <h1 className="text-[26px] font-black leading-none drop-shadow">Периоды</h1>
          <p className="mt-1.5 max-w-[210px] text-[11px] font-semibold leading-snug text-white/90 drop-shadow">
            Сюжетные истории, где каждый выбор влияет на результат.
          </p>
        </div>
      </div>

      <div className="px-3 pt-3">
        {/* Переключатель периодов — прогресс-бар в стиле уроков: пройденные и
            текущий period доступны, будущие показаны с замком. */}
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
            периодов и заблокированных — тоже "—". */}
        <div className="mt-2.5 rounded-[22px] bg-white p-3.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] font-black" style={{ color: BLUE }}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef0ff] text-[#5d6cfc]">◐</span>
              Распределение
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eceef7] text-[10px] font-black text-[#8a8fbf]">?</span>
          </div>
          <DistributionGrid plan={isLocked ? null : displayPlan} income={isLocked ? 0 : income} />
          {showPlanButtons && (
            <div className="mt-3 space-y-1.5">
              <button
                onClick={handleDistribute}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[14px] border-2 text-[12.5px] font-extrabold"
                style={{ borderColor: '#5d6cfc', color: '#3f4fd8' }}
              >
                Распределить
              </button>
              <button
                disabled={!draftPlan || !draftValidation?.valid}
                onClick={handleConfirm}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[14px] text-[12.5px] font-extrabold text-white disabled:bg-[#d9d4c6] disabled:text-[#a29c8c]"
                style={{ background: draftPlan && draftValidation?.valid ? GRADIENT_BLUE : undefined }}
              >
                Подтвердить
              </button>
            </div>
          )}
        </div>

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
            {content.events.map((event, i) => (
              <EventRow
                key={event.id}
                event={event}
                state={status === 'locked' ? 'locked' : status === 'completed' ? 'done' : i === 0 ? 'done' : 'pending'}
              />
            ))}
          </div>
          {status === 'locked' && (
            <div className="mt-2.5 flex items-center gap-2 rounded-[14px] bg-[#eceef7] px-3 py-2 text-[10.5px] font-bold text-[#8a8fbf]">
              <IconLock className="h-3.5 w-3.5 shrink-0" />
              Откроется после периода {tab - 1}
            </div>
          )}
          {(status === 'planning' || status === 'active') && (
            <div className="mt-2.5 flex items-center gap-2 rounded-[14px] bg-[#e8f1ff] px-3 py-2 text-[10.5px] font-bold text-[#3b6fe0]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3b6fe0] text-white">i</span>
              События появляются в игре как модальные окна по ходу периода.
            </div>
          )}
        </div>

        {/* Кнопку внизу больше не показываем на статусе "planning" — там её
            заменяет связка Распределить/Подтвердить в карточке выше. */}
        {status !== 'planning' && (
          <button
            disabled={status === 'locked'}
            onClick={onClose}
            className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-[16px] text-[13px] font-extrabold text-white disabled:bg-[#d9d4c6] disabled:text-[#a29c8c]"
            style={{ background: status === 'locked' ? undefined : GRADIENT_BLUE }}
          >
            {ctaLabel()}
            {status !== 'locked' && <IconChevronRight className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
