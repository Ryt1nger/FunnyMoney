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
      <img src={splashBg} alt="Funny Money" className="loading-splash-image absolute inset-0 h-full w-full object-cover" />
      <style>{`
        @keyframes loading-splash-appear {
          from { opacity: 0; transform: scale(1.015); }
          to { opacity: 1; transform: scale(1); }
        }
        .loading-splash-image {
          animation: loading-splash-appear 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}
