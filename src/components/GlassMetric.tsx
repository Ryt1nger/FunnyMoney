import type { ReactNode } from 'react';

interface MetricProps {
  icon: ReactNode;
  /** CSS-градиент круглой иконки-подложки */
  iconGradient: string;
  label: string;
  value: number;
  /** CSS-градиент заливки прогресса */
  barGradient: string;
}

/**
 * Размеры выверены по реальному рендеру при ширине экрана 390px:
 * плашка 111x48, иконка 30px, правая колонка ~67px — "Богатство"
 * (самое длинное слово) помещается целиком.
 */
export default function GlassMetric({ icon, iconGradient, label, value, barGradient }: MetricProps) {
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[18px] border px-1 py-2.5 backdrop-blur-md"
      style={{
        background: 'rgba(26,20,40,0.30)',
        borderColor: 'rgba(255,255,255,0.30)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
      }}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          iconGradient === 'transparent' ? '' : 'shadow-md'
        }`}
        style={{ background: iconGradient }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="whitespace-nowrap text-[10px] font-bold leading-none text-white drop-shadow-sm">
          {label}
        </div>
        <div className="mt-[5px] flex items-center gap-1">
          <div
            className="h-[7px] min-w-[16px] flex-1 overflow-hidden rounded-full"
            style={{ background: 'rgba(20,20,40,0.45)' }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${value}%`, background: barGradient }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-bold leading-none text-white drop-shadow-sm">
            {value}%
          </span>
        </div>
      </div>
    </div>
  );
}
