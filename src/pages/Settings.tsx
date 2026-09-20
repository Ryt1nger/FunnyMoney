import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconArrowLeft, IconSettingsGear, IconMusicNote, IconBell, IconChatBubble, IconVibration, IconAlarmClock, IconStar, IconLock, IconChevronRight, IconShieldCrown } from '../components/icons';
import Toggle from '../components/Toggle';
import { useSettingsStore } from '../features/settings/settingsStore';
import { setMusicEnabled } from '../services/backgroundMusic';
import { stopAssistantVoice } from '../services/assistantVoice';
import { storage } from '../services/storage';
import ParentDashboard from './ParentDashboard';

// Тот же ключ, что и в App.tsx (ONBOARDED_KEY) — держим значение синхронно
// вручную, отдельного общего модуля-константы под него в проекте пока нет.
const ONBOARDED_KEY = 'funnymoney_onboarded';

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

/** Простая "родительская проверка" — арифметика, которую ребёнку решить не так легко. */
function makeGateQuestion() {
  const a = 3 + Math.floor(Math.random() * 6);
  const b = 2 + Math.floor(Math.random() * 6);
  return { a, b, answer: a * b };
}

function ParentalGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const [question] = useState(makeGateQuestion);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function submit() {
    if (Number(value) === question.answer) {
      onPass();
    } else {
      setError(true);
    }
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
      <div className="text-[22px] font-extrabold" style={{ color: '#2c2a5e' }}>
        {question.a} × {question.b} = ?
      </div>
      <input
        type="number"
        inputMode="numeric"
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-32 rounded-[16px] border bg-white px-4 py-2.5 text-center text-[18px] font-bold outline-none"
        style={{ borderColor: error ? '#ef4060' : '#eeddc3', color: '#2c2a5e' }}
      />
      {error && (
        <p className="-mt-3 text-[11.5px] font-semibold" style={{ color: '#ef4060' }}>
          Не совсем так, попробуй ещё раз
        </p>
      )}
      <div className="mt-1 flex w-full flex-col gap-2.5">
        <button
          onClick={submit}
          className="w-full rounded-full py-3 text-[14px] font-bold text-white transition active:scale-[0.98]"
          style={{ background: 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)' }}
        >
          Продолжить
        </button>
        <button
          onClick={onCancel}
          className="w-full rounded-full py-3 text-[14px] font-bold transition active:scale-[0.98]"
          style={{ color: '#7b7a8c' }}
        >
          Назад
        </button>
      </div>
    </div>
  );
}

function ParentalZone({ onBack }: { onBack: () => void }) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  function resetProgress() {
    storage.resetAll();
    try {
      localStorage.removeItem(ONBOARDED_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  }

  return (
    <div className="flex h-full flex-col bg-[#fbefe1]">
      <div
        className="flex items-center gap-3 px-4"
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

  const setMusic = useSettingsStore((s) => s.setMusicEnabled);
  const setSounds = useSettingsStore((s) => s.setSoundsEnabled);
  const setVoice = useSettingsStore((s) => s.setAssistantVoiceEnabled);
  const setVibration = useSettingsStore((s) => s.setVibrationEnabled);
  const setReminders = useSettingsStore((s) => s.setRemindersEnabled);
  const setBrightHints = useSettingsStore((s) => s.setBrightHintsEnabled);

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
        className="relative shrink-0 overflow-hidden px-4 pb-5 transition-opacity duration-500"
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
        </div>

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
