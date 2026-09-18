import { useSettingsStore } from '../features/settings/settingsStore';

// Озвучка подсказок помощника через встроенный в браузер/WebView SpeechSynthesis —
// без сторонних сервисов и файлов. Гейтится настройкой assistantVoiceEnabled.
function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function enabled(): boolean {
  return useSettingsStore.getState().assistantVoiceEnabled;
}

/** Озвучивает текст подсказки помощника, если голос включён в настройках. */
export function speakAssistant(text: string) {
  if (!enabled() || !supported() || !text.trim()) return;
  try {
    window.speechSynthesis.cancel(); // не даём репликам накладываться друг на друга
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ru-RU';
    utter.rate = 1;
    utter.pitch = 1.1;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore — голос не критичен для игры
  }
}

/** Немедленно останавливает текущую озвучку (например, при выключении настройки). */
export function stopAssistantVoice() {
  if (!supported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
