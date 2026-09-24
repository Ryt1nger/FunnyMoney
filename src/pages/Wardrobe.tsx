import { useMemo, useState } from 'react';
import bearMain from '../assets/pet/bear-main.png';
import outfit01 from '../assets/wardrobe/01_school_outfit.png';
import outfit02 from '../assets/wardrobe/02_red_tracksuit.png';
import outfit03 from '../assets/wardrobe/03_blue_winter_outfit.png';
import outfit04 from '../assets/wardrobe/04_yellow_rain_outfit.png';
import outfit05 from '../assets/wardrobe/05_superhero_outfit.png';
import outfit06 from '../assets/wardrobe/06_tuxedo_outfit.png';
import outfit07 from '../assets/wardrobe/07_bear_overalls.png';
import outfit08 from '../assets/wardrobe/08_blue_bear_pajamas.png';
import head09 from '../assets/wardrobe/09_red_paw_cap.png';
import head10 from '../assets/wardrobe/10_blue_bear_beanie.png';
import head11 from '../assets/wardrobe/11_yellow_bear_cap.png';
import head12 from '../assets/wardrobe/12_green_paw_cap.png';
import head13 from '../assets/wardrobe/13_red_visor.png';
import scarf14 from '../assets/wardrobe/14_red_knit_scarf.png';
import top15 from '../assets/wardrobe/15_blue_paw_hoodie.png';
import top16 from '../assets/wardrobe/16_bear_tshirt.png';
import top17 from '../assets/wardrobe/17_yellow_puffer_jacket.png';
import top18 from '../assets/wardrobe/18_green_striped_sweater.png';
import top19 from '../assets/wardrobe/19_red_zip_hoodie.png';
import top20 from '../assets/wardrobe/20_blue_yellow_raincoat.png';
import bottom21 from '../assets/wardrobe/21_blue_denim_shorts.png';
import bottom22 from '../assets/wardrobe/22_red_shorts.png';
import bottom23 from '../assets/wardrobe/23_green_shorts.png';
import bottom24 from '../assets/wardrobe/24_yellow_shorts.png';
import bottom25 from '../assets/wardrobe/25_denim_overalls.png';
import bottom26 from '../assets/wardrobe/26_bear_print_shorts.png';
import bottom27 from '../assets/wardrobe/27_blue_skirt.png';
import bottom28 from '../assets/wardrobe/28_khaki_cargo_shorts.png';
import shoe29 from '../assets/wardrobe/29_red_sneakers.png';
import shoe30 from '../assets/wardrobe/30_blue_high_tops.png';
import shoe31 from '../assets/wardrobe/31_yellow_rain_boots.png';
import shoe32 from '../assets/wardrobe/32_brown_winter_boots.png';
import shoe33 from '../assets/wardrobe/33_bear_slippers.png';
import shoe34 from '../assets/wardrobe/34_green_sneakers.png';
import shoe35 from '../assets/wardrobe/35_brown_sandals.png';
import shoe36 from '../assets/wardrobe/36_red_roller_skates.png';
import { IconArrowLeft, IconBackpackLight, IconCheck } from '../components/icons';
import { useInventoryStore } from '../features/inventory/inventoryStore';

type CategoryId = 'head' | 'clothes' | 'bottom' | 'shoes' | 'accessories';
type WardrobeItem = { id: string; name: string; category: CategoryId; asset: string; price: number; zIndex: number; x: number; y: number; width: number; height: number };

const ITEMS: WardrobeItem[] = [
  ...[outfit01, outfit02, outfit03, outfit04, outfit05, outfit06, outfit07, outfit08].map((asset, index) => ({ id: `outfit-${String(index + 1).padStart(2, '0')}`, name: ['Школьный образ', 'Красный спорт', 'Зимний образ', 'Дождевик', 'Супергерой', 'Смокинг', 'Комбинезон', 'Пижама'][index], category: 'clothes' as CategoryId, asset, price: 80 + index * 10, zIndex: 35, x: 5, y: 22, width: 90, height: 72 })),
  ...[head09, head10, head11, head12, head13].map((asset, index) => ({ id: `head-${index + 9}`, name: ['Красная кепка', 'Синяя шапка', 'Жёлтая кепка', 'Зелёная кепка', 'Визор'][index], category: 'head' as CategoryId, asset, price: 40 + index * 5, zIndex: 50, x: 17, y: -1, width: 66, height: 27 })),
  { id: 'scarf-14', name: 'Красный шарф', category: 'accessories', asset: scarf14, price: 35, zIndex: 60, x: 18, y: 28, width: 64, height: 23 },
  ...[top15, top16, top17, top18, top19, top20].map((asset, index) => ({ id: `top-${index + 15}`, name: ['Худи с лапкой', 'Футболка', 'Пуховик', 'Полосатый свитер', 'Красная толстовка', 'Дождевик'][index], category: 'clothes' as CategoryId, asset, price: 65 + index * 8, zIndex: 35, x: 9, y: 36, width: 82, height: 47 })),
  ...[bottom21, bottom22, bottom23, bottom24, bottom25, bottom26, bottom27, bottom28].map((asset, index) => ({ id: `bottom-${index + 21}`, name: ['Джинсовые шорты', 'Красные шорты', 'Зелёные шорты', 'Жёлтые шорты', 'Джинсовый комбинезон', 'Шорты с мишкой', 'Синяя юбка', 'Карго-шорты'][index], category: 'bottom' as CategoryId, asset, price: 55 + index * 6, zIndex: 25, x: 8, y: 53, width: 84, height: 37 })),
  ...[shoe29, shoe30, shoe31, shoe32, shoe33, shoe34, shoe35, shoe36].map((asset, index) => ({ id: `shoe-${index + 29}`, name: ['Красные кеды', 'Высокие кеды', 'Дождевые сапоги', 'Зимние ботинки', 'Тапочки', 'Зелёные кеды', 'Сандалии', 'Ролики'][index], category: 'shoes' as CategoryId, asset, price: 60 + index * 7, zIndex: 20, x: 5, y: 74, width: 90, height: 25 })),
];

const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'head', label: 'Головные уборы', icon: head09 },
  { id: 'clothes', label: 'Одежда', icon: top15 },
  { id: 'bottom', label: 'Низ', icon: bottom21 },
  { id: 'shoes', label: 'Обувь', icon: shoe29 },
  { id: 'accessories', label: 'Аксессуары', icon: scarf14 },
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
    <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3"><button type="button" data-tour="wardrobe-back" onClick={onClose} aria-label="Назад" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#3158b5] shadow-sm"><IconArrowLeft className="h-6 w-6" /></button><h1 className="rounded-full bg-white px-6 py-2 text-[22px] font-black text-[#183c96] shadow-sm">Гардероб</h1><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4f63ee] text-white"><IconBackpackLight className="h-6 w-6" /></span></header>
    <section className="relative flex h-[43%] min-h-[245px] shrink-0 items-end justify-center overflow-hidden bg-gradient-to-b from-[#e8e6fb] to-[#fbefe1] pb-2"><BearAvatar selectedIds={selectedIds} /></section>
    <section data-tour="wardrobe-overview" className="flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-white px-4 pb-3 pt-3 shadow-[0_-5px_18px_rgba(74,64,117,.10)]"><CategoryTabs active={category} onChange={setCategory} /><div className="mt-2 grid min-h-0 flex-1 grid-cols-4 gap-2 overflow-y-auto pr-0.5">{visibleItems.map((item) => <WardrobeItemCard key={item.id} item={item} selected={selectedIds.includes(item.id)} owned={ownedProductIds.length === 0 || ownedProductIds.includes(item.id)} onSelect={() => toggleItem(item)} />)}</div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={clearOutfit} className="rounded-2xl bg-[#f4f5fb] py-3 text-[13px] font-black text-[#334386] shadow-sm">Снять всё</button><button type="button" onClick={() => setOutfit(selectedIds)} className="rounded-2xl bg-gradient-to-b from-[#5d8cff] to-[#376de9] py-3 text-[13px] font-black text-white shadow-[0_5px_14px_rgba(55,109,233,.30)]">Сохранить образ</button></div></section>
  </div>;
}
