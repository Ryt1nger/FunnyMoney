import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
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

async function vibrate(pattern: number | number[]) {
  if (!enabled()) return;

  // В Android WebView navigator.vibrate может быть доступен, но не иметь
  // рабочего провайдера вибрации. Нативный Capacitor-плагин обходится без
  // этого ограничения и использует системный Vibrator.
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: Array.isArray(pattern) ? ImpactStyle.Medium : ImpactStyle.Light });
      return;
    } catch {
      // Если нативный модуль недоступен, пробуем web fallback ниже.
    }
  }

  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore — вибро не критичен для игры
  }
}

/** Лёгкий отклик — обычное нажатие/переключение вкладки. */
export function hapticTap() {
  void vibrate(12);
}

/** Ошибка ввода — неверный код/ответ на проверке родителя. */
export function hapticError() {
  if (!enabled()) return;
  if (Capacitor.isNativePlatform()) {
    void Haptics.notification({ type: NotificationType.Error }).catch(() => vibrate([16, 60, 16, 60, 16]));
    return;
  }
  void vibrate([16, 60, 16, 60, 16]);
}

/** Более выраженный отклик — успешное действие (покупка, выполнение задания). */
export function hapticSuccess() {
  if (!enabled()) return;
  if (Capacitor.isNativePlatform()) {
    void Haptics.notification({ type: NotificationType.Success }).catch(() => vibrate([14, 40, 18]));
    return;
  }
  void vibrate([14, 40, 18]);
}
