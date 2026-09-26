import { IconCheck } from '../../../components/icons';
import { buildEffectRows } from '../eventPresentation';
import type { EventEffects } from '../eventData';
import EventEffectBadge from './EventEffectBadge';

const GRADIENT_BLUE = 'linear-gradient(135deg, #6c7bf5 0%, #3f4fd8 100%)';

interface Props {
  title: string;
  feedback: string;
  effects: EventEffects;
  onContinue: () => void;
}

/** Экран последствий выбора: крупный заголовок результата, объяснение,
 * карточки изменений метрик и кнопка "Продолжить". */
export default function EventResult({ title, feedback, effects, onContinue }: Props) {
  const rows = buildEffectRows(effects);
  return (
    <div>
      <div className="flex justify-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'linear-gradient(180deg, #c9f5d9 0%, #8fe3ac 100%)' }}
        >
          <IconCheck className="h-7 w-7 text-[#1a8f4c]" />
        </span>
      </div>
      <h3 className="mt-3 text-center text-[17px] font-black leading-tight" style={{ color: '#111b72' }}>{title}</h3>
      <p className="mt-1.5 px-1 text-center text-[11.5px] font-semibold leading-snug text-[#6b6880]">{feedback}</p>

      {rows.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <EventEffectBadge key={row.key} label={row.label} value={row.value} icon={row.icon} unit={row.unit} />
          ))}
        </div>
      )}

      <button
        onClick={onContinue}
        data-no-tap-sound
        className="mt-4 flex h-12 w-full items-center justify-center rounded-[16px] text-[13px] font-extrabold text-white transition active:translate-y-[1px] active:scale-[0.98]"
        style={{ background: GRADIENT_BLUE }}
      >
        Продолжить
      </button>
    </div>
  );
}
