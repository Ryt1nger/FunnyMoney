import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Единый адаптер локального состояния игры.
// На Android данные лежат в нативном SharedPreferences через Capacitor
// Preferences. В браузере используется localStorage fallback. Stores читают
// из memory-cache синхронно, а запись в нативное хранилище идёт через очередь.
const PREFIX = 'funnymoney:';
const SCHEMA_VERSION = 1;
const VERSION_KEY = `${PREFIX}__schema_version`;
const LEGACY_META_KEYS: Record<string, string> = {
  funnymoney_onboarded: `${PREFIX}onboarded`,
  funnymoney_user_age: `${PREFIX}user_age`,
  funnymoney_last_lesson_visit_at: `${PREFIX}last_lesson_visit_at`,
};

const cache = new Map<string, string>();
const stableCache = new Map<string, string>();
const useNativePreferences = Capacitor.isNativePlatform();
let initialized = false;
let initialization: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function prefKey(key: string): string {
  return `${PREFIX}${key}`;
}

function readLegacy(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function listLegacyKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(PREFIX) || key in LEGACY_META_KEYS)) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

function removeLegacyKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Недоступное web-хранилище не должно ломать игровой цикл.
  }
}

async function initializeStorage(): Promise<void> {
  if (initialized) return;

  if (useNativePreferences) {
    const keys = await Preferences.keys();
    for (const key of keys.keys) {
      const result = await Preferences.get({ key });
      if (result.value !== null) cache.set(key, result.value);
    }

    // Переносим старый web-профиль один раз при переходе с localStorage.
    for (const legacyKey of listLegacyKeys()) {
      const targetKey = LEGACY_META_KEYS[legacyKey] ?? legacyKey;
      const current = cache.get(targetKey) ?? (await Preferences.get({ key: targetKey })).value;
      const legacyValue = readLegacy(legacyKey);
      if (current === null && legacyValue !== null) {
        await Preferences.set({ key: targetKey, value: legacyValue });
        cache.set(targetKey, legacyValue);
      }
    }
  } else {
    // В web/PWA Preferences также использует localStorage. Заполняем cache
    // синхронным fallback, чтобы первый render не зависел от await.
    for (const key of listLegacyKeys()) {
      const value = readLegacy(key);
      if (value !== null) cache.set(key, value);
    }
  }

  const storedVersion = cache.get(VERSION_KEY) ?? (useNativePreferences ? (await Preferences.get({ key: VERSION_KEY })).value : null);
  if (storedVersion === null) {
    cache.set(VERSION_KEY, String(SCHEMA_VERSION));
    if (useNativePreferences) await Preferences.set({ key: VERSION_KEY, value: String(SCHEMA_VERSION) });
    else {
      try {
        localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
      } catch {
        // ignore
      }
    }
  } else if (Number(storedVersion) !== SCHEMA_VERSION) {
    const keysToClear = [...cache.keys()].filter((key) => key.startsWith(PREFIX) && key !== VERSION_KEY);
    for (const key of keysToClear) {
      cache.delete(key);
      stableCache.delete(key);
      if (useNativePreferences) await Preferences.remove({ key });
      else removeLegacyKey(key);
    }
    cache.set(VERSION_KEY, String(SCHEMA_VERSION));
    if (useNativePreferences) await Preferences.set({ key: VERSION_KEY, value: String(SCHEMA_VERSION) });
  }

  for (const [key, value] of cache) stableCache.set(key, value);
  initialized = true;
}

function ensureInitialization(): Promise<void> {
  if (!initialization) {
    initialization = initializeStorage().catch(() => {
      // При недоступном native bridge продолжаем с cache и не блокируем игру.
      initialized = true;
    });
  }
  return initialization;
}

function enqueue(operation: () => Promise<void>): Promise<void> {
  const operationPromise = writeQueue.then(operation);
  writeQueue = operationPromise.catch(() => {
    // Ошибка одной записи не должна блокировать последующие записи.
  });
  return operationPromise;
}

export const storage = {
  ready(): Promise<void> {
    return ensureInitialization();
  },

  get<T>(key: string): T | null {
    const fullKey = prefKey(key);
    let raw = cache.get(fullKey);
    if (raw === undefined) {
      raw = readLegacy(fullKey) ?? undefined;
      if (raw !== undefined) cache.set(fullKey, raw);
    }
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      const stable = stableCache.get(fullKey);
      if (!stable) return null;
      try {
        cache.set(fullKey, stable);
        return JSON.parse(stable) as T;
      } catch {
        return null;
      }
    }
  },

  set<T>(key: string, value: T): Promise<void> {
    const fullKey = prefKey(key);
    const raw = JSON.stringify(value);
    cache.set(fullKey, raw);
    return enqueue(async () => {
      await ensureInitialization();
      if (useNativePreferences) {
        await Preferences.set({ key: fullKey, value: raw });
      } else {
        localStorage.setItem(fullKey, raw);
      }
      stableCache.set(fullKey, raw);
    }).catch(() => {
      // Возвращаем последнее состояние, которое удалось записать.
      const previous = stableCache.get(fullKey);
      if (previous === undefined) cache.delete(fullKey);
      else cache.set(fullKey, previous);
    });
  },

  remove(key: string): Promise<void> {
    const fullKey = prefKey(key);
    cache.delete(fullKey);
    return enqueue(async () => {
      await ensureInitialization();
      if (useNativePreferences) await Preferences.remove({ key: fullKey });
      else removeLegacyKey(fullKey);
      stableCache.delete(fullKey);
    }).catch(() => {
      const previous = stableCache.get(fullKey);
      if (previous !== undefined) cache.set(fullKey, previous);
    });
  },

  resetAll(): Promise<void> {
    return enqueue(async () => {
      await ensureInitialization();
      const keys = new Set([...cache.keys(), ...listLegacyKeys().map((key) => LEGACY_META_KEYS[key] ?? key)]);
      for (const key of keys) {
        if (!key.startsWith(PREFIX) || key === VERSION_KEY) continue;
        cache.delete(key);
        stableCache.delete(key);
        if (useNativePreferences) await Preferences.remove({ key });
        removeLegacyKey(key);
      }
      for (const legacyKey of Object.keys(LEGACY_META_KEYS)) removeLegacyKey(legacyKey);
      cache.set(VERSION_KEY, String(SCHEMA_VERSION));
      stableCache.set(VERSION_KEY, String(SCHEMA_VERSION));
      if (useNativePreferences) await Preferences.set({ key: VERSION_KEY, value: String(SCHEMA_VERSION) });
      else {
        try {
          localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
        } catch {
          // ignore
        }
      }
    });
  },
};

// Инициализация запускается заранее, но bootstrapGame всё равно явно ждёт её.
void ensureInitialization();
