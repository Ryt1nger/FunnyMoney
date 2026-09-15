import navHome from '../assets/icons/nav/home.png';
import navHomeActive from '../assets/icons/nav/home-active.png';
import navBook from '../assets/icons/nav/book.png';
import navBookActive from '../assets/icons/nav/book-active.png';
import navCalendar from '../assets/icons/nav/calendar.png';
import navCalendarActive from '../assets/icons/nav/calendar-active.png';
import navShop from '../assets/icons/nav/shop.png';
import navShopActive from '../assets/icons/nav/shop-active.png';
import navChart from '../assets/icons/nav/chart.png';
import navChartActive from '../assets/icons/nav/chart-active.png';

export type TabId = 'home' | 'lessons' | 'day' | 'shop' | 'stats';

const TABS: { id: TabId; label: string; icon: string; iconActive: string; dot?: boolean }[] = [
  { id: 'home', label: 'Главная', icon: navHome, iconActive: navHomeActive },
  { id: 'lessons', label: 'Уроки', icon: navBook, iconActive: navBookActive },
  { id: 'day', label: 'День', icon: navCalendar, iconActive: navCalendarActive, dot: true },
  { id: 'shop', label: 'Магазин', icon: navShop, iconActive: navShopActive },
  { id: 'stats', label: 'Статистика', icon: navChart, iconActive: navChartActive },
];

const ACTIVE = '#5d6cfc';
const INACTIVE = '#847472';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

/**
 * Иконки — оригинальные ассеты из листа дизайна, по два состояния на вкладку
 * (серое и синее). Никаких перекрасок: используем то, что нарисовано.
 */
export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="flex w-full items-stretch rounded-t-[26px] bg-[#f9efe0] px-1 pb-3 pt-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.12)]">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-1 flex-col items-center gap-1 transition active:scale-95"
          >
            <span className="relative flex h-[26px] w-[26px] items-center justify-center">
              <img
                src={isActive ? tab.iconActive : tab.icon}
                alt=""
                className="h-[25px] w-auto max-w-[26px] object-contain"
              />
              {tab.dot && (
                <span className="absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full bg-red-500" />
              )}
            </span>
            <span
              className="text-[10.5px] font-semibold leading-none"
              style={{ color: isActive ? ACTIVE : INACTIVE }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
