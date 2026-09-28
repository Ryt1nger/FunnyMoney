import bgMusicSrc from '../assets/audio/bg-music.mp3';
import { cancelFade, fadeAudio, musicGain, onMusicVolumeChange, MUSIC_FADE_IN_MS, MUSIC_FADE_OUT_MS } from './musicFade';

// Негромкая, зацикленная фоновая музыка на всё приложение — единственный
// экземпляр <audio> на уровне модуля (а не в компоненте), чтобы React
// StrictMode (двойной вызов эффектов в dev-режиме) или переход между
// экранами не плодили несколько одновременно играющих дорожек.
//
// Хранится не в обычной переменной модуля, а в глобальном объекте (window):
// при hot-reload (Vite HMR во время разработки) этот файл может быть
// пересобран заново — тогда обычная `let audio` в новом экземпляре модуля
// "забывает" про старый, уже играющий <audio>, и он продолжает звучать
// никем не управляемый, а поверх запускается второй. Глобальный объект
// переживает пересборку модуля, поэтому вместо дубля переиспользуется тот
// же самый элемент.
const BASE_VOLUME = 0.35;
const vol = () => Math.min(1, BASE_VOLUME * musicGain());

interface BgMusicGlobalState {
  audio: HTMLAudioElement | null;
  waitingForGesture: boolean;
  wantsToPlay: boolean;
}

function getState(): BgMusicGlobalState {
  const g = globalThis as unknown as { __fmBgMusic?: BgMusicGlobalState };
  if (!g.__fmBgMusic) {
    g.__fmBgMusic = { audio: null, waitingForGesture: false, wantsToPlay: false };
  }
  return g.__fmBgMusic;
}

const state = getState();

function getAudio(): HTMLAudioElement {
  if (!state.audio) {
    state.audio = new Audio(bgMusicSrc);
    state.audio.loop = true;
    state.audio.volume = 0;
    state.audio.preload = 'auto';
  }
  return state.audio;
}

// Мобильные браузеры/WebView (и десктоп-Chrome) блокируют автовоспроизведение
// со звуком до первого жеста пользователя — если play() отклонён, тихо ждём
// первый тап/клик/нажатие клавиши и пробуем ещё раз.
function waitForUserGestureThenPlay(el: HTMLAudioElement) {
  if (state.waitingForGesture) return;
  state.waitingForGesture = true;
  const resume = () => {
    state.waitingForGesture = false;
    if (!state.wantsToPlay) return; // настройку успели выключить, пока ждали жест
    el.volume = 0;
    el.play().then(() => fadeAudio(el, vol(), MUSIC_FADE_IN_MS)).catch(() => {
      // Не удалось и после жеста — сдаёмся молча, это не критично для игры.
    });
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

/** Запускает фоновую музыку (или тихо готовится запустить её по первому жесту). */
export function startBackgroundMusic() {
  state.wantsToPlay = true;
  const el = getAudio();
  if (!el.paused) {
    fadeAudio(el, vol(), MUSIC_FADE_IN_MS); // могла гаснуть — разворачиваем обратно
    return;
  }
  el.volume = 0;
  el.play().then(() => fadeAudio(el, vol(), MUSIC_FADE_IN_MS)).catch(() => waitForUserGestureThenPlay(el));
}

/** Ставит фоновую музыку на паузу, не сбрасывая позицию воспроизведения. */
export function pauseBackgroundMusic() {
  state.wantsToPlay = false;
  const el = state.audio;
  if (!el || el.paused) return;
  fadeAudio(el, 0, MUSIC_FADE_OUT_MS, () => {
    if (!state.wantsToPlay) el.pause();
  });
}

/** Настоящее включение/выключение музыки — вызывается напрямую из тумблера настроек. */
export function setMusicEnabled(enabled: boolean) {
  if (enabled) startBackgroundMusic();
  else pauseBackgroundMusic();
}

// Приложение сворачивают/блокируют экран, а обычный <audio> в WebView этого
// "не замечает" и продолжает играть — отсюда музыка слышна с заблокированного
// или свёрнутого телефона. document.visibilitychange — штатное событие и в
// браузере, и в Capacitor WebView — срабатывает при уходе в фон/блокировке
// экрана и при возврате. Пауза здесь временная — wantsToPlay не трогаем,
// иначе выключение экрана выглядело бы как ручное "выключил музыку в настройках".
function handleVisibilityChange() {
  if (!state.audio) return;
  if (document.hidden) {
    cancelFade(state.audio);
    if (!state.audio.paused) state.audio.pause();
  } else if (state.wantsToPlay && state.audio.paused) {
    const el = state.audio;
    el.volume = 0;
    el.play().then(() => fadeAudio(el, vol(), MUSIC_FADE_IN_MS)).catch(() => waitForUserGestureThenPlay(el));
  }
}

// Флаг слушателя тоже держим в глобальном состоянии — иначе при пересборке
// модуля (HMR) на document навешивался бы ещё один обработчик поверх уже
// висящего от предыдущей версии модуля.
const g = globalThis as unknown as { __fmBgMusicListenerAttached?: boolean };
if (typeof document !== 'undefined' && !g.__fmBgMusicListenerAttached) {
  g.__fmBgMusicListenerAttached = true;
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Ползунок громкости в настройках действует сразу, не дожидаясь следующего запуска трека.
const gv = globalThis as unknown as { __fmBgVol?: boolean };
if (!gv.__fmBgVol) {
  gv.__fmBgVol = true;
  onMusicVolumeChange(() => {
    const el = state.audio;
    if (el && !el.paused && state.wantsToPlay) el.volume = vol();
  });
}
