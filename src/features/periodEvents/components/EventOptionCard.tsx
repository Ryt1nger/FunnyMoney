import type { ReactNode } from 'react';
import coinIcon from '../../../assets/icons/coin.png';

const VIOLET_BTN = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

interface Props {
  icon: ReactNode;
  iconBg: string;
  label: string;
  costText: string;
  costColor: string;
  consequence: string;
  disabled?: boolean;
  onSelect: () => void;
}

/** Одна карточка варианта решения в модалке события: ассет, название,
 * стоимость/изменение монет, короткое последствие и кнопка "Выбрать". */
export default function EventOptionCard({ icon, iconBg, label, costText, costColor, consequence, disabled, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] bg-[#f7f5ff] p-2.5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]" style={{ background: iconBg }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-extrabold leading-tight" style={{ color: '#111b72' }}>{label}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-black" style={{ color: costColor }}>
          <img src={coinIcon} alt="" className="h-3.5 w-3.5 shrink-0" />
          {costText}
        </div>
        <div className="mt-0.5 text-[9.5px] font-semibold leading-snug text-[#8a8fbf]">{consequence}</div>
      </div>
      <button
        onClick={onSelect}
        disabled={disabled}
        className="shrink-0 rounded-full px-3.5 py-2 text-[11px] font-extrabold text-white transition active:translate-y-[1px] active:scale-[0.98] disabled:opacity-50"
        style={{ background: VIOLET_BTN }}
      >
        Выбрать
      </button>
    </div>
  );
}
