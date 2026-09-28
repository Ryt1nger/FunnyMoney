import { useSettingsStore } from '../features/settings/settingsStore';

// Короткие звуковые эффекты через WebAudio — без аудиофайлов: генерируем
// простые тона на лету, этого достаточно для отклика на покупку/выполнение
// задания и не раздувает бандл. Сам AudioContext создаётся один раз и
// лениво — многие браузеры блокируют его до первого жеста пользователя.
let ctx: AudioContext | null = null;

/** Немедленно останавливает уже запланированные эффекты.
 * Одной проверки soundsEnabled недостаточно: WebAudio уже поставил
 * осцилляторы в очередь и они продолжили бы звучать после выключения.
 */
export function stopSoundEffects() {
  const current = ctx;
  ctx = null;
  if (!current) return;
  try {
    void current.close();
  } catch {
    // ignore — выключение звука не должно ломать экран настроек
  }
}

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

// ─── Звуки мини-игры «Гонка мишки» ─────────────────────────────────────────
// Все — синтезом, как и остальные эффекты, и намеренно тихие (пиковая
// громкость 0.05–0.13), чтобы не перекрывать музыку игры.

// Шумовой «свист» с плавным сдвигом полосы фильтра — шорох колёс/смена полосы.
function playNoiseSweep(fromHz: number, toHz: number, durationMs: number, gainPeak: number, startAt = 0) {
  const audioCtx = getContext();
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime + startAt;
    const dur = durationMs / 1000;
    const size = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
    const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(fromHz, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + dur);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);
  } catch {
    // ignore
  }
}

let lastGameCoinAt = 0;
let gameCoinStep = 0;

/** Монетка: короткий «дзинь», тон растёт с каждой подряд собранной (комбо). */
export function playGameCoinSound() {
  if (!enabled()) return;
  const t = performance.now();
  gameCoinStep = t - lastGameCoinAt < 650 ? Math.min(gameCoinStep + 1, 8) : 0;
  lastGameCoinAt = t;
  const f = 880 * Math.pow(1.0595, gameCoinStep * 2);
  playTone(f, f * 1.5, 110, 0.085, 'triangle');
  playTone(f * 2, f * 2.2, 70, 0.03, 'sine', 0.02);
}

/** Смена полосы: тихий шорох. */
export function playGameLaneSound() {
  if (!enabled()) return;
  playNoiseSweep(700, 2200, 130, 0.07);
}

/** Удар о препятствие: глухой «бум» и всплеск шума. */
export function playGameHitSound() {
  if (!enabled()) return;
  playTone(190, 55, 260, 0.2, 'sine');
  playNoiseSweep(1400, 200, 220, 0.11);
}

/** Щит отбил удар: звонкий металлический «дзынь». */
export function playGameShieldBlockSound() {
  if (!enabled()) return;
  playClickTransient();
  playTone(1240, 820, 200, 0.09, 'triangle');
  playTone(1860, 1230, 160, 0.045, 'sine', 0.01);
}

/** Бонус (щит, магнит, x2): бодрое восходящее арпеджио. */
export function playGamePowerupSound() {
  if (!enabled()) return;
  playTone(523, 523, 90, 0.11, 'triangle');
  playTone(659, 659, 90, 0.11, 'triangle', 0.075);
  playTone(784, 784, 90, 0.11, 'triangle', 0.15);
  playTone(1047, 1047, 190, 0.11, 'triangle', 0.225);
}

/** Сердечко (+1 жизнь): тёплый двойной «блинг». */
export function playGameHealSound() {
  if (!enabled()) return;
  playTone(784, 784, 130, 0.11, 'sine');
  playTone(1175, 1175, 220, 0.11, 'sine', 0.11);
  playTone(2350, 2350, 160, 0.03, 'sine', 0.13);
}

/** Старт заезда: короткий взлёт. */
export function playGameStartSound() {
  if (!enabled()) return;
  playTone(392, 523, 120, 0.09, 'triangle');
  playTone(523, 784, 180, 0.09, 'triangle', 0.1);
  playNoiseSweep(400, 1800, 260, 0.05);
}

/** Конец заезда: мягкое нисходящее «ох». */
export function playGameOverSound() {
  if (!enabled()) return;
  playTone(440, 392, 200, 0.1, 'triangle');
  playTone(392, 330, 200, 0.1, 'triangle', 0.18);
  playTone(330, 220, 420, 0.1, 'triangle', 0.36);
}
