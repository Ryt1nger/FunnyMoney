import practiceMusicSrc from '../assets/audio/practice-music.mp3';
import { cancelFade, fadeAudio, musicGain, onMusicDuckingChange, onMusicVolumeChange, MUSIC_FADE_IN_MS, MUSIC_FADE_OUT_MS } from './musicFade';
import { useSettingsStore } from '../features/settings/settingsStore';

// Отдельная тихая фоновая музыка ИМЕННО для практики в уроках (не для
// видео-части — там свой закадровый голос, и общий bg-music.mp3 на это
// время и так ставится на паузу в каждом LessonX.tsx). Сделана отдельным
// модулем по тому же принципу, что и backgroundMusic.ts: один-единственный
// <audio> в глобальном состоянии, переживающем HMR-пересборку модуля, чтобы
// при горячей перезагрузке не плодились дублирующиеся дорожки.
const BASE_VOLUME = 0.09;
const vol = () => Math.min(1, BASE_VOLUME * musicGain());

interface PracticeMusicGlobalState {
  audio: HTMLAudioElement | null;
  waitingForGesture: boolean;
  wantsToPlay: boolean;
}

function getState(): PracticeMusicGlobalState {
  const g = globalThis as unknown as { __fmPracticeMusic?: PracticeMusicGlobalState };
  if (!g.__fmPracticeMusic) {
    g.__fmPracticeMusic = { audio: null, waitingForGesture: false, wantsToPlay: false };
  }
  return g.__fmPracticeMusic;
}

const state = getState();

function getAudio(): HTMLAudioElement {
  if (!state.audio) {
    state.audio = new Audio(practiceMusicSrc);
    state.audio.loop = true;
    state.audio.volume = 0;
    state.audio.preload = 'auto';
  }
  return state.audio;
}

function enabled(): boolean {
  return useSettingsStore.getState().musicEnabled;
}

// Автоплей со звуком блокируется до первого жеста — так же, как в
// backgroundMusic.ts: тихо ждём первый тап/клик и пробуем снова.
function waitForUserGestureThenPlay(el: HTMLAudioElement) {
  if (state.waitingForGesture) return;
  state.waitingForGesture = true;
  const resume = () => {
    state.waitingForGesture = false;
    if (!state.wantsToPlay) return;
    el.volume = 0;
    el.play().then(() => fadeAudio(el, vol(), MUSIC_FADE_IN_MS)).catch(() => {
      // не критично для игры
    });
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

/** Запускает тихую музыку практики (или готовится запустить её по первому жесту). */
export function startPracticeMusic() {
  state.wantsToPlay = true;
  if (!enabled()) return;
  const el = getAudio();
  if (!el.paused) {
    fadeAudio(el, vol(), MUSIC_FADE_IN_MS);
    return;
  }
  el.volume = 0;
  el.play().then(() => fadeAudio(el, vol(), MUSIC_FADE_IN_MS)).catch(() => waitForUserGestureThenPlay(el));
}

/** Ставит музыку практики на паузу, не сбрасывая позицию воспроизведения. */
export function pausePracticeMusic() {
  state.wantsToPlay = false;
  const el = state.audio;
  if (!el || el.paused) return;
  fadeAudio(el, 0, MUSIC_FADE_OUT_MS, () => {
    if (!state.wantsToPlay) el.pause();
  });
}

// Ползунок громкости в настройках действует сразу, не дожидаясь следующего запуска трека.
const gv = globalThis as unknown as { __fmPracVol?: boolean };
if (!gv.__fmPracVol) {
  gv.__fmPracVol = true;
  onMusicVolumeChange(() => {
    const el = state.audio;
    if (el && !el.paused && state.wantsToPlay) el.volume = vol();
  });
}

onMusicDuckingChange(() => {
  const el = state.audio;
  if (el && !el.paused && state.wantsToPlay) {
    cancelFade(el);
    el.volume = vol();
  }
});
