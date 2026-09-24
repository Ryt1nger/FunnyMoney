import { useMemo, useState } from 'react';
import bearMain from '../assets/pet/bear-main.png';
import capWhite from '../assets/items/clothing/cap-white-paw.png';
import beanieRed from '../assets/items/clothing/beanie-red.png';
import hatBear from '../assets/items/clothing/hat-bear-yellow.png';
import hoodieBlue from '../assets/items/clothing/hoodie-blue-paw.png';
import jacketBlue from '../assets/items/clothing/jacket-varsity-blue.png';
import vestGreen from '../assets/items/clothing/vest-green-puffer.png';
import dressPink from '../assets/items/clothing/dress-pink-bow.png';
import tuxedo from '../assets/items/clothing/tuxedo-black.png';
import bandana from '../assets/items/clothing/bandana-red-paw.png';
import collar from '../assets/items/clothing/collar-red-bell.png';
import glassesBlue from '../assets/items/clothing/glasses-blue-paw.png';
import glassesPink from '../assets/items/clothing/glasses-pink-heart.png';
import backpack from '../assets/items/clothing/backpack-blue-paw.png';
import { IconArrowLeft, IconBackpackLight, IconCheck } from '../components/icons';
import { useInventoryStore } from '../features/inventory/inventoryStore';

type CategoryId = 'head' | 'clothes' | 'bottom' | 'shoes' | 'accessories';
type WardrobeItem = { id: string; name: string; category: CategoryId; asset: string; price: number; zIndex: number; x: number; y: number; width: number; height: number };

const ITEMS: WardrobeItem[] = [
  { id: 'cap-white-paw', name: 'Кепка', category: 'head', asset: capWhite, price: 40, zIndex: 50, x: 25, y: -1, width: 50, height: 24 },
  { id: 'beanie-red', name: 'Шапка', category: 'head', asset: beanieRed, price: 45, zIndex: 50, x: 20, y: -2, width: 60, height: 25 },
  { id: 'hat-bear-yellow', name: 'Панама', category: 'head', asset: hatBear, price: 55, zIndex: 50, x: 20, y: 0, width: 60, height: 25 },
  { id: 'hoodie-blue-paw', name: 'Худи', category: 'clothes', asset: hoodieBlue, price: 80, zIndex: 30, x: 12, y: 37, width: 76, height: 44 },
  { id: 'jacket-varsity-blue', name: 'Куртка', category: 'clothes', asset: jacketBlue, price: 110, zIndex: 35, x: 8, y: 35, width: 84, height: 46 },
  { id: 'vest-green-puffer', name: 'Жилет', category: 'clothes', asset: vestGreen, price: 95, zIndex: 35, x: 12, y: 37, width: 76, height: 43 },
  { id: 'dress-pink-bow', name: 'Платье', category: 'bottom', asset: dressPink, price: 90, zIndex: 25, x: 10, y: 50, width: 80, height: 38 },
  { id: 'tuxedo-black', name: 'Костюм', category: 'bottom', asset: tuxedo, price: 120, zIndex: 25, x: 10, y: 49, width: 80, height: 40 },
  { id: 'bandana-red-paw', name: 'Шарф', category: 'accessories', asset: bandana, price: 35, zIndex: 60, x: 22, y: 27, width: 56, height: 22 },
  { id: 'collar-red-bell', name: 'Ошейник', category: 'accessories', asset: collar, price: 30, zIndex: 61, x: 25, y: 29, width: 50, height: 16 },
  { id: 'glasses-blue-paw', name: 'Очки', category: 'accessories', asset: glassesBlue, price: 45, zIndex: 70, x: 25, y: 21, width: 50, height: 16 },
  { id: 'glasses-pink-heart', name: 'Сердечки', category: 'accessories', asset: glassesPink, price: 50, zIndex: 70, x: 25, y: 21, width: 50, height: 16 },
  { id: 'backpack-blue-paw', name: 'Рюкзак', category: 'accessories', asset: backpack, price: 75, zIndex: 20, x: 2, y: 39, width: 35, height: 43 },
];

const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'head', label: 'Головные уборы', icon: capWhite },
  { id: 'clothes', label: 'Одежда', icon: hoodieBlue },
  { id: 'bottom', label: 'Низ', icon: dressPink },
  { id: 'shoes', label: 'Обувь', icon: jacketBlue },
  { id: 'accessories', label: 'Аксессуары', icon: glassesBlue },
];

export function BearAvatar({ selectedIds }: { selectedIds: string[] }) {
  const selected = ITEMS.filter((item) => selectedIds.includes(item.id)).sort((a, b) => a.zIndex - b.zIndex);
  return <div className="relative aspect-[663/951] h-full max-h-full w-auto max-w-full">
    <img src={bearMain} alt="Мишка" className="absolute inset-0 h-full w-full object-contain" />
    {selected.map((item) => <img key={item.id} src={item.asset} alt="" className="pointer-events-none absolute object-contain" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, zIndex: item.zIndex }} />)}
  </div>;
}

function CategoryTabs({ active, onChange }: { active: CategoryId; onChange: (value: CategoryId) => void }) {
  return <div className="flex gap-2 overflow-x-auto pb-1">{CATEGORIES.map((category) => <button type="button" key={category.id} onClick={() => onChange(category.id)} className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-[11px] font-extrabold transition ${active === category.id ? 'bg-[#5d61f2] text-white shadow-md' : 'bg-[#f0f1fa] text-[#334386]'}`}><img src={category.icon} alt="" className="h-5 w-5 object-contain" />{category.label}</button>)}</div>;
}

function WardrobeItemCard({ item, selected, owned, onSelect }: { item: WardrobeItem; selected: boolean; owned: boolean; onSelect: () => void }) {
  return <button type="button" disabled={!owned} onClick={onSelect} className={`relative flex min-w-0 flex-col items-center rounded-2xl bg-white p-2 text-center shadow-[0_3px_10px_rgba(60,55,105,.10)] transition-all active:scale-95 ${selected ? 'ring-2 ring-[#3678f5]' : ''} ${!owned ? 'opacity-60' : ''}`}>
    {selected && <span className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#3678f5] text-white"><IconCheck className="h-4 w-4" /></span>}
    <div className="flex aspect-square w-full items-center justify-center"><img src={item.asset} alt={item.name} className="h-full w-full object-contain" /></div>
    <span className={`mt-1 w-full rounded-full py-1 text-[10px] font-extrabold ${selected ? 'bg-[#3678f5] text-white' : owned ? 'bg-[#d4f6df] text-[#14804b]' : 'bg-[#f1f1f4] text-[#6e7080]'}`}>{selected ? 'Надето' : owned ? 'Куплено' : `${item.price} монет`}</span>
  </button>;
}

export default function Wardrobe({ onClose }: { onClose: () => void }) {
  const storedOutfit = useInventoryStore((state) => state.outfitIds);
  const ownedProductIds = useInventoryStore((state) => state.ownedProductIds);
  const setOutfit = useInventoryStore((state) => state.setOutfit);
  const [category, setCategory] = useState<CategoryId>('head');
  const [selectedIds, setSelectedIds] = useState<string[]>(storedOutfit);
  const visibleItems = useMemo(() => ITEMS.filter((item) => item.category === category), [category]);
  const toggleItem = (item: WardrobeItem) => setSelectedIds((current) => {
    if (current.includes(item.id)) return current.filter((id) => id !== item.id);
    const sameCategory = ITEMS.filter((entry) => entry.category === item.category).map((entry) => entry.id);
    return [...current.filter((id) => !sameCategory.includes(id) || item.category === 'accessories'), item.id];
  });
  const clearOutfit = () => setSelectedIds([]);

  return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#fbefe1]">
    <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3"><button type="button" onClick={onClose} aria-label="Назад" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#3158b5] shadow-sm"><IconArrowLeft className="h-6 w-6" /></button><h1 className="rounded-full bg-white px-6 py-2 text-[22px] font-black text-[#183c96] shadow-sm">Гардероб</h1><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4f63ee] text-white"><IconBackpackLight className="h-6 w-6" /></span></header>
    <section className="relative flex h-[43%] min-h-[245px] shrink-0 items-end justify-center overflow-hidden bg-gradient-to-b from-[#e8e6fb] to-[#fbefe1] pb-2"><BearAvatar selectedIds={selectedIds} /></section>
    <section className="flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-white px-4 pb-3 pt-3 shadow-[0_-5px_18px_rgba(74,64,117,.10)]"><CategoryTabs active={category} onChange={setCategory} /><div className="mt-2 grid min-h-0 flex-1 grid-cols-4 gap-2 overflow-y-auto pr-0.5">{visibleItems.map((item) => <WardrobeItemCard key={item.id} item={item} selected={selectedIds.includes(item.id)} owned={ownedProductIds.length === 0 || ownedProductIds.includes(item.id)} onSelect={() => toggleItem(item)} />)}</div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={clearOutfit} className="rounded-2xl bg-[#f4f5fb] py-3 text-[13px] font-black text-[#334386] shadow-sm">Снять всё</button><button type="button" onClick={() => setOutfit(selectedIds)} className="rounded-2xl bg-gradient-to-b from-[#5d8cff] to-[#376de9] py-3 text-[13px] font-black text-white shadow-[0_5px_14px_rgba(55,109,233,.30)]">Сохранить образ</button></div></section>
  </div>;
}
