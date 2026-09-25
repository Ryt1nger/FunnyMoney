import { useMemo, useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import piggyIcon from '../assets/piggy-bank/piggy.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import { ECONOMY_RULES, calculatePeriodResult, validateBudgetPlan, type BudgetPlan } from '../core/economy';
import { useEconomyStore } from '../features/economy/economyStore';
import { usePeriodStore } from '../features/economy/periodStore';
import { usePetStore } from '../features/pet/petStore';
import { IconArrowLeft, IconCheck } from '../components/icons';

interface Props { bottomInset?: number; onClose: () => void }

const BLUE = '#111b72';
const VIOLET = 'linear-gradient(135deg, #5268ee 0%, #304bc7 100%)';
const GREEN = 'linear-gradient(180deg, #35d983 0%, #12ae5c 100%)';

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block rounded-[16px] bg-[#f7f5ff] p-3">
    <span className="block text-[10px] font-bold text-[#7379a4]">{label}</span>
    <span className="mt-1 flex items-center gap-1.5">
      <input inputMode="numeric" value={value || ''} onChange={(event) => onChange(Math.max(0, Number(event.target.value.replace(/[^0-9]/g, '')) || 0))} className="min-w-0 flex-1 bg-transparent text-[24px] font-black text-[#111b72] outline-none" />
      <img src={coinIcon} alt="" className="h-5 w-5" />
    </span>
  </label>;
}

export default function Period({ bottomInset = 0, onClose }: Props) {
  const period = usePeriodStore();
  const coins = useEconomyStore((state) => state.coins);
  const savings = useEconomyStore((state) => state.savingsBalance ?? state.totalSaved);
  const applyCoinsDelta = useEconomyStore((state) => state.applyCoinsDelta);
  const deposit = useEconomyStore((state) => state.depositToSavings);
  const addXp = usePetStore((state) => state.addXp);
  const [plan, setPlan] = useState<BudgetPlan>({ mandatory: 120, optional: 30, savings: 50 });
  const [message, setMessage] = useState('');
  const validation = useMemo(() => validateBudgetPlan(ECONOMY_RULES.periodIncome, plan), [plan]);
  const result = period.result ?? (period.status === 'active' ? calculatePeriodResult(period) : undefined);

  function confirm() {
    const accepted = period.confirmPlan(plan);
    if (accepted) usePetStore.getState().addXp(ECONOMY_RULES.planRewardXp);
    setMessage(accepted ? 'План принят. Теперь можно покупать и копить.' : 'Проверь план: все три категории должны быть заполнены, а сумма — не больше дохода.');
  }

  function save() {
    if (period.rewardFlags.savingsDepositGranted) {
      setMessage('Обязательные 100 монет уже внесены в этом периоде.');
      return;
    }
    setMessage(deposit(ECONOMY_RULES.requiredSavingsDeposit) ? '100 монет отправлены в копилку.' : 'Нужно иметь 100 монет в кошельке.');
  }

  function claimDailyReward() {
    if (!usePeriodStore.getState().markDailyRewardGranted()) {
      setMessage('Ежедневная помощь уже получена в этом периоде.');
      return;
    }
    applyCoinsDelta(ECONOMY_RULES.dailyRewardCoins, 'Ежедневная помощь', { periodId: period.id, category: 'reward' });
    addXp(ECONOMY_RULES.dailyRewardXp);
    setMessage(`+${ECONOMY_RULES.dailyRewardCoins} монет и +${ECONOMY_RULES.dailyRewardXp} XP за Daily.`);
  }

  function finish() {
    usePeriodStore.getState().completePeriod();
    setMessage('Период завершён. Посмотри результат и следующий шаг.');
  }

  function next() {
    applyCoinsDelta(period.income, 'Доход нового периода', { periodId: period.id + 1, category: 'reward' });
    const nextWallet = useEconomyStore.getState().coins;
    usePeriodStore.getState().advancePeriod(nextWallet, savings);
    setMessage(`Новый период начался. Доход +${period.income} монет.`);
  }

  return <div className="h-full overflow-y-auto bg-[#f8f4ec] px-3 pt-[calc(env(safe-area-inset-top,0px)+10px)]" style={{ paddingBottom: bottomInset + 18, color: BLUE }}>
    <header className="mb-3 flex h-9 items-center justify-between">
      <button onClick={onClose} aria-label="Назад" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4650ad] shadow-sm"><IconArrowLeft className="h-4 w-4" /></button>
      <div className="text-center"><h1 className="text-[19px] font-black">Игровой период</h1><p className="text-[10px] font-bold text-[#7d82ae]">Период {period.id} · доход {period.income} монет</p></div>
      <div className="h-8 w-8" />
    </header>

    <section className="flex items-center gap-3 rounded-[22px] bg-white p-3.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
      <img src={bearAvatar} alt="" className="h-12 w-12 rounded-full" />
      <div className="min-w-0 flex-1"><div className="text-[14px] font-black">Твой финансовый план</div><div className="mt-1 text-[10px] font-semibold text-[#7d82ae]">Сначала реши, что важно купить, а потом трать монеты.</div></div>
      <div className="flex items-center gap-1 text-[13px] font-black"><img src={coinIcon} alt="" className="h-5 w-5" />{coins}</div>
    </section>

    {period.status === 'planning' && <>
      <section className="mt-2.5 rounded-[22px] bg-white p-3.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
        <h2 className="text-[17px] font-black">Распредели 200 монет</h2><p className="mt-1 text-[10px] font-semibold text-[#7d82ae]">В каждой категории должна быть хотя бы небольшая сумма.</p>
        <div className="mt-3 grid grid-cols-3 gap-2"><NumberField label="Обязательное" value={plan.mandatory} onChange={(value) => setPlan({ ...plan, mandatory: value })} /><NumberField label="Желания" value={plan.optional} onChange={(value) => setPlan({ ...plan, optional: value })} /><NumberField label="Накопления" value={plan.savings} onChange={(value) => setPlan({ ...plan, savings: value })} /></div>
        <div className={`mt-2 text-[10px] font-bold ${validation.valid ? 'text-[#12ae5c]' : 'text-[#ed4e5d]'}`}>{validation.valid ? `Останется свободно: ${validation.remaining} монет` : 'Проверь суммы категорий'}</div>
        <button disabled={!validation.valid} onClick={confirm} className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-[14px] text-[12px] font-extrabold text-white disabled:opacity-40" style={{ background: VIOLET }}><IconCheck className="h-4 w-4" />Подтвердить план</button>
      </section>
    </>}

    {period.status === 'active' && <>
      <section className="mt-2.5 grid grid-cols-2 gap-2.5"><div className="rounded-[20px] bg-white p-3 shadow-sm"><div className="text-[10px] font-bold text-[#7d82ae]">В кошельке</div><div className="mt-1 flex items-center gap-1 text-[25px] font-black"><img src={coinIcon} alt="" className="h-6 w-6" />{coins}</div></div><div className="rounded-[20px] bg-[#f7f2ff] p-3 shadow-sm"><div className="text-[10px] font-bold text-[#7d82ae]">В копилке</div><div className="mt-1 flex items-center gap-1 text-[25px] font-black"><img src={piggyIcon} alt="" className="h-6 w-6" />{savings}</div></div></section>
      <section className="mt-2.5 rounded-[22px] bg-white p-3.5 shadow-sm"><h2 className="text-[17px] font-black">Прогресс периода</h2><div className="mt-3 space-y-2 text-[11px] font-bold"><div className="flex justify-between"><span>Обязательные покупки</span><span>{period.actual.mandatory} / {period.plan?.mandatory ?? 0}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#eeeaf7]"><div className="h-full rounded-full bg-[#f3b94c]" style={{ width: `${Math.min(100, Math.round((period.actual.mandatory / Math.max(1, period.plan?.mandatory ?? 1)) * 100))}%` }} /></div><div className="flex justify-between"><span>Дополнительные покупки</span><span>{period.actual.optional} / {period.plan?.optional ?? 0}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#eeeaf7]"><div className="h-full rounded-full bg-[#8b88f4]" style={{ width: `${Math.min(100, Math.round((period.actual.optional / Math.max(1, period.plan?.optional ?? 1)) * 100))}%` }} /></div><div className="flex justify-between"><span>Обязательное накопление</span><span>{period.actual.savings} / {ECONOMY_RULES.requiredSavingsDeposit}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-[#eeeaf7]"><div className="h-full rounded-full bg-[#35d983]" style={{ width: `${Math.min(100, Math.round((period.actual.savings / ECONOMY_RULES.requiredSavingsDeposit) * 100))}%` }} /></div></div><button onClick={claimDailyReward} disabled={period.rewardFlags.dailyRewardGranted} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#fff4d8] text-[11px] font-extrabold text-[#a16a13] disabled:opacity-50">{period.rewardFlags.dailyRewardGranted ? 'Daily уже получен' : `Получить Daily +${ECONOMY_RULES.dailyRewardCoins}`}</button><button onClick={save} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#edf9f1] text-[11px] font-extrabold text-[#159456]">Внести 100 монет в копилку</button><button onClick={finish} className="mt-2 flex h-10 w-full items-center justify-center rounded-[14px] text-[11px] font-extrabold text-white" style={{ background: GREEN }}>Завершить период</button></section>
    </>}

    {period.status === 'completed' && result && <section className="mt-2.5 rounded-[22px] bg-white p-4 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf9ef] text-[28px]">★</div><h2 className="mt-2 text-[21px] font-black">Период завершён</h2><div className="mt-1 text-[12px] font-bold text-[#7d82ae]">Твой результат</div><div className="mt-3 text-[42px] font-black text-[#12ae5c]">{result.score}<span className="text-[18px]">/100</span></div><div className="mt-2 rounded-[15px] bg-[#f7f5ff] p-3 text-left text-[11px] font-bold">{result.mandatoryCovered ? '✓ Обязательные покупки закрыты' : '○ Нужно не забыть обязательные покупки'}<br />{result.savingsRegular ? '✓ Накопление выполнено' : '○ Попробуй отложить 100 монет'}<br />Следующий шаг: {result.nextStep === 'choose_optional_purchase' ? 'можно выбрать желание' : 'продолжай копить'}</div><button onClick={next} className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] text-[12px] font-extrabold text-white" style={{ background: VIOLET }}>Начать следующий период</button></section>}
    {message && <div className="mt-2.5 rounded-[14px] bg-[#fff7db] px-3 py-2.5 text-center text-[10px] font-bold text-[#8a6a18]">{message}</div>}
  </div>;
}
