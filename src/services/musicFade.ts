import { useSettingsStore } from '../features/settings/settingsStore';

// Плавное изменение громкости <audio>: музыка при смене экранов затухает и
// появляется с нарастанием, а не обрывается/включается резко. Таймер хранится
// на самом элементе, поэтому новый fade отменяет предыдущий (например, музыку
// начали гасить и тут же снова включили — громкость просто развернётся).
const timers = new WeakMap<HTMLAudioElement, ReturnType<typeof setInterval>>();

export const MUSIC_FADE_IN_MS = 1200;
export const MUSIC_FADE_OUT_MS = 500;

export function cancelFade(el: HTMLAudioElement) {
  const t = timers.get(el);
  if (t) {
    clearInterval(t);
    timers.delete(el);
  }
}

export function fadeAudio(el: HTMLAudioElement, target: number, ms: number, done?: () => void) {
  cancelFade(el);
  const from = el.volume;
  const startedAt = performance.now();
  const timer = setInterval(() => {
    const k = Math.min(1, (performance.now() - startedAt) / ms);
    el.volume = Math.max(0, Math.min(1, from + (target - from) * k));
    if (k >= 1) {
      cancelFade(el);
      done?.();
    }
  }, 40);
  timers.set(el, timer);
}

/** Множитель громкости из ползунка в настройках: 35 (по умолчанию) = 1, 100 ≈ 2.9, 0 = тишина. */
export function musicGain(): number {
  const v = useSettingsStore.getState().musicVolume;
  return Math.max(0, Math.min(100, typeof v === 'number' ? v : 35)) / 35;
}

/** Реагирует на движение ползунка сразу, пока музыка играет (один слушатель на модуль). */
export function onMusicVolumeChange(cb: () => void) {
  let last = useSettingsStore.getState().musicVolume;
  useSettingsStore.subscribe((st) => {
    if (st.musicVolume !== last) {
      last = st.musicVolume;
      cb();
    }
  });
}
