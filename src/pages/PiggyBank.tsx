import { useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import walletAsset from '../assets/piggy-bank/wallet.png';
import piggyAsset from '../assets/piggy-bank/piggy.png';
import rocketGoal from '../assets/piggy-bank/rocket-goal.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import catToys from '../assets/icons/shop/cat-toys.png';
import catClothes from '../assets/icons/shop/cat-clothes.png';
import catInterior from '../assets/icons/shop/cat-interior.png';
import starIcon from '../assets/icons/xp-star.png';
import giftIcon from '../assets/icons/shop/gift-banner.png';
import foodIcon from '../assets/items/food/bowl-pink-mix.png';
import toyIcon from '../assets/items/toys/camera-pet.png';
import { productsByCategory, roomsBySection, type ShopCategoryId } from '../data/shopData';
import { useEconomyStore } from '../features/economy/economyStore';
import { IconArrowLeft, IconCheck, IconPlus } from '../components/icons';

const BLUE = '#111b72';
const VIOLET = 'linear-gradient(135deg, #5268ee 0%, #304bc7 100%)';
const GREEN = 'linear-gradient(180deg, #35d983 0%, #12ae5c 100%)';
const tabs: { id: ShopCategoryId | 'rooms'; label: string; icon: string }[] = [
  { id: 'toys', label: 'Игрушки', icon: catToys },
  { id: 'interior', label: 'Интерьер', icon: catInterior },
  { id: 'clothes', label: 'Одежда', icon: catClothes },
];
const demoHistory = [
  { title: 'Награда за урок', date: 'Сегодня, 10:24', amount: 100, icon: starIcon },
  { title: 'Подарок', date: 'Вчера, 16:12', amount: 50, icon: giftIcon },
  { title: 'Купил корм', date: '12 мар, 14:33', amount: -60, icon: foodIcon },
  { title: 'Купил игрушку', date: '10 мар, 18:20', amount: -50, icon: toyIcon },
];

interface Props { bottomInset?: number; coins: number; onClose: () => void; onOpenEarnModal?: () => void }

export default function PiggyBank({ bottomInset = 0, coins, onClose }: Props) {
  const goal = useEconomyStore((s) => s.savingsGoal);
  const saved = useEconomyStore((s) => s.totalSaved);
  const setGoal = useEconomyStore((s) => s.setSavingsGoal);
  const [choosing, setChoosing] = useState(false);
  const [historyTab, setHistoryTab] = useState<'income' | 'expense'>('income');
  const [tab, setTab] = useState<ShopCategoryId | 'rooms'>('toys');
  const goalName = goal?.name ?? 'Космическая ракета';
  const goalPrice = goal?.price ?? 2000;
  const goalImage = goal?.image ?? rocketGoal;
  const currentSaved = saved || 650;
  const percent = Math.min(100, Math.round((currentSaved / Math.max(goalPrice, 1)) * 100));
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

  const visibleHistory = demoHistory.filter((item) => historyTab === 'income' ? item.amount > 0 : item.amount < 0);
  return (
    <div className="h-full overflow-y-auto bg-[#fbf8f1] px-2.5 pt-[calc(env(safe-area-inset-top,0px)+10px)]" style={{ paddingBottom: bottomInset + 16, color: BLUE }}>
      <button onClick={onClose} aria-label="Назад" className="absolute left-4 top-[calc(env(safe-area-inset-top,0px)+16px)] z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-sm"><IconArrowLeft className="h-4 w-4" /></button>
      <section className="grid grid-cols-2 gap-2.5">
        <div className="relative flex h-[138px] items-center overflow-hidden rounded-[22px] border border-white bg-[#fffdf3] shadow-[0_5px_18px_rgba(46,40,103,0.08)]"><img src={walletAsset} alt="" className="-ml-2 mt-5 h-[104px] w-[104px] shrink-0 object-contain" /><div className="-ml-1 mt-1"><div className="text-[14px] font-extrabold">Мой баланс</div><div className="text-[36px] font-black leading-[0.95] tracking-[-1px]">{coins}</div><div className="text-[15px] font-black uppercase">монет</div></div></div>
        <div className="flex h-[138px] items-center overflow-hidden rounded-[22px] border border-white bg-[#f8f4ff] shadow-[0_5px_18px_rgba(46,40,103,0.08)]"><img src={piggyAsset} alt="" className="-ml-2 mt-4 h-[104px] w-[104px] shrink-0 object-contain" /><div className="-ml-1 mt-1"><div className="text-[14px] font-extrabold">В копилке</div><div className="text-[36px] font-black leading-[0.95] tracking-[-1px]">{currentSaved}</div><div className="text-[15px] font-black uppercase">монет</div></div></div>
      </section>
      <section className="mt-2.5 grid grid-cols-[1fr_54px_1fr] items-center rounded-[22px] bg-white p-2 shadow-[0_5px_18px_rgba(46,40,103,0.07)]"><button className="flex h-[48px] items-center justify-center gap-2 rounded-[17px] text-[12px] font-extrabold text-white" style={{ background: VIOLET }}>Пополнить <span className="text-[24px]">→</span></button><div className="flex flex-col items-center text-[25px] font-black leading-[17px] text-[#5965df]"><span>↗</span><span className="rotate-180">↗</span></div><button className="flex h-[48px] items-center justify-center gap-2 rounded-[17px] bg-[#eee8ff] text-[12px] font-extrabold"><span className="text-[24px]">←</span>Вывести</button></section>
      <section className="relative mt-2.5 rounded-[23px] bg-white p-3 shadow-[0_5px_18px_rgba(46,40,103,0.08)]">
        <div className="flex items-center gap-2 text-[22px] font-black"><span className="flex h-8 w-8 items-center justify-center rounded-full border-[4px] border-current text-[15px]">↗</span>Моя цель</div>
        <div className="mt-2 flex gap-3"><img src={goalImage} alt="" className="h-[112px] w-[124px] shrink-0 rounded-[20px] object-cover" /><div className="min-w-0 flex-1 pt-1"><h2 className="truncate text-[18px] font-black">{goalName}</h2><div className="mt-1 text-[17px] font-black">{currentSaved} <span className="text-[#7d82ae]">/ {goalPrice}</span> <span className="text-[11px] text-[#7d82ae]">монет</span></div><div className="mt-2.5 flex items-center gap-2"><div className="h-3 flex-1 overflow-hidden rounded-full bg-[#e7e7ee]"><div className="h-full rounded-full" style={{ width: `${percent}%`, background: GREEN }} /></div><span className="text-[16px] font-black">{percent}%</span></div><div className="mt-2.5 grid grid-cols-2 gap-2"><button onClick={() => setChoosing(true)} className="rounded-[14px] bg-[#eeeaff] px-2 py-2 text-[10px] font-extrabold">✎ Изменить цель</button><button onClick={() => setChoosing(true)} className="flex items-center justify-center gap-1 rounded-[14px] px-2 py-2 text-[10px] font-extrabold text-white" style={{ background: VIOLET }}><IconPlus className="h-4 w-4" />Добавить цель</button></div></div></div>
        <div className="absolute right-2 top-1 flex items-end"><div className="rounded-[50%] bg-[#f1edff] px-3 py-2 text-center text-[9px] font-bold leading-tight text-[#4452ca]">Я смогу!<br />Продолжай копить!</div><img src={bearAvatar} alt="" className="h-11 w-11 rounded-full" /></div>
      </section>
      <section className="mt-2.5 rounded-[23px] bg-white p-3 shadow-[0_5px_18px_rgba(46,40,103,0.08)]">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[22px] font-black"><span className="text-[25px]">☷</span>История</div><div className="flex rounded-full bg-[#f1f0f6] p-1 text-[10.5px] font-bold"><button onClick={() => setHistoryTab('income')} className="rounded-full px-4 py-1.5" style={historyTab === 'income' ? { background: '#ded6ff', color: BLUE } : { color: '#6570aa' }}>Доходы</button><button onClick={() => setHistoryTab('expense')} className="rounded-full px-4 py-1.5" style={historyTab === 'expense' ? { background: '#ded6ff', color: BLUE } : { color: '#6570aa' }}>Расходы</button></div></div>
        <div className="mt-2 space-y-1.5">{visibleHistory.map((item) => <div key={item.title} className="flex items-center rounded-[15px] bg-[#fdfcfa] px-2 py-1.5 shadow-[0_2px_8px_rgba(46,40,103,0.06)]"><img src={item.icon} alt="" className="h-9 w-9 object-contain" /><div className="ml-2 min-w-0 flex-1"><div className="truncate text-[12px] font-extrabold">{item.title}</div><div className="text-[9px] font-semibold text-[#8187b0]">{item.date}</div></div><div className={`text-[17px] font-black ${item.amount > 0 ? 'text-[#0eb164]' : 'text-[#ff3651]'}`}>{item.amount > 0 ? '+' : '−'}{Math.abs(item.amount)}</div><img src={coinIcon} alt="" className="ml-1 h-6 w-6" /></div>)}</div>
      </section>
    </div>
  );
}
