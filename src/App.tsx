import { useEffect, useRef, useState } from 'react';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Loading from './pages/Loading';
import PageLoading from './pages/PageLoading';
import { usePetStore } from './features/pet/petStore';
import { useEconomyStore } from './features/economy/economyStore';
import { bootstrapGame } from './services/bootstrap';
import { startBackgroundMusic } from './services/backgroundMusic';
import { initGlobalTapSound } from './services/globalTapSound';
import { storage } from './services/storage';
import { usePeriodStore } from './features/economy/periodStore';
import { useDevNavStore } from './features/dev/devNavStore';
import { usePeriodEventStore } from './features/periodEvents/eventStore';
import { PERIOD_EVENTS } from './features/periodEvents/eventData';
import { useLessonProgressStore } from './features/progress/lessonProgressStore';
import { ECONOMY_RULES } from './core/economy';

// Один делегированный слушатель кликов на весь документ — даёт лёгкий звук
// тапа на любой кнопке приложения без ручной разводки по каждому месту.
initGlobalTapSound();

// Новая игра начинается без искусственно выданного дохода. Монеты приходят
// только из уроков, практики и других игровых действий.
const STARTING_COINS = ECONOMY_RULES.initialWalletCoins;

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
  return storage.get<string>('onboarded') === '1';
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// "Телефонная рамка": на десктопе — компактный мокап мобильных пропорций,
// на реальном мобильном экране (и в APK) занимает весь экран.
function App() {
  const [screen, setScreen] = useState<Screen>(() => (isOnboarded() ? 'home' : 'onboarding'));
  const currentPeriodId = usePeriodStore((s) => s.id);
  const [overlay, setOverlay] = useState<OverlayPhase>('in');
  const [overlayKind, setOverlayKind] = useState<OverlayKind>('startup');
  // Видимость overlay отделена от overlay: сначала монтируем с opacity 0,
  // и только на следующий кадр переключаем в 1 — иначе браузер не успевает
  // отрисовать стартовый кадр и появление происходит рывком, без анимации.
  // НО это относится только к оверлею ПЕРЕХОДА между экранами, где под ним уже
  // показан текущий экран и нужен плавный кросс-фейд. У самой первой, стартовой
  // заставки нет "предыдущего" видимого экрана — она обязана быть полностью
  // непрозрачной с первого же кадра, иначе на долю секунды успевает мелькнуть
  // настоящий экран (онбординг/главная) под ещё прозрачным оверлеем. Поэтому
  // по умолчанию — уже видима, а невидимый-первый-кадр-трюк применяется
  // выборочно (см. showLoadingOverlay) только для kind === 'transition'.
  const [overlayVisible, setOverlayVisible] = useState(true);
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
    if (kind === 'transition') {
      // Оверлей перехода появляется поверх УЖЕ видимого экрана — плавный
      // фейд-ин уместен и заметен (монтируем невидимым, на след. кадр — видимым).
      setOverlayVisible(false);
      // Два кадра нужны для Android WebView: первый фиксирует монтирование
      // прозрачного слоя, второй запускает уже отдельную opacity-анимацию.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (overlayRunId.current === runId) setOverlayVisible(true);
        });
      });
    } else {
      // Стартовая заставка ничего собой не "открывает" — она должна быть
      // непрозрачной сразу, без промежуточного невидимого кадра (иначе виден
      // реальный экран под ней долю секунды — тот самый баг с миганием).
      setOverlayVisible(true);
    }
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
    showLoadingOverlay('startup', STARTUP_MIN_MS, async () => {
      await bootstrapGame();
      // На Android Preferences асинхронен, поэтому после гидрации уточняем
      // экран до скрытия стартовой заставки.
      setScreen(storage.get<string>('onboarded') === '1' ? 'home' : 'onboarding');
    });
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

  // Дев-панель "Периоды"/"События": стор уже обновлён (setPeriod/debugJumpToEvent),
  // и если мы и так на главном экране — Home сам подхватит изменения реактивно,
  // без полноэкранного перехода. Оверлей нужен только когда мы реально СМЕНИЛИ
  // экран (например, были на онбординге) — тогда используем обычный goTo.
  function jumpToHome() {
    if (screen === 'home') return;
    goTo('home');
  }

  function handleOnboardingComplete(age: number, petName: string, characterId: string) {
    void storage.set('onboarded', '1');
    void storage.set('user_age', String(age));
    // Начальное состояние игры: питомец и экономика создаются один раз, здесь,
    // а не размазаны по экранам — единая точка входа в игровой прогресс.
    usePetStore.getState().createPet('bear', petName, characterId);
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
            style={{
              transitionProperty: 'opacity',
              transitionDuration: `${FADE_MS}ms`,
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              opacity: overlayVisible ? 1 : 0,
              willChange: 'opacity',
            }}
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

        {/* Прыжок сразу в нужный период (демо-режим, п. 2.5 доп. ТЗ: "следующий
            период" без ожидания реального прохождения). Переключает реальный
            usePeriodStore и просит Home открыть раздел "Периоды" — см. devNavStore. */}
        <span className="mt-1 px-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Периоды</span>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as const).map((id) => (
            <button
              key={id}
              onClick={() => {
                usePeriodStore.getState().setPeriod(id);
                useDevNavStore.getState().requestScreen('period');
                jumpToHome();
              }}
              className={`flex-1 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                screen === 'home' && currentPeriodId === id
                  ? 'bg-[#6262e4] text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Период {id}
            </button>
          ))}
        </div>
        {/* Прыжок сразу к конкретному событию периода (дев-панель): топит
            кошелёк, форсирует активный статус периода с тестовым планом,
            помечает предыдущие события в цепочке выполненными и, если у
            события есть привязка к уроку, засчитывает этот урок — иначе
            getAvailableEvent() событие не отдаст. Реальные эффекты/награды
            пропущенных событий при этом не начисляются. */}
        <span className="mt-1 px-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">События</span>
        <div className="flex flex-col gap-2">
          {([1, 2, 3, 4, 5] as const).map((periodId) => (
            <div key={periodId} className="flex gap-2">
              {PERIOD_EVENTS.filter((event) => event.periodId === periodId).map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    // Открываем именно модалку события (она смонтирована
                    // глобально в Home.tsx и всплывает поверх любого экрана),
                    // а не раздел "Периоды" — requestScreen('period') здесь
                    // специально не вызываем.
                    useEconomyStore.getState().applyCoinsDelta(300, 'Дев: тест события', { category: 'reward' });
                    usePeriodStore.getState().setPeriod(event.periodId);
                    usePeriodStore.getState().confirmPlan({ mandatory: 100, optional: 100, savings: 100 });
                    usePeriodEventStore.getState().debugJumpToEvent(event.id);
                    if (event.lessonId) useLessonProgressStore.getState().completeLesson(event.lessonId);
                    jumpToHome();
                  }}
                  title={event.title}
                  className="flex-1 truncate rounded-xl bg-neutral-100 px-2 py-2 text-[11px] font-semibold text-neutral-600 transition hover:bg-neutral-200"
                >
                  {event.order}. {event.title}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            useEconomyStore.getState().applyCoinsDelta(5000, 'Дев: +5000 монет', { category: 'reward' });
          }}
          className="rounded-xl bg-amber-50 px-4 py-2 text-left text-[13px] font-semibold text-amber-600 transition hover:bg-amber-100"
        >
          +5000 монет
        </button>

        <button
          onClick={() => {
            void storage.resetAll().then(() => window.location.reload());
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
