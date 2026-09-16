import splashBg from '../assets/onboarding/splash-bg.jpg';

/**
 * Экран загрузки — фирменная заставка (лого + мишка с копилкой и монетками).
 * Показывается при запуске приложения (минимум 5 секунд, см. App.tsx) и между
 * переходами со страницы на страницу. Без индикатора прогресса — просто картинка,
 * плавно появляется и исчезает (анимацию opacity делает обёртка в App.tsx).
 */
export default function Loading() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#171f3d]">
      <img src={splashBg} alt="Funny Money" className="absolute inset-0 h-full w-full object-cover" />
    </div>
  );
}
