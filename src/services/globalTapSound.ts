import { playTapSound } from './soundEffects';

let initialized = false;

/**
 * Единый обработчик "простого нажатия" на уровне всего документа — вместо
 * того чтобы вручную дёргать playTapSound() в каждой кнопке приложения,
 * вешаем один делегированный слушатель на capture-фазе и по нему определяем,
 * что клик пришёлся именно на кнопку (или элемент с role="button").
 *
 * Кнопки с собственным более выразительным звуком (например, "Купить" в
 * ConfirmPurchaseModal — там звучит playPurchaseSound()) помечаются атрибутом
 * data-no-tap-sound, чтобы не звучать одновременно с обычным тапом.
 */
export function initGlobalTapSound() {
  if (initialized) return;
  initialized = true;
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button, [role="button"]') as HTMLElement | null;
      if (!button) return;
      if (button.hasAttribute('disabled')) return;
      if (button.closest('[data-no-tap-sound]')) return;
      playTapSound();
    },
    true, // capture — срабатывает раньше собственных обработчиков кнопки
  );
}
