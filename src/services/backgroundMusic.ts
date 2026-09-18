import bgMusicSrc from '../assets/audio/bg-music.mp3';

// Негромкая, зацикленная фоновая музыка на всё приложение — единственный
// экземпляр <audio> на уровне модуля (а не в компоненте), чтобы React
// StrictMode (двойной вызов эффектов в dev-режиме) или переход между
// экранами не плодили несколько одновременно играющих дорожек.
const VOLUME = 0.35;

let audio: HTMLAudioElement | null = null;
let waitingForGesture = false;
// Запомненное намерение "музыка должна играть" — отдельно от audio.paused,
// потому что пауза может быть и по настройке, и из-за блокировки автоплея
// браузером (см. waitForUserGestureThenPlay), и это разные состояния.
let wantsToPlay = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(bgMusicSrc);
    audio.loop = true;
    audio.volume = VOLUME;
    audio.preload = 'auto';
  }
  return audio;
}

// Мобильные браузеры/WebView (и десктоп-Chrome) блокируют автовоспроизведение
// со звуком до первого жеста пользователя — если play() отклонён, тихо ждём
// первый тап/клик/нажатие клавиши и пробуем ещё раз.
function waitForUserGestureThenPlay(el: HTMLAudioElement) {
  if (waitingForGesture) return;
  waitingForGesture = true;
  const resume = () => {
    waitingForGesture = false;
    if (!wantsToPlay) return; // настройку успели выключить, пока ждали жест
    el.play().catch(() => {
      // Не удалось и после жеста — сдаёмся молча, это не критично для игры.
    });
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

/** Запускает фоновую музыку (или тихо готовится запустить её по первому жесту). */
export function startBackgroundMusic() {
  wantsToPlay = true;
  const el = getAudio();
  if (!el.paused) return;
  el.play().catch(() => waitForUserGestureThenPlay(el));
}

/** Ставит фоновую музыку на паузу, не сбрасывая позицию воспроизведения. */
export function pauseBackgroundMusic() {
  wantsToPlay = false;
  if (audio && !audio.paused) audio.pause();
}

/** Настоящее включение/выключение музыки — вызывается напрямую из тумблера настроек. */
export function setMusicEnabled(enabled: boolean) {
  if (enabled) startBackgroundMusic();
  else pauseBackgroundMusic();
}
