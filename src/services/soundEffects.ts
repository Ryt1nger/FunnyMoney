import { useSettingsStore } from '../features/settings/settingsStore';

// Короткие звуковые эффекты через WebAudio — без аудиофайлов: генерируем
// простые тона на лету, этого достаточно для отклика на покупку/выполнение
// задания и не раздувает бандл. Сам AudioContext создаётся один раз и
// лениво — многие браузеры блокируют его до первого жеста пользователя.
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

function playTone(freqStart: number, freqEnd: number, durationMs: number, gainPeak: number) {
  const audioCtx = getContext();
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + durationMs / 1000);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // тихо игнорируем — звук не критичен для игры
  }
}

function enabled(): boolean {
  return useSettingsStore.getState().soundsEnabled;
}

/** Приятный короткий "дзинь" — успешное действие (покупка, выполнение задания). */
export function playSuccessSound() {
  if (!enabled()) return;
  playTone(660, 990, 160, 0.18);
}

/** Мягкий "клик" — обычное нажатие/переключение вкладки. */
export function playTapSound() {
  if (!enabled()) return;
  playTone(320, 260, 60, 0.1);
}

/** Более заметный "фанфарный" звук — крупная награда/открытие серии. */
export function playRewardSound() {
  if (!enabled()) return;
  playTone(523, 784, 220, 0.2);
}
