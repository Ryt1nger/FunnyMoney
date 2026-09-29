import gameMusicSrc from '../assets/audio/game-music.mp3';
import { musicGain, onMusicDuckingChange, onMusicVolumeChange } from './musicFade';
import { useSettingsStore } from '../features/settings/settingsStore';

// Музыка мини-игры «Гонка мишки». Тот же принцип, что у backgroundMusic.ts и
// practiceMusic.ts: единственный <audio> в глобальном состоянии (переживает HMR),
// автоплей ждёт первого жеста. Громкость намеренно тихая (ниже общей музыки
// приложения), плюс плавное нарастание при старте и затухание при остановке —
// чтобы трек не бил по ушам.
const BASE_VOLUME = 0.16;
const vol = () => Math.min(1, BASE_VOLUME * musicGain());
const FADE_IN_MS = 1400;
const FADE_OUT_MS = 350;

interface GameMusicGlobalState {
  audio: HTMLAudioElement | null;
  waitingForGesture: boolean;
  wantsToPlay: boolean;
  fadeTimer: ReturnType<typeof setInterval> | null;
}

function getState(): GameMusicGlobalState {
  const g = globalThis as unknown as { __fmGameMusic?: GameMusicGlobalState };
  if (!g.__fmGameMusic) {
    g.__fmGameMusic = { audio: null, waitingForGesture: false, wantsToPlay: false, fadeTimer: null };
  }
  return g.__fmGameMusic;
}

const state = getState();

function getAudio(): HTMLAudioElement {
  if (!state.audio) {
    state.audio = new Audio(gameMusicSrc);
    state.audio.loop = true;
    state.audio.volume = 0;
    state.audio.preload = 'auto';
  }
  return state.audio;
}

function enabled(): boolean {
  return useSettingsStore.getState().musicEnabled;
}

function clearFade() {
  if (state.fadeTimer) {
    clearInterval(state.fadeTimer);
    state.fadeTimer = null;
  }
}

function fadeTo(el: HTMLAudioElement, target: number, ms: number, done?: () => void) {
  clearFade();
  const from = el.volume;
  const startedAt = performance.now();
  state.fadeTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - startedAt) / ms);
    el.volume = Math.max(0, Math.min(1, from + (target - from) * k));
    if (k >= 1) {
      clearFade();
      done?.();
    }
  }, 50);
}

function waitForUserGestureThenPlay(el: HTMLAudioElement) {
  if (state.waitingForGesture) return;
  state.waitingForGesture = true;
  const resume = () => {
    state.waitingForGesture = false;
    if (!state.wantsToPlay) return;
    el.play().then(() => fadeTo(el, vol(), FADE_IN_MS)).catch(() => {
      // не критично для игры
    });
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

/** Запускает музыку игры (с плавным нарастанием). */
export function startGameMusic() {
  state.wantsToPlay = true;
  if (!enabled()) return;
  const el = getAudio();
  if (!el.paused) {
    fadeTo(el, vol(), FADE_IN_MS);
    return;
  }
  el.volume = 0;
  el.play().then(() => fadeTo(el, vol(), FADE_IN_MS)).catch(() => waitForUserGestureThenPlay(el));
}

/** Плавно гасит музыку игры и ставит на паузу. */
export function pauseGameMusic() {
  state.wantsToPlay = false;
  const el = state.audio;
  if (!el || el.paused) return;
  fadeTo(el, 0, FADE_OUT_MS, () => el.pause());
}

// Свернули приложение/погасили экран — WebView сам не замолчит, поэтому
// пауза по visibilitychange (wantsToPlay не трогаем — при возврате продолжим).
function handleVisibilityChange() {
  const el = state.audio;
  if (!el) return;
  if (document.hidden) {
    clearFade();
    if (!el.paused) el.pause();
  } else if (state.wantsToPlay && enabled() && el.paused) {
    el.volume = 0;
    el.play().then(() => fadeTo(el, vol(), FADE_IN_MS)).catch(() => waitForUserGestureThenPlay(el));
  }
}

const g = globalThis as unknown as { __fmGameMusicListenerAttached?: boolean };
if (typeof document !== 'undefined' && !g.__fmGameMusicListenerAttached) {
  g.__fmGameMusicListenerAttached = true;
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Ползунок громкости в настройках действует сразу, не дожидаясь следующего запуска трека.
const gv = globalThis as unknown as { __fmGameVol?: boolean };
if (!gv.__fmGameVol) {
  gv.__fmGameVol = true;
  onMusicVolumeChange(() => {
    const el = state.audio;
    if (el && !el.paused && state.wantsToPlay) el.volume = vol();
  });
}

onMusicDuckingChange(() => {
  const el = state.audio;
  if (el && !el.paused && state.wantsToPlay) {
    clearFade();
    el.volume = vol();
  }
});
