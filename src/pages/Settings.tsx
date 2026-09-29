import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconArrowLeft, IconSettingsGear, IconMusicNote, IconBell, IconChatBubble, IconVibration, IconAlarmClock, IconStar, IconLock, IconChevronRight, IconShieldCrown, IconHandPointing } from '../components/icons';
import Toggle from '../components/Toggle';
import { useSettingsStore } from '../features/settings/settingsStore';
import { useTutorialStore } from '../features/tutorial/tutorialStore';
import { usePetStore } from '../features/pet/petStore';
import { setMusicEnabled } from '../services/backgroundMusic';
import { stopAssistantVoice } from '../services/assistantVoice';
import { storage } from '../services/storage';
import { hapticTap, hapticError, hapticSuccess } from '../services/haptics';
import ParentDashboard from './ParentDashboard';
import bearHeadIcon from '../assets/onboarding/bear-head.png';

const RENAME_MAX_LENGTH = 16;

/** Модалка переименования питомца — тот же приём, что и родительская проверка:
 * простая карточка по центру экрана поверх затемнения, без отдельного роута. */
function RenamePetModal({
  currentName,
  onSave,
  onCancel,
}: {
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentName);
  const trimmed = value.trim();
  const canSave = trimmed.length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-[300px] rounded-[22px] bg-[#fbefe1] p-4 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <img src={bearHeadIcon} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div className="text-[15px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
            Как назовём мишку?
          </div>
        </div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={RENAME_MAX_LENGTH}
          placeholder="Имя мишки"
          onKeyDown={(e) => e.key === 'Enter' && canSave && onSave(trimmed)}
          className="mt-3 w-full rounded-2xl px-3.5 py-2.5 text-[15px] font-bold outline-none"
          style={{ background: '#f1eef9', color: '#2c2a5e' }}
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full py-2.5 text-[13px] font-bold transition active:scale-[0.98]"
            style={{ background: '#f0e6d3', color: '#6f6355' }}
          >
            Отмена
          </button>
          <button
            onClick={() => canSave && onSave(trimmed)}
            disabled={!canSave}
            className="flex-1 rounded-full py-2.5 text-[13px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)' }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  bottomInset?: number;
  onClose: () => void;
  /** Сообщает наверх (Home), нужно ли на время спрятать нижнее меню —
   * родительский кабинет/зона занимают весь экран, и таб-бар поверх них лишний. */
  onFullScreenChange?: (active: boolean) => void;
}

type ParentalView = 'closed' | 'gate' | 'dashboard' | 'zone';

/** Длительность кросс-фейда между экранами родительского доступа — держим
 * её одним числом, чтобы CSS-transition и таймер очистки слоя не разъехались. */
const VIEW_TRANSITION_MS = 300;

interface ViewSlot {
  id: number;
  key: ParentalView;
  phase: 'entering' | 'active' | 'leaving';
}

interface RowProps {
  icon: ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function SettingsRow({ icon, label, description, checked, onChange }: RowProps) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-white/85 px-3.5 py-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: '#f0e6d3', color: '#6f6355' }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
          {label}
        </div>
        {description && (
          <div className="mt-0.5 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
            {description}
          </div>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="mb-2 mt-5 text-[11.5px] font-extrabold uppercase tracking-wide" style={{ color: '#a99a83' }}>
      {children}
    </h2>
  );
}

const VIOLET_GRADIENT = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

type ParentGateMethod = 'example' | 'code';

interface ArithmeticProblem {
  text: string;
  answer: number;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Простой пример, который ребёнок 6-9 лет с ходу не решит, а взрослый — легко:
 * двузначное сложение/вычитание или умножение однозначных чисел. При ошибке
 * подставляется новый пример, чтобы его нельзя было просто запомнить. */
function generateArithmeticProblem(): ArithmeticProblem {
  const kind = randomInt(0, 2);
  if (kind === 0) {
    const a = randomInt(24, 68);
    const b = randomInt(11, 39);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  if (kind === 1) {
    const a = randomInt(41, 89);
    const b = randomInt(11, a - 12);
    return { text: `${a} − ${b}`, answer: a - b };
  }
  const a = randomInt(4, 9);
  const b = randomInt(4, 9);
  return { text: `${a} × ${b}`, answer: a * b };
}

/** Четыре точки вместо текстового поля — тап по ряду фокусирует скрытый
 * числовой инпут (открывает системную цифровую клавиатуру), а сами точки
 * лишь отражают, сколько цифр уже введено. */
function PinDots({
  value,
  length = 4,
  error,
  onChange,
  onComplete,
  autoFocus,
}: {
  value: string;
  length?: number;
  error?: boolean;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div
      className={`relative flex items-center justify-center gap-4 py-1 ${error ? 'animate-shake' : ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      {Array.from({ length }).map((_, i) => (
        <span
          key={i}
          className="h-4 w-4 rounded-full transition-colors"
          style={{
            background: i < value.length ? (error ? '#ef4060' : '#7574f0') : 'transparent',
            border: `2px solid ${error ? '#ef4060' : i < value.length ? '#7574f0' : '#d9cdbd'}`,
          }}
        />
      ))}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, length);
          onChange(next);
          hapticTap();
          if (next.length === length) onComplete?.(next);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Код доступа"
      />
    </div>
  );
}

function ExampleGate({
  onPass,
  onCancel,
  onSwitchToCode,
}: {
  onPass: () => void;
  onCancel: () => void;
  onSwitchToCode: () => void;
}) {
  const [problem, setProblem] = useState<ArithmeticProblem>(generateArithmeticProblem);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function submit() {
    if (value !== '' && Number(value) === problem.answer) {
      hapticSuccess();
      onPass();
      return;
    }
    hapticError();
    setError(true);
    setTimeout(() => {
      setProblem(generateArithmeticProblem());
      setValue('');
      setError(false);
    }, 420);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#fbefe1] px-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: '#f0e6d3', color: '#6f6355' }}
      >
        <IconLock className="h-8 w-8" />
      </div>
      <div className="text-center">
        <h2 className="text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Родительская зона
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
          Реши пример, чтобы продолжить
        </p>
      </div>
      <div
        className={`text-[26px] font-extrabold tabular-nums ${error ? 'animate-shake' : ''}`}
        style={{ color: error ? '#ef4060' : '#2c2a5e' }}
      >
        {problem.text} = ?
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value.replace(/\D/g, '').slice(0, 3));
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Ответ"
        maxLength={3}
        className="w-32 rounded-[16px] border bg-white px-4 py-2.5 text-center text-[18px] font-bold outline-none"
        style={{ borderColor: error ? '#ef4060' : '#eeddc3', color: '#2c2a5e' }}
      />
      {error && (
        <p className="-mt-3 text-[11.5px] font-semibold" style={{ color: '#ef4060' }}>
          Не совпало, вот другой пример
        </p>
      )}
      <div className="mt-1 flex w-full flex-col gap-2.5">
        <button
          onClick={submit}
          className="w-full rounded-full py-3 text-[14px] font-bold text-white transition active:scale-[0.98]"
          style={{ background: VIOLET_GRADIENT }}
        >
          Открыть кабинет
        </button>
        <button
          onClick={onSwitchToCode}
          className="w-full rounded-full py-2.5 text-[13px] font-bold transition active:scale-[0.98]"
          style={{ color: '#7574f0' }}
        >
          Войти по коду
        </button>
        <button
          onClick={onCancel}
          className="w-full rounded-full py-2.5 text-[14px] font-bold transition active:scale-[0.98]"
          style={{ color: '#7b7a8c' }}
        >
          Назад
        </button>
      </div>
    </div>
  );
}

function CodeGate({
  savedPin,
  onSaved,
  onPass,
  onCancel,
  onSwitchToExample,
}: {
  savedPin: string | null;
  onSaved: (pin: string) => void;
  onPass: () => void;
  onCancel: () => void;
  onSwitchToExample: () => void;
}) {
  const hasCode = !!savedPin && /^\d{4}$/.test(savedPin);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [value, setValue] = useState('');
  const [firstEntry, setFirstEntry] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function handleComplete(code: string) {
    if (!hasCode) {
      // Настройка кода в первый раз: сначала вводим, потом повторяем для проверки.
      if (step === 'enter') {
        setFirstEntry(code);
        setValue('');
        setStep('confirm');
        return;
      }
      if (code === firstEntry) {
        onSaved(code);
        hapticSuccess();
        onPass();
        return;
      }
      hapticError();
      setError(true);
      setErrorMessage('Коды не совпадают, начни заново');
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
        setValue('');
        setFirstEntry('');
        setStep('enter');
      }, 480);
      return;
    }
    if (code === savedPin) {
      hapticSuccess();
      onPass();
      return;
    }
    hapticError();
    setError(true);
    setErrorMessage('Неверный код, попробуй ещё раз');
    setTimeout(() => {
      setError(false);
      setErrorMessage('');
      setValue('');
    }, 480);
  }

  const title = !hasCode ? (step === 'enter' ? 'Придумай код' : 'Повтори код') : 'Введи код';
  const subtitle = !hasCode
    ? step === 'enter'
      ? 'Код из 4 цифр сохранится только на этом устройстве'
      : 'Введи те же 4 цифры ещё раз'
    : 'Код из 4 цифр для входа в кабинет';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#fbefe1] px-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: '#f0e6d3', color: '#6f6355' }}
      >
        <IconLock className="h-8 w-8" />
      </div>
      <div className="text-center">
        <h2 className="text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          {title}
        </h2>
        <p className="mt-1.5 max-w-[260px] text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
          {subtitle}
        </p>
      </div>
      <PinDots value={value} onChange={setValue} onComplete={handleComplete} error={error} autoFocus />
      {errorMessage && (
        <p className="-mt-3 text-[11.5px] font-semibold" style={{ color: '#ef4060' }}>
          {errorMessage}
        </p>
      )}
      <div className="mt-1 flex w-full flex-col gap-2.5">
        <button
          onClick={onSwitchToExample}
          className="w-full rounded-full py-2.5 text-[13px] font-bold transition active:scale-[0.98]"
          style={{ color: '#7574f0' }}
        >
          Войти по примеру
        </button>
        <button
          onClick={onCancel}
          className="w-full rounded-full py-2.5 text-[14px] font-bold transition active:scale-[0.98]"
          style={{ color: '#7b7a8c' }}
        >
          Назад
        </button>
      </div>
    </div>
  );
}

function ParentalGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const PARENT_PIN_KEY = 'parental_pin';
  const savedPin = storage.get<string>(PARENT_PIN_KEY) ?? null;
  const [method, setMethod] = useState<ParentGateMethod>('example');

  if (method === 'code') {
    return (
      <CodeGate
        savedPin={savedPin}
        onSaved={(pin) => void storage.set(PARENT_PIN_KEY, pin)}
        onPass={onPass}
        onCancel={onCancel}
        onSwitchToExample={() => setMethod('example')}
      />
    );
  }

  return <ExampleGate onPass={onPass} onCancel={onCancel} onSwitchToCode={() => setMethod('code')} />;
}
function ParentalZone({ onBack }: { onBack: () => void }) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  function resetProgress() {
    void storage.resetAll().then(() => window.location.reload());
  }

  return (
    <div className="flex h-full flex-col bg-[#fbefe1]">
      <div
        className="safe-area-topbar flex items-center gap-3 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
          style={{ color: '#2c2a5e' }}
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[17px] font-extrabold" style={{ color: '#2c2a5e' }}>
          Родительская зона
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <div className="rounded-[18px] bg-white/85 p-4">
          <div className="flex items-center gap-2">
            <IconShieldCrown className="h-6 w-6" style={{ color: '#eda21f' }} />
            <h2 className="text-[14px] font-extrabold" style={{ color: '#2c2a5e' }}>
              О приложении
            </h2>
          </div>
          <p className="mt-2 text-[12px] leading-snug" style={{ color: '#7b7a8c' }}>
            FunnyMoney помогает ребёнку учиться обращаться с деньгами через заботу о виртуальном питомце.
            Здесь можно управлять настройками, которые обычно недоступны напрямую из основного экрана.
          </p>
        </div>

        <SectionLabel>Данные</SectionLabel>
        <div className="rounded-[18px] bg-white/85 p-4">
          <p className="text-[12px] leading-snug" style={{ color: '#7b7a8c' }}>
            Весь прогресс — питомец, монеты, инвентарь и статистика — хранится только на этом устройстве.
          </p>
          {!confirmingReset ? (
            <button
              onClick={() => setConfirmingReset(true)}
              className="mt-3 w-full rounded-full py-2.5 text-[13px] font-bold text-white transition active:scale-[0.98]"
              style={{ background: '#ef4060' }}
            >
              Сбросить прогресс
            </button>
          ) : (
            <div className="mt-3 rounded-[14px] p-3" style={{ background: '#fdecec' }}>
              <p className="text-[12px] font-semibold leading-snug" style={{ color: '#c23a52' }}>
                Все монеты, питомец и покупки будут удалены безвозвратно. Точно сбросить?
              </p>
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={resetProgress}
                  className="flex-1 rounded-full py-2 text-[12.5px] font-bold text-white transition active:scale-[0.98]"
                  style={{ background: '#ef4060' }}
                >
                  Да, сбросить
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="flex-1 rounded-full py-2 text-[12.5px] font-bold transition active:scale-[0.98]"
                  style={{ background: '#f0e6d3', color: '#6f6355' }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Экран настроек — реально управляет звуком, музыкой, вибрацией, голосом и напоминаниями. */
export default function Settings({ bottomInset = 0, onClose, onFullScreenChange }: Props) {
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const soundsEnabled = useSettingsStore((s) => s.soundsEnabled);
  const assistantVoiceEnabled = useSettingsStore((s) => s.assistantVoiceEnabled);
  const vibrationEnabled = useSettingsStore((s) => s.vibrationEnabled);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const brightHintsEnabled = useSettingsStore((s) => s.brightHintsEnabled);
  const demoMode = useSettingsStore((s) => s.demoMode);

  const setMusic = useSettingsStore((s) => s.setMusicEnabled);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSounds = useSettingsStore((s) => s.setSoundsEnabled);
  const setVoice = useSettingsStore((s) => s.setAssistantVoiceEnabled);
  const setVibration = useSettingsStore((s) => s.setVibrationEnabled);
  const setReminders = useSettingsStore((s) => s.setRemindersEnabled);
  const setBrightHints = useSettingsStore((s) => s.setBrightHintsEnabled);
  const setDemoMode = useSettingsStore((s) => s.setDemoMode);

  const petName = usePetStore((s) => s.pet?.name ?? '');
  const renamePet = usePetStore((s) => s.renamePet);
  const [renaming, setRenaming] = useState(false);

  const [parentalView, setParentalView] = useState<ParentalView>('closed');

  // Пока открыт родительский кабинет/зона — прячем нижнее меню (Home), оно
  // здесь не нужно и перекрывает контент. Возвращаем меню при выходе из
  // раздела и при размонтировании экрана целиком.
  useEffect(() => {
    onFullScreenChange?.(parentalView !== 'closed');
    return () => onFullScreenChange?.(false);
  }, [parentalView, onFullScreenChange]);

  // Тот же почерк входа, что и в Инвентаре: шапка мягко проявляется, а кремовая
  // панель с настройками выезжает снизу — без этого шторка "включалась" рывком.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Плавный переход между "основными настройками", проверкой, кабинетом и
  // служебной зоной — раньше смена вида была мгновенной подменой всего дерева
  // (early return), экран будто дёргался. Держим старый слой на экране, пока
  // новый проявляется поверх него (кросс-фейд + лёгкий сдвиг), затем убираем.
  const [viewSlots, setViewSlots] = useState<ViewSlot[]>(() => [
    { id: 0, key: parentalView, phase: 'active' },
  ]);
  const nextSlotId = useRef(1);
  const isFirstViewRender = useRef(true);

  useEffect(() => {
    if (isFirstViewRender.current) {
      isFirstViewRender.current = false;
      return;
    }
    const id = nextSlotId.current++;
    setViewSlots((prev) => [
      ...prev.map((slot) => ({ ...slot, phase: 'leaving' as const })),
      { id, key: parentalView, phase: 'entering' as const },
    ]);

    const raf = requestAnimationFrame(() => {
      setViewSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, phase: 'active' } : slot)));
    });
    const timeout = setTimeout(() => {
      setViewSlots((prev) => prev.filter((slot) => slot.id === id));
    }, VIEW_TRANSITION_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [parentalView]);

  function renderParentalView(key: ParentalView): ReactNode {
    if (key === 'gate') {
      return (
        <ParentalGate
          onPass={() => setParentalView('dashboard')}
          onCancel={() => setParentalView('closed')}
        />
      );
    }
    if (key === 'dashboard') {
      return (
        <ParentDashboard
          bottomInset={bottomInset}
          onBack={() => setParentalView('closed')}
          onOpenZone={() => setParentalView('zone')}
        />
      );
    }
    if (key === 'zone') {
      return <ParentalZone onBack={() => setParentalView('dashboard')} />;
    }
    return renderMainSettings();
  }

  function renderMainSettings(): ReactNode {
    return (
    <div className="flex h-full flex-col overflow-hidden bg-[#fbefe1]">
      <div
        className="safe-area-topbar relative shrink-0 overflow-hidden px-4 pb-5 transition-opacity duration-500"
        style={{
          background: '#6d5a63',
          opacity: entered ? 1 : 0,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <IconSettingsGear className="h-6 w-6 text-white" />
          <h1 className="text-[22px] font-extrabold leading-none text-white">Настройки</h1>
        </div>
      </div>

      <div
        className="-mt-1 flex-1 overflow-y-auto rounded-t-[26px] bg-[#fbefe1] px-4 pt-1 transition-transform duration-[420ms]"
        style={{
          paddingBottom: bottomInset + 24,
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <SectionLabel>Питомец</SectionLabel>
        <button
          onClick={() => setRenaming(true)}
          className="flex w-full items-center gap-3 rounded-[18px] bg-white/85 px-3.5 py-3 text-left transition active:scale-[0.98]"
        >
          <img src={bearHeadIcon} alt="" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
              Имя мишки
            </div>
            <div className="mt-0.5 truncate text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
              {petName || 'Нажми, чтобы задать имя'}
            </div>
          </div>
          <IconChevronRight className="h-5 w-5 shrink-0" style={{ color: '#c9bda6' }} />
        </button>

        <SectionLabel>Звук и отклик</SectionLabel>
        <div className="flex flex-col gap-2">
          <SettingsRow
            icon={<IconMusicNote className="h-5 w-5" />}
            label="Музыка"
            description="Фоновая музыка в игре"
            checked={musicEnabled}
            onChange={(next) => {
              setMusic(next);
              setMusicEnabled(next);
            }}
          />
          {musicEnabled && (
            <div className="flex items-center gap-3 rounded-[18px] bg-white/85 px-3.5 py-3">
              <span className="w-[74px] shrink-0 text-[12px] font-bold" style={{ color: '#6f6355' }}>Громкость</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                aria-label="Громкость музыки"
                className="h-2 min-w-0 flex-1 cursor-pointer accent-[#6b61f4]"
              />
              <span className="w-8 shrink-0 text-right text-[12px] font-bold" style={{ color: '#2c2a5e' }}>{musicVolume}</span>
            </div>
          )}
          <SettingsRow
            icon={<IconBell className="h-5 w-5" />}
            label="Звуки игры"
            description="Отклик на покупки и задания"
            checked={soundsEnabled}
            onChange={setSounds}
          />
          <SettingsRow
            icon={<IconChatBubble className="h-5 w-5" />}
            label="Голос помощника"
            description="Озвучка подсказок Мишки"
            checked={assistantVoiceEnabled}
            onChange={(next) => {
              setVoice(next);
              if (!next) stopAssistantVoice();
            }}
          />
          <SettingsRow
            icon={<IconVibration className="h-5 w-5" />}
            label="Вибрация"
            description="Отклик на нажатия"
            checked={vibrationEnabled}
            onChange={setVibration}
          />
        </div>

        <SectionLabel>Игра</SectionLabel>
        <div className="flex flex-col gap-2">
          <SettingsRow
            icon={<IconAlarmClock className="h-5 w-5" />}
            label="Напоминания"
            description="Подсказка, если давно не было урока"
            checked={remindersEnabled}
            onChange={setReminders}
          />
          <SettingsRow
            icon={<IconStar className="h-5 w-5" />}
            label="Яркие подсказки"
            description="Точки и бейджи на важных разделах"
            checked={brightHintsEnabled}
            onChange={setBrightHints}
          />
          <SettingsRow
            icon={<IconAlarmClock className="h-5 w-5" />}
            label="Демо-режим"
            description="Сокращённые интервалы для тестирования цикла"
            checked={demoMode}
            onChange={setDemoMode}
          />
        </div>

        <SectionLabel>Помощь</SectionLabel>
        <button
          onClick={() => {
            // Обучение показывается поверх главного экрана (Home), поэтому
            // сначала закрываем настройки — иначе шторка перекроет подсказки.
            useTutorialStore.getState().restart();
            onClose();
          }}
          className="flex w-full items-center gap-3 rounded-[18px] bg-white/85 px-3.5 py-3 text-left transition active:scale-[0.98]"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: '#f0e6d3', color: '#6f6355' }}
          >
            <IconHandPointing className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
              Показать обучение снова
            </div>
            <div className="mt-0.5 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Пройти подсказки по приложению ещё раз
            </div>
          </div>
          <IconChevronRight className="h-5 w-5 shrink-0" style={{ color: '#c9bda6' }} />
        </button>

        <SectionLabel>Для взрослых</SectionLabel>
        <button
          onClick={() => setParentalView('gate')}
          className="flex w-full items-center gap-3 rounded-[18px] bg-white/85 px-3.5 py-3 text-left transition active:scale-[0.98]"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: '#f0e6d3', color: '#6f6355' }}
          >
            <IconLock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
              Родительский кабинет
            </div>
            <div className="mt-0.5 text-[10.5px] leading-snug" style={{ color: '#9a8f80' }}>
              Прогресс, покупки и родительский контроль
            </div>
          </div>
          <IconChevronRight className="h-5 w-5 shrink-0" style={{ color: '#c9bda6' }} />
        </button>
      </div>
    </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {renaming && (
        <RenamePetModal
          currentName={petName}
          onCancel={() => setRenaming(false)}
          onSave={(name) => {
            renamePet(name);
            setRenaming(false);
          }}
        />
      )}
      {viewSlots.map((slot) => (
        <div
          key={slot.id}
          className="absolute inset-0 transition-all"
          style={{
            transitionDuration: `${VIEW_TRANSITION_MS}ms`,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: slot.phase === 'active' ? 1 : 0,
            transform:
              slot.phase === 'active'
                ? 'translateY(0) scale(1)'
                : slot.phase === 'leaving'
                  ? 'translateY(-1.5%) scale(0.985)'
                  : 'translateY(1.5%) scale(0.985)',
            pointerEvents: slot.phase === 'active' ? 'auto' : 'none',
          }}
        >
          {renderParentalView(slot.key)}
        </div>
      ))}
    </div>
  );
}
