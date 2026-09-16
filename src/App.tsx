import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Loading from './pages/Loading';
import PageLoading from './pages/PageLoading';

const ONBOARDED_KEY = 'funnymoney_onboarded';

// Экран загрузки на запуске (большое лого, без прогресс-бара) держится минимум
// столько — даже если приложение (в нашем случае — мгновенно, синхронно) готово раньше.
const STARTUP_MIN_MS = 5000;
// Между обычными переходами страниц — второй, короткий экран загрузки
// (с прогресс-баром), не полноценная пауза запуска.
const TRANSITION_MS = 900;
// Длительность самого перехода прозрачности — одна и та же что для появления,
// что для исчезновения, чтобы заставка никогда не дёргалась резко.
const FADE_MS = 450;

type Screen = 'onboarding' | 'home';
type OverlayPhase = 'in' | 'out' | 'hidden';
type OverlayKind = 'startup' | 'transition';

function isOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

// "Телефонная рамка": на десктопе — компактный мокап мобильных пропорций,
// на реальном мобильном экране (и в APK) занимает весь экран.
function App() {
  // Целевой экран под заставкой уже выбран сразу (он ничего не грузит по-настоящему —
  // все данные мок), заставка просто перекрывает его сверху и плавно тает.
  const [screen, setScreen] = useState<Screen>(() => (isOnboarded() ? 'home' : 'onboarding'));
  const [overlay, setOverlay] = useState<OverlayPhase>('in');
  const [overlayKind, setOverlayKind] = useState<OverlayKind>('startup');
  const overlayTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearOverlayTimers() {
    overlayTimers.current.forEach(clearTimeout);
    overlayTimers.current = [];
  }

  // Показывает экран загрузки нужного вида на `holdMs`, затем плавно убирает его
  // (fade-out на FADE_MS). kind='startup' — заставка с большим лого (запуск
  // приложения), kind='transition' — короткая перебивка с прогресс-баром
  // (переход между страницами).
  function showLoadingOverlay(kind: OverlayKind, holdMs: number) {
    clearOverlayTimers();
    setOverlayKind(kind);
    setOverlay('in');
    const outId = setTimeout(() => {
      setOverlay('out');
      const hideId = setTimeout(() => setOverlay('hidden'), FADE_MS);
      overlayTimers.current.push(hideId);
    }, holdMs);
    overlayTimers.current.push(outId);
  }

  // Заставка при реальном запуске приложения — минимум 5 секунд, даже если
  // всё уже готово раньше.
  useEffect(() => {
    showLoadingOverlay('startup', STARTUP_MIN_MS);
    return clearOverlayTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goTo(next: Screen) {
    setScreen(next);
    showLoadingOverlay('transition', TRANSITION_MS);
  }

  function handleOnboardingComplete(age: number, petName: string) {
    try {
      localStorage.setItem(ONBOARDED_KEY, '1');
      localStorage.setItem('funnymoney_pet_name', petName);
      localStorage.setItem('funnymoney_user_age', String(age));
    } catch {
      // localStorage недоступен — просто продолжаем без сохранения
    }
    goTo('home');
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center gap-5 bg-neutral-300">
      <div className="relative h-screen w-full overflow-hidden sm:h-[850px] sm:max-h-[92vh] sm:w-[390px] sm:rounded-[36px] sm:shadow-2xl sm:ring-8 sm:ring-black/80">
        {screen === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
        {screen === 'home' && <Home />}

        {/* Экран загрузки — отдельный слой поверх текущего экрана, который всегда
            плавно появляется/исчезает через opacity, а не переключается резко.
            На запуске — заставка с большим лого, между страницами — версия
            с прогресс-баром. */}
        {overlay !== 'hidden' && (
          <div
            className="pointer-events-none absolute inset-0 z-50 transition-opacity ease-in-out"
            style={{ transitionDuration: `${FADE_MS}ms`, opacity: overlay === 'in' ? 1 : 0 }}
          >
            {overlayKind === 'startup' ? <Loading /> : <PageLoading />}
          </div>
        )}
      </div>

      {/* Дев-панель переключения состояний — только для отладки на десктопе, в реальном приложении не нужна */}
      <div className="hidden flex-col gap-2 rounded-2xl bg-white/90 p-3 shadow-lg sm:flex">
        <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Состояние</span>
        <button
          onClick={() => showLoadingOverlay('startup', STARTUP_MIN_MS)}
          className="rounded-xl bg-neutral-100 px-4 py-2 text-left text-[13px] font-semibold text-neutral-600 transition hover:bg-neutral-200"
        >
          Загрузка (запуск)
        </button>
        <button
          onClick={() => showLoadingOverlay('transition', TRANSITION_MS)}
          className="rounded-xl bg-neutral-100 px-4 py-2 text-left text-[13px] font-semibold text-neutral-600 transition hover:bg-neutral-200"
        >
          Загрузка (переход)
        </button>
        <button
          onClick={() => goTo('onboarding')}
          className={`rounded-xl px-4 py-2 text-left text-[13px] font-semibold transition ${
            screen === 'onboarding' ? 'bg-[#6262e4] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Первый экран
        </button>
        <button
          onClick={() => goTo('home')}
          className={`rounded-xl px-4 py-2 text-left text-[13px] font-semibold transition ${
            screen === 'home' ? 'bg-[#6262e4] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Главный экран
        </button>
      </div>
    </div>
  );
}

export default App;
