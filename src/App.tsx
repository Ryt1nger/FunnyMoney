import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Loading from './pages/Loading';
import PageLoading from './pages/PageLoading';
import { usePetStore } from './features/pet/petStore';
import { useEconomyStore } from './features/economy/economyStore';
import { bootstrapGame } from './services/bootstrap';
import { startBackgroundMusic } from './services/backgroundMusic';

const ONBOARDED_KEY = 'funnymoney_onboarded';

// Стартовый баланс — тестовое значение для первого реального прогона на
// устройстве (пока не подключена финальная экономическая настройка).
const STARTING_COINS = 5000;

// Экран загрузки на запуске (большое лого, без прогресс-бара) держится минимум
// столько — даже если приложение (в нашем случае — мгновенно, синхронно) готово раньше.
const STARTUP_MIN_MS = 5000;
// Между обычными переходами страниц — второй экран загрузки (с прогресс-баром).
// Это НЕ имитация: пока он показан, реально перечитывается и проверяется
// сохранённое состояние игры (bootstrapGame) — экран держится минимум 4с
// даже если проверка завершилась раньше, и дольше 4с, если проверка не успела.
const TRANSITION_MIN_MS = 4000;
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

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// "Телефонная рамка": на десктопе — компактный мокап мобильных пропорций,
// на реальном мобильном экране (и в APK) занимает весь экран.
function App() {
  const [screen, setScreen] = useState<Screen>(() => (isOnboarded() ? 'home' : 'onboarding'));
  const [overlay, setOverlay] = useState<OverlayPhase>('in');
  const [overlayKind, setOverlayKind] = useState<OverlayKind>('startup');
  // Видимость overlay отделена от overlay: сначала монтируем с opacity 0,
  // и только на следующий кадр переключаем в 1 — иначе браузер не успевает
  // отрисовать стартовый кадр и появление происходит рывком, без анимации.
  const [overlayVisible, setOverlayVisible] = useState(false);
  // Токен последнего запуска showLoadingOverlay — если за время ожидания
  // запустили новый переход, старый обязан молча самоустраниться, а не
  // погасить более новый экран загрузки поверх него.
  const overlayRunId = useRef(0);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Таймер "оверлей уже непрозрачен" — момент, когда безопасно поменять экран
  // под ним (см. onCovered ниже и баг: мигание главного экрана при переходе).
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Показывает экран загрузки нужного вида, пока не пройдёт реальная асинхронная
  // работа `task` И не истечёт минимум `minMs` (что дольше — то и решает).
  // kind='startup' — заставка с большим лого (запуск приложения),
  // kind='transition' — экран с прогресс-баром + реальная проверка сохранённых данных.
  // onCovered (необязательный) вызывается, когда оверлей уже полностью
  // непрозрачен — именно тут (а не раньше) безопасно поменять экран под ним,
  // иначе новый экран на долю секунды "просвечивает" сквозь ещё прозрачный
  // оверлей первым кадром.
  async function showLoadingOverlay(kind: OverlayKind, minMs: number, task: () => Promise<void>, onCovered?: () => void) {
    const runId = ++overlayRunId.current;
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    if (coverTimer.current) clearTimeout(coverTimer.current);
    setOverlayKind(kind);
    setOverlay('in');
    setOverlayVisible(false);
    requestAnimationFrame(() => {
      if (overlayRunId.current === runId) setOverlayVisible(true);
    });
    if (onCovered) {
      coverTimer.current = setTimeout(() => {
        if (overlayRunId.current === runId) onCovered();
      }, FADE_MS);
    }

    await Promise.all([task(), delay(minMs)]);

    if (overlayRunId.current !== runId) return; // подменили более новым переходом — не гасим его
    setOverlay('out');
    setOverlayVisible(false);
    fadeTimer.current = setTimeout(() => {
      if (overlayRunId.current === runId) setOverlay('hidden');
    }, FADE_MS);

    // Фоновую музыку включаем только после того, как заставка запуска реально
    // отработала — на самом экране загрузки играть не должна.
    if (kind === 'startup') startBackgroundMusic();
  }

  // Заставка при реальном запуске приложения — минимум 5 секунд, и за это время
  // реально проверяем/восстанавливаем сохранённое состояние (economy/pet/inventory).
  useEffect(() => {
    showLoadingOverlay('startup', STARTUP_MIN_MS, bootstrapGame);
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      if (coverTimer.current) clearTimeout(coverTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goTo(next: Screen) {
    // Экран меняем не сразу, а только когда оверлей уже полностью закрыл его
    // (onCovered) — иначе на первом кадре виден новый экран ещё без прикрытия.
    showLoadingOverlay('transition', TRANSITION_MIN_MS, bootstrapGame, () => setScreen(next));
  }

  function handleOnboardingComplete(age: number, petName: string) {
    try {
      localStorage.setItem(ONBOARDED_KEY, '1');
      localStorage.setItem('funnymoney_user_age', String(age));
    } catch {
      // localStorage недоступен — просто продолжаем без сохранения
    }
    // Начальное состояние игры: питомец и экономика создаются один раз, здесь,
    // а не размазаны по экранам — единая точка входа в игровой прогресс.
    usePetStore.getState().createPet('bear', petName);
    useEconomyStore.getState().initIfEmpty(STARTING_COINS);
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
            с прогресс-баром (и реальной проверкой данных, не имитацией). */}
        {overlay !== 'hidden' && (
          <div
            className="pointer-events-none absolute inset-0 z-50 transition-opacity ease-in-out"
            style={{ transitionDuration: `${FADE_MS}ms`, opacity: overlayVisible ? 1 : 0 }}
          >
            {overlayKind === 'startup' ? <Loading /> : <PageLoading durationMs={TRANSITION_MIN_MS} />}
          </div>
        )}
      </div>

      {/* Дев-панель переключения состояний — только для отладки на десктопе, в реальном приложении не нужна */}
      <div className="hidden flex-col gap-2 rounded-2xl bg-white/90 p-3 shadow-lg sm:flex">
        <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Состояние</span>
        <button
          onClick={() => showLoadingOverlay('startup', STARTUP_MIN_MS, bootstrapGame)}
          className="rounded-xl bg-neutral-100 px-4 py-2 text-left text-[13px] font-semibold text-neutral-600 transition hover:bg-neutral-200"
        >
          Загрузка (запуск)
        </button>
        <button
          onClick={() => showLoadingOverlay('transition', TRANSITION_MIN_MS, bootstrapGame)}
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
        <button
          onClick={() => {
            localStorage.removeItem(ONBOARDED_KEY);
            import('./services/storage').then(({ storage }) => storage.resetAll());
            window.location.reload();
          }}
          className="rounded-xl bg-red-50 px-4 py-2 text-left text-[13px] font-semibold text-red-500 transition hover:bg-red-100"
        >
          Сбросить прогресс
        </button>
      </div>
    </div>
  );
}

export default App;
