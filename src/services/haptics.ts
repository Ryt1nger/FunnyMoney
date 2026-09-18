import { useSettingsStore } from '../features/settings/settingsStore';

// Тонкая обёртка над navigator.vibrate() — сам факт включения/выключения
// живёт в settingsStore, поэтому вызывающему коду достаточно позвать
// нужную функцию, а проверка настройки и поддержки браузером — внутри.
function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function enabled(): boolean {
  return useSettingsStore.getState().vibrationEnabled;
}

function vibrate(pattern: number | number[]) {
  if (!enabled() || !canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore — вибро не критичен для игры
  }
}

/** Лёгкий отклик — обычное нажатие/переключение вкладки. */
export function hapticTap() {
  vibrate(12);
}

/** Более выраженный отклик — успешное действие (покупка, выполнение задания). */
export function hapticSuccess() {
  vibrate([14, 40, 18]);
}
