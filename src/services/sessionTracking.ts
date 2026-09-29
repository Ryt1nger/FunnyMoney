import { useSessionStore } from '../features/progress/sessionStore';

/**
 * Считает реальное время в приложении простым heartbeat'ом: каждые TICK_MS
 * проверяем document.visibilityState, и если экран сейчас видим — добавляем
 * ровно TICK_MS к сегодняшнему счётчику. Никакой оценки "на глаз": если
 * приложение свёрнуто (или устройство заснуло), тик просто не засчитывается,
 * поэтому большие скачки системных часов не превращаются в фиктивные часы игры.
 */
const TICK_MS = 15000;

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

export function startSessionTracking(): void {
  if (started) return; // защита от повторного вызова (например, React StrictMode)
  started = true;

  useSessionStore.getState().registerSessionStart();

  timer = setInterval(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      useSessionStore.getState().addActiveTime(TICK_MS);
    }
  }, TICK_MS);
}

export function stopSessionTracking(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
