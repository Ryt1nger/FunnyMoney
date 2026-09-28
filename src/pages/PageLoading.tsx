import loadingBg from '../assets/onboarding/loading-bg.jpg';
import loadingGameBg from '../assets/onboarding/loading-game-bg.jpg';
import splashLogo from '../assets/onboarding/splash-logo.png';
import coinIcon from '../assets/icons/coin.png';

interface PageLoadingProps {
  /** Сколько реально держится экран загрузки (App.tsx: TRANSITION_MIN_MS) —
   * полоса заполняется равномерно ровно за это время, а не за фиксированный срок. */
  durationMs?: number;
  /** Вариант фона: 'game' — мишка на велосипеде (вход в мини-игру). Остальные элементы не меняются. */
  variant?: 'default' | 'game';
}

/**
 * Экран загрузки №2 — короткая перебивка между страницами (не при запуске
 * приложения, для этого есть отдельная заставка Loading.tsx с большим лого).
 * Фон — мишка с копилкой и книжкой, поверх — лого и полоса загрузки
 * с монеткой-лапкой в роли бегунка. Анимация — один проход 0% → 100%,
 * растянутый на весь durationMs, чтобы полоса доходила до конца ровно
 * к моменту, когда загрузка реально завершается.
 */
export default function PageLoading({ durationMs = 4000, variant = 'default' }: PageLoadingProps) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img src={variant === 'game' ? loadingGameBg : loadingBg} alt="" className="absolute inset-0 h-full w-full object-cover" />

      {/* Логотип сверху слева */}
      <img
        src={splashLogo}
        alt="Funny Money"
        className="absolute left-4 top-5 w-[112px] object-contain drop-shadow-lg"
      />

      {/* Полоса загрузки — толстая окантовка, тёмно-синяя незалитая часть */}
      <div className="absolute inset-x-0 bottom-[19%] flex justify-center">
        <div
          className="loading-track relative h-[22px] w-[58%] overflow-visible rounded-full"
          style={{
            background: '#222971',
            border: '3px solid #7784ea',
            boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <div
            className="loading-fill absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #fff8c9 0%, #ffd65c 45%, #f0b546 100%)',
              animationDuration: `${durationMs}ms`,
            }}
          />
          <img
            src={coinIcon}
            alt=""
            className="loading-thumb absolute top-1/2 h-[42px] w-[42px] drop-shadow-md"
            style={{ animationDuration: `${durationMs}ms` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loading-fill-grow {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes loading-thumb-move {
          from { left: 0%; }
          to { left: 100%; }
        }
        .loading-fill {
          width: 0%;
          animation-name: loading-fill-grow;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        .loading-thumb {
          left: 0%;
          transform: translate(-50%, -50%);
          animation-name: loading-thumb-move;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
