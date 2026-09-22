import { useState } from 'react';
import coinIcon from '../assets/icons/coin.png';
import piggyIcon from '../assets/icons/categories/piggy.png';
import catToys from '../assets/icons/shop/cat-toys.png';
import catClothes from '../assets/icons/shop/cat-clothes.png';
import catInterior from '../assets/icons/shop/cat-interior.png';
import { productsByCategory, roomsBySection, type ShopCategoryId } from '../data/shopData';
import { useEconomyStore } from '../features/economy/economyStore';
import { IconArrowLeft, IconCheck, IconPlus } from '../components/icons';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';
const GREEN = 'linear-gradient(180deg, #42d889 0%, #16b866 100%)';
const tabs: { id: ShopCategoryId | 'rooms'; label: string; icon: string }[] = [
  { id: 'toys', label: 'Игрушки', icon: catToys },
  { id: 'interior', label: 'Интерьер', icon: catInterior },
  { id: 'clothes', label: 'Одежда', icon: catClothes },
];

interface Props { bottomInset?: number; coins: number; onClose: () => void; onOpenEarnModal?: () => void }

export default function PiggyBank({ bottomInset = 0, coins, onClose, onOpenEarnModal }: Props) {
  const goal = useEconomyStore((s) => s.savingsGoal);
  const saved = useEconomyStore((s) => s.totalSaved);
  const setGoal = useEconomyStore((s) => s.setSavingsGoal);
  const [choosing, setChoosing] = useState(false);
  const [tab, setTab] = useState<ShopCategoryId | 'rooms'>('toys');
  const percent = goal ? Math.min(100, Math.round((saved / Math.max(goal.price, 1)) * 100)) : 0;
  const products = tab === 'interior' || tab === 'rooms'
    ? [...roomsBySection('playroom'), ...roomsBySection('kitchen')].map((r) => ({ id: r.id, name: r.name, price: r.price, image: r.background, kind: 'interior' as const }))
    : productsByCategory(tab).map((p) => ({ id: p.id, name: p.name, price: p.price, image: p.image, kind: p.category as 'toys' | 'clothes' | 'interior' }));

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      <header className="shrink-0 bg-gradient-to-br from-[#5548c9] via-[#6d61dd] to-[#9a91f2] px-4 pb-5 pt-[calc(env(safe-area-inset-top,0px)+16px)] text-white">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>
          <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-2 py-1.5 text-[14px] font-bold"><img src={coinIcon} className="h-5 w-5" alt="" />{coins}<button onClick={onOpenEarnModal} className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/20"><IconPlus className="h-4 w-4" /></button></div>
        </div>
        <div className="mt-4 flex items-center gap-3"><img src={piggyIcon} alt="" className="h-14 w-14 drop-shadow" /><div><h1 className="text-[27px] font-extrabold leading-none">Копилка</h1><p className="mt-1 text-[12px] font-semibold text-white/85">Копи на то, что хочется!</p></div></div>
      </header>

      <main className="flex-1 overflow-y-auto rounded-t-[28px] bg-[#fbefe1] px-4 pt-4" style={{ paddingBottom: bottomInset + 24 }}>
        {!choosing ? (
          <>
            <section className="rounded-[24px] bg-white/85 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[20px] bg-[#f1eaff]">{goal ? <img src={goal.image} alt="" className="h-full w-full object-contain p-2" /> : <img src={piggyIcon} alt="" className="h-16 w-16" />}</div>
                <div className="min-w-0 flex-1"><div className="text-[12px] font-semibold text-[#7d7690]">Моя цель</div><h2 className="mt-0.5 truncate text-[20px] font-extrabold text-[#29265f]">{goal?.name ?? 'Выбери мечту'}</h2><div className="mt-1 flex items-center gap-1 text-[13px] font-bold text-[#6f6b9c]"><span>{saved} / {goal?.price ?? 0}</span><img src={coinIcon} alt="" className="h-4 w-4" />монет</div></div>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e9e8ef]"><div className="h-full rounded-full bg-gradient-to-r from-[#37d27f] to-[#11a85b] transition-all" style={{ width: `${percent}%` }} /></div>
              <div className="mt-1 flex justify-between text-[11px] font-bold text-[#77718b]"><span>{percent}% накоплено</span><span>{goal ? Math.max(0, goal.price - saved) : 0} осталось</span></div>
              <button onClick={() => setChoosing(true)} className="mt-4 flex w-full items-center justify-center rounded-[16px] py-3 text-[14px] font-extrabold text-white shadow-md transition active:scale-[.98]" style={{ background: VIOLET }}>{goal ? 'Изменить цель' : 'Выбрать цель'}</button>
            </section>
            <section className="mt-3 rounded-[22px] bg-[#fff9ee] p-4 text-center"><div className="text-[15px] font-extrabold text-[#29265f]">Каждая монетка приближает мечту!</div><p className="mt-1 text-[12px] font-semibold text-[#817b91]">Выполняй задания и откладывай награды в копилку.</p></section>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between"><div><h2 className="text-[21px] font-extrabold text-[#29265f]">Выбери цель</h2><p className="text-[11px] font-semibold text-[#817b91]">Еда не участвует — только мечты</p></div><button onClick={() => setChoosing(false)} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#5f57d7]">Назад</button></div>
            <div className="flex gap-2 rounded-[18px] bg-white/70 p-1.5">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className="flex flex-1 flex-col items-center gap-1 rounded-[14px] py-2 text-[10px] font-bold" style={tab === item.id ? { background: VIOLET, color: 'white' } : { color: '#6f6355' }}><img src={item.icon} alt="" className="h-6 w-6 object-contain" />{item.label}</button>)}</div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">{products.map((item) => <div key={item.id} className="rounded-[19px] border border-[#f0e2cb] bg-white/90 p-2 shadow-sm"><div className="flex h-[104px] items-center justify-center overflow-hidden rounded-[14px] bg-[#faf1e3]"><img src={item.image} alt="" className="max-h-full w-full object-contain p-1" /></div><div className="mt-2 min-h-[30px] text-[11px] font-extrabold leading-tight text-[#29265f]">{item.name}</div><div className="mt-1 flex items-center gap-1 text-[12px] font-bold text-[#625d76]"><img src={coinIcon} alt="" className="h-4 w-4" />{item.price}</div><button onClick={() => { setGoal(item); setChoosing(false); }} className="mt-2 flex w-full items-center justify-center gap-1 rounded-full py-2 text-[11px] font-extrabold text-white shadow-sm transition active:scale-95" style={{ background: GREEN }}><IconCheck className="h-3.5 w-3.5" />Копить</button></div>)}</div>
          </>
        )}
      </main>
    </div>
  );
}
