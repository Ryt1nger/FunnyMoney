import { useEffect, useState } from 'react';
import { useEconomyStore } from '../../economy/economyStore';
import { usePeriodStore } from '../../economy/periodStore';
import { useLessonProgressStore } from '../../progress/lessonProgressStore';
import { useSettingsStore } from '../../settings/settingsStore';
import { usePeriodEventStore, type EventChoiceRecord } from '../eventStore';
import type { PeriodEventDefinition, PeriodEventOption } from '../eventData';
import { getPeriodEventImage } from '../../../data/periodsData';
import { optionVisual, optionIconSrc, formatOptionCost } from '../eventPresentation';
import EventOptionCard from './EventOptionCard';
import EventResult from './EventResult';
import ConfirmPurchaseModal, { type PurchaseEffect } from '../../../components/ConfirmPurchaseModal';
import coinIcon from '../../../assets/icons/coin.png';
import { findVoicePhrase, playVoiceClip, playVoiceSequence, stopVoiceover } from '../../../services/voiceover';

// Тексты событий в интерфейсе немного короче/длиннее, чем в записи (цифры
// также записаны словами). Поэтому для событий нельзя надёжно выбирать один
// клип по fuzzy-поиску: похожими оказываются соседние варианты. Здесь один
// раз фиксируем соответствие событие → сегменты готовой озвучки.
const EVENT_VOICE: Record<string, { intro: readonly number[]; options: readonly number[]; feedback: readonly number[] }> = {
  'period-1-feed-first': { intro: [102, 103, 104, 105], options: [106, 107, 108], feedback: [109, 110, 112] },
  'period-1-help-reward': { intro: [113, 114, 115], options: [116, 117, 118], feedback: [119, 120, 121] },
  'period-1-bowl-breaks': { intro: [122, 123, 124, 125], options: [126, 127, 128], feedback: [129, 130, 131] },
  'period-2-smart-shopping': { intro: [132, 133, 134, 135], options: [136, 137, 138], feedback: [139, 140, 141] },
  'period-2-real-discount': { intro: [142, 143, 144], options: [145, 146, 147], feedback: [148, 149, 150] },
  'period-2-overloaded-cart': { intro: [151, 152, 153], options: [154, 155, 156], feedback: [157, 158, 159] },
  'period-3-dream-house': { intro: [160, 161, 162, 163], options: [164, 165, 166], feedback: [167, 168, 169] },
  'period-3-plan-changed': { intro: [170, 171, 172, 173, 174], options: [175, 176, 177], feedback: [178, 179, 180] },
  'period-3-last-ten': { intro: [182, 183, 184, 185], options: [186, 187, 188], feedback: [189, 190, 191] },
  'period-4-sick-pet': { intro: [192, 193, 194, 195], options: [196, 197, 198], feedback: [199, 200, 201] },
  'period-4-reward': { intro: [202, 203, 204], options: [205, 206, 207], feedback: [208, 209, 210] },
  'period-4-broken-toy': { intro: [211, 212, 213, 214, 215], options: [216, 217, 218], feedback: [219, 220, 221] },
  'period-5-preparing-party': { intro: [222, 223, 224, 225], options: [226, 227, 228], feedback: [229, 230, 231] },
  'period-5-last-chance': { intro: [232, 233, 234, 235], options: [236, 237, 238], feedback: [239, 240, 241] },
  'period-5-final-choice': { intro: [242, 243, 244, 245], options: [246, 247, 248], feedback: [249, 250, 251] },
};

/** Влияние выбранного варианта на Здоровье/Счастье/Богатство для модалки
 * подтверждения — тот же принцип, что и buildPurchaseEffects в Shop.tsx
 * (эмодзи-иконка + подписанное значение), но по эффектам варианта события,
 * а не товара. Богатство здесь не пересчитываем в проценты отдельно — у
 * событий это уже готовый эффект (wealth) в тех же единицах, что и в EventResult. */
function buildEventPurchaseEffects(option: PeriodEventOption): PurchaseEffect[] {
  const { health, happiness, wealth } = option.effects;
  const rows: PurchaseEffect[] = [];
  if (health) rows.push({ label: 'Здоровье', value: health, icon: '❤️', color: '#f43f5e' });
  if (happiness) rows.push({ label: 'Счастье', value: happiness, icon: '😊', color: '#f59e0b' });
  if (wealth) rows.push({ label: 'Богатство', value: wealth, icon: '💰', color: '#22c55e', suffix: '%' });
  return rows;
}

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

  const purchaseConfirmationEnabled = useSettingsStore((s) => s.purchaseConfirmationEnabled);

  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [phase, setPhase] = useState<'choice' | 'result'>('choice');
  // Событие фиксируем на момент открытия. После выбора eventStore специально
  // блокирует следующее событие до ухода за питомцем, поэтому повторный вызов
  // getAvailableEvent() здесь вернул бы null и стирал экран результата.
  const [eventSnapshot, setEventSnapshot] = useState<PeriodEventDefinition | null>(null);
  const [lastChoice, setLastChoice] = useState<{ event: PeriodEventDefinition; option: PeriodEventOption; choice: EventChoiceRecord } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [overspendWarning, setOverspendWarning] = useState(false);
  // Вариант, ожидающий подтверждения покупки (окно "Точно хотите купить?") —
  // как в Shop/RoomPreview, показываем только для вариантов, которые реально
  // тратят монеты из кошелька (option.effects.coins < 0), и только если
  // подтверждение покупок включено в настройках.
  const [confirmOption, setConfirmOption] = useState<PeriodEventOption | null>(null);

  const event = open && periodStatus === 'active' ? eventSnapshot : null;

  useEffect(() => {
    if (!open || !event) {
      stopVoiceover();
      return;
    }
    if (phase === 'result' && lastChoice) {
      const voice = EVENT_VOICE[lastChoice.event.id];
      const optionIndex = lastChoice.event.options.findIndex((option) => option.id === lastChoice.option.id);
      playVoiceClip(voice?.feedback[optionIndex] ?? findVoicePhrase(lastChoice.choice.feedback));
    } else {
      const voice = EVENT_VOICE[event.id];
      playVoiceSequence(voice?.intro ?? [findVoicePhrase(event.title), findVoicePhrase(event.context)]);
    }
    return stopVoiceover;
  }, [open, event?.id, phase, lastChoice?.choice.feedback]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase('choice');
      setEventSnapshot(usePeriodEventStore.getState().getAvailableEvent());
      setLastChoice(null);
      setErrorMessage('');
      setOverspendWarning(false);
      setConfirmOption(null);
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
    setEventSnapshot(null);
    const t = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  function applyChoice(option: PeriodEventOption) {
    if (!event) return;
    const result = usePeriodEventStore.getState().resolveChoice(event.id, option.id);
    if (!result.ok) {
      setErrorMessage(reasonToMessage(result.reason));
      return;
    }
    setErrorMessage('');
    setLastChoice({ event, option, choice: result.choice });
    setPhase('result');
  }

  function handleSelect(option: PeriodEventOption) {
    if (!event) return;
    const voice = EVENT_VOICE[event.id];
    const optionIndex = event.options.findIndex((item) => item.id === option.id);
    playVoiceClip(voice?.options[optionIndex] ?? findVoicePhrase(option.label));
    if (event.id === OVERSPEND_EVENT_ID && option.id === OVERSPEND_OPTION_ID) {
      setOverspendWarning(true);
      return;
    }
    setOverspendWarning(false);
    // Любой вариант, тратящий монеты из кошелька, сначала проходит то же
    // окно подтверждения, что и покупки в магазине/комнатах — если оно
    // включено в настройках (родительский контроль).
    const spendsCoins = (option.effects.coins ?? 0) < 0;
    if (spendsCoins && purchaseConfirmationEnabled) {
      setConfirmOption(option);
      return;
    }
    applyChoice(option);
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

      <ConfirmPurchaseModal
        item={confirmOption ? {
          name: confirmOption.label,
          image: optionIconSrc(confirmOption) ?? coinIcon,
          price: Math.abs(confirmOption.effects.coins ?? 0),
          source: 'wallet',
          categoryLabel: confirmOption.expenseType === 'mandatory' ? 'Обязательное' : confirmOption.expenseType === 'goal' ? 'Моя цель' : 'Желание',
          description: confirmOption.feedback,
          effects: buildEventPurchaseEffects(confirmOption),
        } : null}
        onCancel={() => setConfirmOption(null)}
        onConfirm={() => {
          const option = confirmOption;
          setConfirmOption(null);
          if (option) applyChoice(option);
        }}
      />
    </div>
  );
}
