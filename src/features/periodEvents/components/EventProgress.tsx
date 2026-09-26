import { IconStar } from '../../../components/icons';

interface Props {
  total: number;
  done: number;
}

/** "N из M событий" + прогресс-бар — используется в карточке периода. Всегда
 * считается от реального completedEventIds (см. Period.tsx), не подставляется. */
export default function EventProgress({ total, done }: Props) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 text-[11px] font-extrabold" style={{ color: '#111b72' }}>
        <IconStar className="h-4 w-4 text-[#7c6cf5]" />
        {done} из {total} событий
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eeeaf7]">
        <div className="h-full rounded-full bg-[#7c6cf5]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
