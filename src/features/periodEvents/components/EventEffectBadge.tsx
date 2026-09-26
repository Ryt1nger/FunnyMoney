/** Одна строка изменения метрики на экране последствий события — зелёный
 * фон/текст для положительного значения, красный для отрицательного. Строки
 * с нулевым/отсутствующим значением не передаются сюда вовсе (см. buildEffectRows).
 * icon — путь к тому же ассету, что и в статистике на главном экране (Здоровье/
 * Счастье/Богатство) и в шапке баланса/копилке — не эмодзи. */
interface Props {
  label: string;
  value: number;
  icon: string;
  unit: string;
}

export default function EventEffectBadge({ label, value, icon, unit }: Props) {
  const positive = value > 0;
  return (
    <div
      className="flex items-center justify-between rounded-[14px] px-3 py-2"
      style={{ background: positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}
    >
      <span className="flex items-center gap-1.5 text-[11.5px] font-extrabold" style={{ color: '#111b72' }}>
        <img src={icon} alt="" className="h-5 w-5 shrink-0 object-contain" />
        {label}
      </span>
      <span className="text-[12.5px] font-black" style={{ color: positive ? '#16a34a' : '#dc2626' }}>
        {positive ? '+' : ''}
        {value}
        {unit}
      </span>
    </div>
  );
}
