import { useEffect, useState } from 'react';
import { useEconomyStore } from '../../economy/economyStore';
import { usePeriodStore } from '../../economy/periodStore';
import { useLessonProgressStore } from '../../progress/lessonProgressStore';
import { usePeriodEventStore, type EventChoiceRecord } from '../eventStore';
import type { PeriodEventDefinition, PeriodEventOption } from '../eventData';
import { getPeriodEventImage } from '../../../data/periodsData';
import { optionVisual, formatOptionCost } from '../eventPresentation';
import EventOptionCard from './EventOptionCard';
import EventResult from './EventResult';
import coinIcon from '../../../assets/icons/coin.png';

const TRANSITION_MS = 380;
const EASE = 'cubic-bezier(0.25, 0.8, 0.25, 1)';
const BACKDROP_BLUR_PX = 2;

// Единственный вариант во всех сюжетных событиях, который сознательно НЕ должен
// завершать событие — демонстрация перерасхода в "Лишнем в корзине" (см.
// присланное ТЗ, раздел 6). Это не общая правка движка выбора (eventStore
// не трогаем), а точечное поведение UI для одного конкретного варианта.
const OVERSPEND_EVENT_ID = 'period-2-overloaded-cart';
const OVERSPEND_OPTION_ID = 'pay-over-budget';

function reasonToMessage(reason: 'unavailable' | 'insufficient_funds' | 'invalid_option'): string {
  if (reason === 'insufficient_funds') return 'Недостаточно монет для этого варианта.';
  if (reason === 'invalid_option') return 'Этот вариант сейчас недоступен.';
  return 'Событие пока недоступно.';
}

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Модальное окно сюжетного события периода: экран выбора (иллюстрация + три
 * варианта) и экран последствий. Вся логика доступности/применения эффектов —
 * в usePeriodEventStore (getAvailableEvent/resolveChoice), здесь только показ. */
export default function EventModal({ open, onClose }: Props) {
  const coins = useEconomyStore((s) => s.coins);
  const periodStatus = usePeriodStore((s) => s.status);
  // Подписываемся на completedEventIds/completedLessonIds только чтобы модалка
  // перерисовалась при их изменении — getAvailableEvent() ниже читает эти
  // сторы через getState() и сам по себе не реактивен.
  usePeriodEventStore((s) => s.completedEventIds.length);
  useLessonProgressStore((s) => s.completedLessonIds.length);

  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [phase, setPhase] = useState<'choice' | 'result'>('choice');
  const [lastChoice, setLastChoice] = useState<{ event: PeriodEventDefinition; option: PeriodEventOption; choice: EventChoiceRecord } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [overspendWarning, setOverspendWarning] = useState(false);

  const event = open && periodStatus === 'active'
    ? usePeriodEventStore.getState().getAvailableEvent()
    : null;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase('choice');
      setLastChoice(null);
      setErrorMessage('');
      setOverspendWarning(false);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  function handleSelect(option: PeriodEventOption) {
    if (!event) return;
    if (event.id === OVERSPEND_EVENT_ID && option.id === OVERSPEND_OPTION_ID) {
      setOverspendWarning(true);
      return;
    }
    setOverspendWarning(false);
    const result = usePeriodEventStore.getState().resolveChoice(event.id, option.id);
    if (!result.ok) {
      setErrorMessage(reasonToMessage(result.reason));
      return;
    }
    setErrorMessage('');
    setLastChoice({ event, option, choice: result.choice });
    setPhase('result');
  }

  const globalIndex = event ? (event.periodId - 1) * 3 + event.order : 0;
  const heroImage = event ? getPeriodEventImage(event.id) : undefined;

  return (
    <div className="absolute inset-0 z-[70]">
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: 'rgba(20,14,26,0.5)',
          backdropFilter: `blur(${shown ? BACKDROP_BLUR_PX : 0}px)`,
          WebkitBackdropFilter: `blur(${shown ? BACKDROP_BLUR_PX : 0}px)`,
          opacity: shown ? 1 : 0,
          transition: `opacity ${TRANSITION_MS}ms ${EASE}`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative flex max-h-full w-full max-w-[380px] flex-col overflow-hidden rounded-[28px] shadow-2xl"
          style={{
            background: '#fbefe1',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 24px 48px rgba(20,10,30,0.35), 0 4px 14px rgba(20,10,30,0.18)',
            transform: shown ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(14px)',
            opacity: shown ? 1 : 0,
            transition: `transform ${TRANSITION_MS}ms ${EASE}, opacity ${TRANSITION_MS}ms ease`,
          }}
        >
          <div className="flex items-center justify-between px-4 pt-4">
            {event ? (
              <span className="rounded-full bg-[#e9e7ff] px-2.5 py-1 text-[10px] font-extrabold text-[#5c62c9]">
                Период {event.periodId} • Событие {globalIndex}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-black" style={{ color: '#111b72' }}>
                <img src={coinIcon} alt="" className="h-4 w-4" />
                {coins}
              </span>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#a19cb0] transition active:scale-90"
                style={{ background: 'rgba(120,110,150,0.10)' }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-2">
            {!event ? (
              <div className="py-10 text-center">
                <p className="text-[13px] font-bold" style={{ color: '#111b72' }}>Сейчас нет доступного события</p>
                <p className="mt-1.5 text-[11px] font-semibold text-[#8a8fbf]">
                  Новое событие появится здесь по ходу периода — иногда для этого сперва нужно пройти урок.
                </p>
              </div>
            ) : phase === 'result' && lastChoice ? (
              <EventResult
                title={event.title}
                feedback={lastChoice.choice.feedback}
                effects={lastChoice.choice.effects}
                onContinue={onClose}
              />
            ) : (
              <>
                <h2 className="text-[19px] font-black leading-tight" style={{ color: '#111b72' }}>{event.title}</h2>
                <p className="mt-1.5 text-[11.5px] font-semibold leading-snug text-[#6b6880]">{event.context}</p>

                {heroImage && (
                  <img src={heroImage} alt="" className="mt-3 h-[150px] w-full rounded-[18px] object-cover" />
                )}

                {overspendWarning && (
                  <p className="mt-3 rounded-[14px] bg-[#fdeaea] px-3 py-2.5 text-center text-[10.5px] font-bold text-[#c23a3a]">
                    Перерасход! Так оплатить не получится — убери что-то из корзины и выбери другой вариант.
                  </p>
                )}
                {errorMessage && (
                  <p className="mt-3 rounded-[14px] bg-[#fff4df] px-3 py-2.5 text-center text-[10.5px] font-bold text-[#a1740f]">
                    {errorMessage}
                  </p>
                )}

                <div className="mt-3 space-y-2">
                  {event.options.map((option) => {
                    const visual = optionVisual(option);
                    const cost = formatOptionCost(option);
                    return (
                      <EventOptionCard
                        key={option.id}
                        icon={visual.icon}
                        iconBg={visual.bg}
                        label={option.label}
                        costText={cost.text}
                        costColor={cost.color}
                        consequence={option.feedback}
                        onSelect={() => handleSelect(option)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
