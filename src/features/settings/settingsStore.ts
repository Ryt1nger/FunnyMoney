import { create } from 'zustand';
import { storage } from '../../services/storage';

export interface SettingsState {
  /** фоновая музыка приложения */
  musicEnabled: boolean;
  /** короткие звуковые эффекты (покупки, выполнение заданий и т.п.) */
  soundsEnabled: boolean;
  /** голосовые подсказки помощника (озвучка текста) */
  assistantVoiceEnabled: boolean;
  /** вибро-отклик на действия */
  vibrationEnabled: boolean;
  /** напоминания об уроке (карточка "Мишка заскучал") */
  remindersEnabled: boolean;
  /** яркие подсказки — точка-индикатор на вкладке "День" и бейджи событий */
  brightHintsEnabled: boolean;
}

interface SettingsStore extends SettingsState {
  setMusicEnabled: (value: boolean) => void;
  setSoundsEnabled: (value: boolean) => void;
  setAssistantVoiceEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
  setRemindersEnabled: (value: boolean) => void;
  setBrightHintsEnabled: (value: boolean) => void;
  /** Перечитывает состояние из storage — реальная проверка на межстраничном экране загрузки. */
  hydrate: () => void;
}

const STORAGE_KEY = 'settings';

const defaultState: SettingsState = {
  musicEnabled: true,
  soundsEnabled: true,
  // по умолчанию выключено — так же, как в дизайн-референсе экрана настроек
  assistantVoiceEnabled: false,
  vibrationEnabled: true,
  remindersEnabled: true,
  brightHintsEnabled: true,
};

function isValidSettingsState(value: unknown): value is SettingsState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.musicEnabled === 'boolean' &&
    typeof v.soundsEnabled === 'boolean' &&
    typeof v.assistantVoiceEnabled === 'boolean' &&
    typeof v.vibrationEnabled === 'boolean' &&
    typeof v.remindersEnabled === 'boolean' &&
    typeof v.brightHintsEnabled === 'boolean'
  );
}

function persist(state: SettingsState) {
  storage.set(STORAGE_KEY, state);
}

function loadInitial(): SettingsState {
  const saved = storage.get<Partial<SettingsState>>(STORAGE_KEY);
  if (!saved) return defaultState;
  // Подстраховка на случай старых сохранений без части полей —
  // недостающие ключи просто берём из значений по умолчанию.
  return { ...defaultState, ...saved };
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadInitial(),

  setMusicEnabled: (value) => {
    const next = { ...get(), musicEnabled: value };
    persist(next);
    set({ musicEnabled: value });
  },
  setSoundsEnabled: (value) => {
    const next = { ...get(), soundsEnabled: value };
    persist(next);
    set({ soundsEnabled: value });
  },
  setAssistantVoiceEnabled: (value) => {
    const next = { ...get(), assistantVoiceEnabled: value };
    persist(next);
    set({ assistantVoiceEnabled: value });
  },
  setVibrationEnabled: (value) => {
    const next = { ...get(), vibrationEnabled: value };
    persist(next);
    set({ vibrationEnabled: value });
  },
  setRemindersEnabled: (value) => {
    const next = { ...get(), remindersEnabled: value };
    persist(next);
    set({ remindersEnabled: value });
  },
  setBrightHintsEnabled: (value) => {
    const next = { ...get(), brightHintsEnabled: value };
    persist(next);
    set({ brightHintsEnabled: value });
  },

  hydrate: () => {
    const saved = storage.get<Partial<SettingsState>>(STORAGE_KEY);
    if (saved && isValidSettingsState({ ...defaultState, ...saved })) {
      set({ ...defaultState, ...saved });
    } else if (saved) {
      const fixed = { ...defaultState, ...saved };
      storage.set(STORAGE_KEY, fixed);
      set(fixed);
    }
  },
}));
