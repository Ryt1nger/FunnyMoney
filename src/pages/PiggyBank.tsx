import { useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import walletAsset from '../assets/piggy-bank/wallet.png';
import piggyAsset from '../assets/piggy-bank/piggy.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import catToys from '../assets/icons/shop/cat-toys.png';
import catClothes from '../assets/icons/shop/cat-clothes.png';
import catInterior from '../assets/icons/shop/cat-interior.png';
import { productsByCategory, roomsBySection, type ShopCategoryId } from '../data/shopData';
import { useEconomyStore } from '../features/economy/economyStore';
import { IconArrowLeft, IconCheck } from '../components/icons';

const BLUE = '#111b72';
const VIOLET = 'linear-gradient(135deg, #5268ee 0%, #304bc7 100%)';
const GREEN = 'linear-gradient(180deg, #35d983 0%, #12ae5c 100%)';
const amountTextSize = (value: number) => value >= 100000 ? 'text-[20px]' : value >= 10000 ? 'text-[23px]' : 'text-[28px]';
const tabs: { id: ShopCategoryId | 'rooms'; label: string; icon: string }[] = [
  { id: 'toys', label: 'Игрушки', icon: catToys },
  { id: 'interior', label: 'Интерьер', icon: catInterior },
  { id: 'clothes', label: 'Одежда', icon: catClothes },
];
interface Props { bottomInset?: number; coins: number; onClose: () => void; onOpenEarnModal?: () => void }

export default function PiggyBank({ bottomInset = 0, coins, onClose }: Props) {
  const goal = useEconomyStore((s) => s.savingsGoal);
  const saved = useEconomyStore((s) => s.savingsBalance ?? s.totalSaved);
  const transactions = useEconomyStore((s) => s.transactions);
  const setGoal = useEconomyStore((s) => s.setSavingsGoal);
  const depositToSavings = useEconomyStore((s) => s.depositToSavings);
  const withdrawFromSavings = useEconomyStore((s) => s.withdrawFromSavings);
  const [choosing, setChoosing] = useState(false);
  const [transferMode, setTransferMode] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [historyTab, setHistoryTab] = useState<'income' | 'expense'>('income');
  const [tab, setTab] = useState<ShopCategoryId | 'rooms'>('toys');
  const goalName = goal?.name ?? '';
  const goalPrice = goal?.price ?? 0;
  const currentSaved = saved;
  const percent = Math.min(100, Math.round((currentSaved / Math.max(goalPrice, 1)) * 100));
  const transferValue = Number(amount);
  const transferAllowed = Boolean(
    transferMode &&
      Number.isInteger(transferValue) &&
      transferValue > 0 &&
      (transferMode === 'deposit' ? transferValue <= coins : transferValue <= currentSaved),
  );
  const products = tab === 'interior' || tab === 'rooms'
    ? [...roomsBySection('playroom'), ...roomsBySection('kitchen')].filter((room) => room.price > 0).map((room) => ({ id: room.id, name: room.name, price: room.price, image: room.background, kind: 'interior' as const }))
    : productsByCategory(tab).map((product) => ({ id: product.id, name: product.name, price: product.price, image: product.image, kind: product.category as 'toys' | 'clothes' | 'interior' }));

  if (choosing) return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbf8f1]" style={{ color: BLUE }}>
      <div className="flex items-center gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <button onClick={() => setChoosing(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IconArrowLeft className="h-5 w-5" /></button>
        <div><h1 className="text-[22px] font-extrabold leading-none">Выбери цель</h1><p className="mt-1 text-[11px] font-semibold text-[#7d82ae]">Игрушки, интерьер и одежда</p></div>
      </div>
      <div className="mx-4 flex gap-1.5 rounded-[18px] bg-white p-1.5 shadow-sm">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className="flex flex-1 flex-col items-center gap-1 rounded-[14px] py-2 text-[10px] font-bold" style={tab === item.id ? { background: VIOLET, color: 'white' } : { color: '#686d9a' }}><img src={item.icon} alt="" className="h-6 w-6 object-contain" />{item.label}</button>)}</div>
      <div className="mt-3 grid flex-1 grid-cols-2 gap-2.5 overflow-y-auto px-4" style={{ paddingBottom: bottomInset + 22 }}>{products.map((item) => <article key={item.id} className="self-start rounded-[20px] bg-white p-2.5 shadow-[0_4px_16px_rgba(37,34,91,0.08)]"><div className="flex h-[112px] items-center justify-center overflow-hidden rounded-[15px] bg-[#f5f3ff]"><img src={item.image} alt="" className="h-full w-full object-contain p-1.5" /></div><h2 className="mt-2 min-h-[31px] text-[11.5px] font-extrabold leading-tight">{item.name}</h2><div className="mt-1 flex items-center gap-1 text-[12px] font-bold text-[#6b719d]"><img src={coinIcon} alt="" className="h-4 w-4" />{item.price}</div><button onClick={() => { setGoal(item); setChoosing(false); }} className="mt-2 flex w-full items-center justify-center gap-1 rounded-full py-2 text-[11px] font-extrabold text-white shadow-sm active:scale-95" style={{ background: GREEN }}><IconCheck className="h-3.5 w-3.5" />Копить</button></article>)}</div>
    </div>
  );

  const visibleHistory = transactions.slice().reverse().map((item) => ({
        title: item.reason,
        date: new Date(item.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        amount: item.amount,
        icon: coinIcon,
      })).filter((item) => historyTab === 'income' ? item.amount > 0 : item.amount < 0);

  function openTransfer(mode: 'deposit' | 'withdraw') {
    setTransferMode(mode);
    setAmount('');
    setTransferError('');
  }

  function submitTransfer() {
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) {
      setTransferError('Введи целое число монет');
      return;
    }
    const ok = transferMode === 'deposit' ? depositToSavings(value) : withdrawFromSavings(value);
    if (!ok) {
      setTransferError(transferMode === 'deposit' ? 'В кошельке недостаточно монет' : 'В копилке недостаточно монет');
      return;
    }
    setTransferMode(null);
    setAmount('');
  }
  return (
    <div className="h-full overflow-y-auto bg-[#f8f4ec] px-3 pt-[calc(env(safe-area-inset-top,0px)+10px)]" style={{ paddingBottom: bottomInset + (transferMode ? 220 : 16), color: BLUE }}>
      <header className="mb-2.5 flex h-9 items-center justify-between">
        <button onClick={onClose} aria-label="Назад" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#4650ad] shadow-[0_2px_10px_rgba(31,37,105,0.08)]"><IconArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-[19px] font-black tracking-[-0.3px]">Копилка</h1>
        <div className="h-8 w-8" />
      </header>
      <section className="grid grid-cols-2 gap-2.5">
        <div className="flex h-[108px] min-w-0 items-center overflow-hidden rounded-[20px] bg-[#fffdf7] px-2.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
          <div className="flex h-[76px] w-[64px] shrink-0 items-center justify-center">
            <img src={walletAsset} alt="" className="h-[60px] w-[60px] max-w-none object-contain" />
          </div>
          <div className="min-w-0 flex-1 pl-1">
            <div className="whitespace-nowrap text-[11.5px] font-extrabold leading-tight">Мой баланс</div>
            <div className={`mt-1 whitespace-nowrap font-black leading-none tracking-[-0.8px] ${amountTextSize(coins)}`}>{coins}</div>
            <div className="mt-0.5 text-[11px] font-black uppercase leading-none">монет</div>
          </div>
        </div>
        <div className="flex h-[108px] min-w-0 items-center overflow-hidden rounded-[20px] bg-[#f7f2ff] px-2.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
          <div className="flex h-[76px] w-[64px] shrink-0 items-center justify-center">
            <img src={piggyAsset} alt="" className="h-[60px] w-[60px] max-w-none object-contain" />
          </div>
          <div className="min-w-0 flex-1 pl-1">
            <div className="whitespace-nowrap text-[11.5px] font-extrabold leading-tight">В копилке</div>
            <div className={`mt-1 whitespace-nowrap font-black leading-none tracking-[-0.8px] ${amountTextSize(currentSaved)}`}>{currentSaved}</div>
            <div className="mt-0.5 text-[11px] font-black uppercase leading-none">монет</div>
          </div>
        </div>
      </section>
      {transferMode ? (
        <section className="mt-2.5 min-h-[190px] rounded-[20px] bg-white p-4 shadow-[0_3px_14px_rgba(31,37,105,0.06)] transition-all duration-300">
          <div className="flex items-center justify-between"><h2 className="text-[17px] font-black">{transferMode === 'deposit' ? 'Пополнить копилку' : 'Вывести из копилки'}</h2><button onClick={() => setTransferMode(null)} className="text-[12px] font-bold text-[#7379a4]">Отмена</button></div>
          <label className="mt-4 block text-[11px] font-bold text-[#777da8]" htmlFor="savings-amount">Сколько монет перевести?</label>
          <div className="mt-1.5 flex h-12 items-center rounded-[14px] bg-[#f5f3ff] px-3"><input id="savings-amount" autoFocus inputMode="numeric" pattern="[0-9]*" value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^0-9]/g, '')); setTransferError(''); }} placeholder="0" className="min-w-0 flex-1 bg-transparent text-[24px] font-black text-[#111b72] outline-none" /><img src={coinIcon} alt="" className="h-6 w-6" /></div>
          {transferError && <p className="mt-1.5 text-[10px] font-bold text-[#ed4e5d]">{transferError}</p>}
          <button onClick={submitTransfer} disabled={!transferAllowed} className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] text-[12px] font-extrabold text-white transition-opacity active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-100" style={{ background: transferAllowed ? (transferMode === 'deposit' ? VIOLET : 'linear-gradient(180deg, #8b88f4 0%, #716dde 100%)') : '#d9d5ed', color: transferAllowed ? '#ffffff' : '#aaa5c2' }}>{transferMode === 'deposit' ? 'Пополнить копилку' : 'Вывести монеты'}</button>
        </section>
      ) : (
      <section className="mt-2.5 grid grid-cols-[1fr_34px_1fr] items-center rounded-[20px] bg-white p-2 shadow-[0_3px_14px_rgba(31,37,105,0.06)]">
        <button onClick={() => openTransfer('deposit')} className="flex h-[42px] items-center justify-center gap-1.5 rounded-[14px] text-[11px] font-extrabold text-white" style={{ background: VIOLET }}>Пополнить <span className="text-[18px] leading-none">→</span></button>
        <div className="flex h-7 w-7 items-center justify-center justify-self-center rounded-full bg-[#f0edff] text-[16px] font-black text-[#5965df]">⇄</div>
        <button onClick={() => openTransfer('withdraw')} className="flex h-[42px] items-center justify-center gap-1.5 rounded-[14px] bg-[#f0edff] text-[11px] font-extrabold"><span className="text-[18px] leading-none">←</span>Вывести</button>
      </section>
      )}
      <div className={`overflow-hidden transition-all duration-300 ${transferMode ? 'pointer-events-none max-h-0 opacity-0' : 'max-h-[800px] opacity-100'}`}>
      <section className="mt-2.5 rounded-[22px] bg-white p-3.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[18px] font-black"><span className="flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-current text-[12px]">↗</span>Моя цель</div>
          <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-[#6971b4]"><img src={bearAvatar} alt="" className="h-7 w-7 rounded-full" />У тебя получится!</div>
        </div>
        {!goal ? (
          <div className="mt-3 rounded-[17px] bg-[#f8f6ff] px-4 py-5 text-center">
            <div className="text-[14px] font-extrabold">Цель пока не выбрана</div>
            <p className="mt-1 text-[10px] font-semibold text-[#7d82ae]">Выбери то, ради чего хочется копить.</p>
            <button onClick={() => setChoosing(true)} className="mt-3 h-9 rounded-[12px] bg-[#eeebff] px-5 text-[10px] font-extrabold text-[#3845b6]">Выбрать цель</button>
          </div>
        ) : (
          <div className="mt-3 flex gap-3">
            <img src={goal.image} alt="" className="h-[96px] w-[104px] shrink-0 rounded-[17px] bg-[#f5f3ff] object-contain p-1" />
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="truncate text-[15px] font-black">{goalName}</h2>
              <div className="mt-1 text-[14px] font-black">{currentSaved} <span className="text-[#7d82ae]">/ {goalPrice}</span> <span className="text-[9px] text-[#7d82ae]">монет</span></div>
              <div className="mt-2.5 flex items-center gap-2"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e9e9ef]"><div className="h-full rounded-full" style={{ width: `${percent}%`, background: GREEN }} /></div><span className="text-[13px] font-black">{percent}%</span></div>
              <button onClick={() => setChoosing(true)} className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#eeebff] px-2 text-[10px] font-extrabold text-[#3845b6]">Изменить цель <span aria-hidden>›</span></button>
            </div>
          </div>
        )}
      </section>
      <section className="mt-2.5 rounded-[22px] bg-white p-3.5 shadow-[0_3px_14px_rgba(31,37,105,0.07)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[18px] font-black"><span className="flex flex-col gap-[3px]">{[0, 1, 2].map((line) => <i key={line} className="block h-[3px] w-5 rounded-full bg-current" />)}</span>История</div>
          <div className="flex rounded-full bg-[#f2f1f6] p-1 text-[9.5px] font-bold"><button onClick={() => setHistoryTab('income')} className="rounded-full px-3 py-1.5" style={historyTab === 'income' ? { background: '#ddd7ff', color: BLUE } : { color: '#72789e' }}>Доходы</button><button onClick={() => setHistoryTab('expense')} className="rounded-full px-3 py-1.5" style={historyTab === 'expense' ? { background: '#ddd7ff', color: BLUE } : { color: '#72789e' }}>Расходы</button></div>
        </div>
        {visibleHistory.length ? (
          <div className="mt-2.5 space-y-1.5">{visibleHistory.map((item, index) => <div key={`${item.title}-${item.date}-${index}`} className="flex min-h-[45px] items-center rounded-[14px] bg-[#fcfbf8] px-2.5 py-1.5"><img src={item.icon} alt="" className="h-8 w-8 shrink-0 object-contain" /><div className="ml-2 min-w-0 flex-1"><div className="truncate text-[11px] font-extrabold">{item.title}</div><div className="text-[8.5px] font-semibold text-[#8a8faf]">{item.date}</div></div><div className={`whitespace-nowrap text-[15px] font-black ${item.amount > 0 ? 'text-[#0eb164]' : 'text-[#ff3651]'}`}>{item.amount > 0 ? '+' : '−'}{Math.abs(item.amount)}</div><img src={coinIcon} alt="" className="ml-1 h-5 w-5 shrink-0" /></div>)}</div>
        ) : (
          <div className="mt-2.5 rounded-[14px] bg-[#fcfbf8] px-3 py-4 text-center text-[11px] font-semibold text-[#8a8faf]">Пока нет операций</div>
        )}
      </section>
      </div>
    </div>
  );
}
