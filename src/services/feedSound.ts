import crunchSrc from '../assets/audio/feed-crunch.mp3';
import { useSettingsStore } from '../features/settings/settingsStore';

// Звук хрумканья при кормлении питомца на кухне — реальная запись (не
// синтезированный тон, в отличие от services/soundEffects.ts), поэтому
// заведена отдельно. Исходный файл длиннее — обрезаем воспроизведение
// ровно по требованию (1.5 сек), а не переиспользуем его целиком.
const PLAY_MS = 1500;

let audio: HTMLAudioElement | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(crunchSrc);
    audio.preload = 'auto';
  }
  return audio;
}

/** Загружает звук заранее во время жеста выбора еды, чтобы при отпускании
 * он начинал звучать без задержки на сетевую/дисковую загрузку. */
export function primeFeedCrunchSound() {
  if (!useSettingsStore.getState().soundsEnabled) return;
  const el = getAudio();
  el.load();
}

/** Проигрывает хруст ровно 1.5 секунды (или до конца файла, если он короче). */
export function playFeedCrunchSound() {
  if (!useSettingsStore.getState().soundsEnabled) return;
  const el = getAudio();
  try {
    el.currentTime = 0;
    el.play().catch(() => {
      // Автоплей заблокирован без жеста — кормление и так происходит по
      // пользовательскому жесту (drag), так что это маловероятно, но на
      // всякий случай тихо игнорируем.
    });
  } catch {
    // ignore — звук не критичен для игры
  }

  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = setTimeout(() => {
    try {
      el.pause();
    } catch {
      // ignore
    }
  }, PLAY_MS);
}
