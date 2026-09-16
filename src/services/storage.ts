// Единая точка сохранения прогресса.
//
// Реализация сейчас — localStorage (работает и в браузере, и внутри Capacitor
// WebView без дополнительных нативных зависимостей). Интерфейс (get/set/remove/
// ready) специально не завязан на конкретное хранилище — когда в проект
// добавят @capacitor/preferences (см. capacitor.config.ts и SETUP_ANDROID.md),
// меняется только тело этого файла, ни один вызывающий код трогать не нужно.
//
// SCHEMA_VERSION — если формат сохранённых данных когда-нибудь несовместимо
// изменится, здесь будет миграция/сброс по ключу версии, а не крэш на старте.

const PREFIX = 'funnymoney:';
const SCHEMA_VERSION = 1;
const VERSION_KEY = `${PREFIX}__schema_version`;

function checkSchemaVersion(): void {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    const stored = raw ? Number(raw) : null;
    if (stored === SCHEMA_VERSION) return;
    if (stored === null) {
      // Первый запуск на этом устройстве — просто фиксируем текущую версию.
      localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
      return;
    }
    // Несовместимая версия схемы — считаем сохранённые игровые данные устаревшими
    // и очищаем только наш префикс (не трогаем ничего постороннего в localStorage).
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
  } catch {
    // localStorage недоступен — ничего страшного, ниже все операции безопасны и так
  }
}

checkSchemaVersion();

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // ignore quota / privacy-mode errors — game should still work in-memory
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },
  /**
   * Полный сброс игрового прогресса (демонстрационный режим / кнопка "сбросить
   * тестовый профиль" по ТЗ) — удаляет только ключи этого приложения.
   */
  resetAll(): void {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX) && key !== VERSION_KEY) toRemove.push(key);
      }
      toRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore
    }
  },
};
