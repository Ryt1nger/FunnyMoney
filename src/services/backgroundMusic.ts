import bgMusicSrc from '../assets/audio/bg-music.mp3';

// Негромкая, зацикленная фоновая музыка на всё приложение — единственный
// экземпляр <audio> на уровне модуля (а не в компоненте), чтобы React
// StrictMode (двойной вызов эффектов в dev-режиме) или переход между
// экранами не плодили несколько одновременно играющих дорожек.
const VOLUME = 0.35;

let audio: HTMLAudioElement | null = null;
let waitingForGesture = false;

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
    el.play().catch(() => {
      // Не удалось и после жеста — сдаёмся молча, это не критично для игры.
    });
  };
  window.addEventListener('pointerdown', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

/** Запускает фоновую музыку (или тихо готовится запустить её по первому жесту). */
export function startBackgroundMusic() {
  const el = getAudio();
  if (!el.paused) return;
  el.play().catch(() => waitForUserGestureThenPlay(el));
}
