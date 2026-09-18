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

function playTone(
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  gainPeak: number,
  type: OscillatorType = 'sine',
  startAt = 0,
) {
  const audioCtx = getContext();
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    const now = audioCtx.currentTime + startAt;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + durationMs / 1000);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // тихо игнорируем — звук не критичен для игры
  }
}

// Короткий отфильтрованный шумовой всплеск — даёт звуку чёткую, "щёлкающую"
// атаку в начале (как настоящий клик монетой), а не только гладкий тон.
function playClickTransient(startAt = 0) {
  const audioCtx = getContext();
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime + startAt;
    const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * 0.02));
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 0.8;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
    noise.stop(now + 0.03);
  } catch {
    // ignore — звук не критичен для игры
  }
}

function enabled(): boolean {
  return useSettingsStore.getState().soundsEnabled;
}

/**
 * Лёгкий, негромкий "тик" — обычное нажатие на кнопку интерфейса.
 * Вызывается автоматически глобальным обработчиком (см. globalTapSound.ts),
 * поэтому руками в отдельных кнопках его дёргать не нужно.
 */
export function playTapSound() {
  if (!enabled()) return;
  playTone(520, 430, 35, 0.045, 'sine');
}

/**
 * Более чёткий и заметный звук покупки — короткий щелчок-атака плюс яркий
 * восходящий "дзинь" из двух перекрывающихся тонов (похоже на звон монеты).
 */
export function playPurchaseSound() {
  if (!enabled()) return;
  playClickTransient();
  playTone(740, 1040, 90, 0.22, 'triangle');
  playTone(1040, 1320, 130, 0.17, 'triangle', 0.05);
}

/** Приятный короткий "дзинь" — успешное действие общего назначения (выполнение задания). */
export function playSuccessSound() {
  if (!enabled()) return;
  playTone(660, 990, 160, 0.18);
}

/** Более заметный "фанфарный" звук — крупная награда/открытие серии. */
export function playRewardSound() {
  if (!enabled()) return;
  playTone(523, 784, 220, 0.2);
}
