import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
// обрезанный по силуэту вариант — только для отбрасываемой тени,
// иначе прозрачное поле PNG превращается после отражения в зазор
import bearSilhouette from '../assets/pet/bear-main-trim.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import bgRoom from '../assets/backgrounds/room-day.jpg';
import RoomPreview from './RoomPreview';
import { rooms, roomsBySection, type RoomProduct } from '../data/shopData';
import boneToy from '../assets/items/toys/bone-toy-card.png';
import boneBlob from '../assets/ui/bone-blob.png';
import levelFlower from '../assets/ui/level-flower.png';
import coinIcon from '../assets/icons/coin.png';
import heartMetricIcon from '../assets/icons/metrics/heart-3d.png';
import smileMetricIcon from '../assets/icons/metrics/smile-3d.png';
import coinsMetricIcon from '../assets/icons/metrics/coins-3d.png';
import GlassMetric from '../components/GlassMetric';
import BottomNav, { type TabId } from '../components/BottomNav';
import BottomSheet from '../components/BottomSheet';
import EarnCoinsModal from '../components/EarnCoinsModal';
import Lessons from './Lessons';
import Inventory from './Inventory';
import Wardrobe from './Wardrobe';
import { BearAvatar } from './Wardrobe';
import Kitchen from './Kitchen';
import PageLoading from './PageLoading';
import Shop from './Shop';
import Stats from './Stats';
import Settings from './Settings';
import Day from './Day';
import ProgressPage from './Progress';
import PiggyBank from './PiggyBank';
import Period from './Period';
import TutorialOverlay from '../components/TutorialOverlay';
import { usePetStore } from '../features/pet/petStore';
import { useEconomyStore } from '../features/economy/economyStore';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { useSettingsStore } from '../features/settings/settingsStore';
import { useTutorialStore } from '../features/tutorial/tutorialStore';
import { useDevNavStore } from '../features/dev/devNavStore';
import { usePeriodStore } from '../features/economy/periodStore';
import { usePeriodEventStore } from '../features/periodEvents/eventStore';
import { useLessonProgressStore } from '../features/progress/lessonProgressStore';
import EventModal from '../features/periodEvents/components/EventModal';
import { purchaseRoom } from '../features/economy/purchase';
import { hapticTap } from '../services/haptics';
import { storage } from '../services/storage';
import { progressLevels, MAX_LEVEL } from '../data/progressLevels';
import {
  IconStar,
  IconPlus,
  IconBackpackLight,
  IconSettingsGear,
  IconCutlery,
  IconChevronRight,
} from '../components/icons';
import piggyIcon from '../assets/piggy-bank/piggy.png';

// После стартового обучения даём ребёнку немного освоиться и только потом
// предлагаем первый обязательный урок.
const EVENT_COPY = {
  title: 'Мишка заскучал\nбез урока!',
  description: 'Давно не был на уроке!',
};

// Русское склонение "день/дня/дней" для карточки серии.
const LESSON_REMINDER_THRESHOLD_MS = 3 * 60 * 60 * 1000;
const FIRST_LESSON_REMINDER_DELAY_MS = 90 * 1000;

// Переход между главной и кухней в обе стороны — короткий экран загрузки
// с прогресс-баром (см. PageLoading — полоса заполняется ровно за этот срок).
// Шторка (BottomSheet) открывается/закрывается СРАЗУ под этим экраном —
// её анимация выезда/заезда (~420-440мс, см. BottomSheet.tsx) успевает
// полностью отыграть, пока загрузка ещё не убрана, поэтому в момент, когда
// загрузка исчезает, нужный экран уже полностью на месте, без "шторки" на
// глазах у пользователя. Длительность поэтому не может быть меньше этой
// анимации — небольшой запас на всякий случай.
const SCREEN_LOADING_MS = 1500;

// Плавное появление/исчезновение самого экрана загрузки (отдельно от
// длительности его показа выше) — чтобы не выглядело резким "миганием".
const SCREEN_LOADING_FADE_MS = 420;

// Свайп вверх с главного экрана открывает раздел уроков — тот же простой
// порог, что и на кухне (см. Kitchen.tsx), но срабатывает только когда
// поверх главного экрана ничего не открыто (иначе жест мешал бы шторкам,
// превью комнаты, окошку заработка монет и экрану загрузки кухни).
const SWIPE_UP_THRESHOLD = 70;

function shouldShowLessonReminder() {
  if (useLessonProgressStore.getState().isCompleted('what-is-money')) return false;
  const tutorialFinishedAt = storage.get<number>('tutorial_finished_at');
  if (tutorialFinishedAt) return Date.now() - tutorialFinishedAt >= FIRST_LESSON_REMINDER_DELAY_MS;
  const raw = storage.get<string>('last_lesson_visit_at');
  if (!raw) return true; // ещё ни разу не заходил — точно пора напомнить
  const lastVisit = Number(raw);
  if (!Number.isFinite(lastVisit)) return true;
  return Date.now() - lastVisit > LESSON_REMINDER_THRESHOLD_MS;
}

function markLessonVisited() {
  void storage.set('last_lesson_visit_at', String(Date.now()));
}

type SheetId = TabId | 'inventory' | 'wardrobe' | 'settings' | 'progress' | 'kitchen' | 'piggy' | 'period';

export default function Home() {
  const pet = usePetStore((s) => s.pet);
  // Реальные уровень/опыт питомца — раньше здесь были захардкоженные
  // CURRENT_LEVEL/CURRENT_XP (всегда 1/0), из-за чего опыт с заданий дня
  // нигде не накапливался. Теперь берём из petStore (см. addXp в Day.tsx).
  const level = pet?.level ?? 1;
  const xp = pet?.xp ?? 0;
  const xpToNext = progressLevels[Math.min(level, MAX_LEVEL) - 1].xpThreshold;
  const coins = useEconomyStore((s) => s.coins);
  const wealthScore = useEconomyStore((s) => s.wealthScore);
  const savingsGoal = useEconomyStore((s) => s.savingsGoal);
  const totalSaved = useEconomyStore((s) => s.savingsBalance ?? s.totalSaved);
  const savingsProgressPercent = savingsGoal
    ? Math.min(100, Math.round((totalSaved / Math.max(1, savingsGoal.price)) * 100))
    : 0;
  const ownedRoomIds = useInventoryStore((s) => s.ownedRoomIds);
  const activeRoomId = useInventoryStore((s) => s.activeRoomId);
  const activeKitchenRoomId = useInventoryStore((s) => s.activeKitchenRoomId);
  const ownedProductIds = useInventoryStore((s) => s.ownedProductIds);
  const outfitIds = useInventoryStore((s) => s.outfitIds);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const brightHintsEnabled = useSettingsStore((s) => s.brightHintsEnabled);
  const purchaseConfirmationEnabled = useSettingsStore((s) => s.purchaseConfirmationEnabled);
  const tutorialActive = useTutorialStore((s) => s.active);

  const petName = pet?.name ?? 'Мишка';
  const health = pet?.health ?? 0;
  const happiness = pet?.happiness ?? 0;
  const petNeedsAttention = health <= 65 || happiness <= 35;
  // Богатство — метрика-проценты 0..100, производная от wealthScore экономики.
  const wealth = Math.max(0, Math.min(100, wealthScore));

  const [tab, setTab] = useState<TabId>('home');
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [piggyPrefillAmount, setPiggyPrefillAmount] = useState<number | null>(null);
  const [showLessonReminder, setShowLessonReminder] = useState(shouldShowLessonReminder);
  const [, setEventClock] = useState(0);
  // Окошко "как заработать монеты" по кнопке "+" в балансе — ведёт либо на
  // уроки, либо на задания дня.
  const [earnModalOpen, setEarnModalOpen] = useState(false);
  // Экран загрузки между главной и кухней (в обе стороны) — см. SCREEN_LOADING_MS.
  // null — не показан; 'kitchen'/'home' — какой переход сейчас скрыт под ним.
  const [screenLoading, setScreenLoading] = useState<'kitchen' | 'home' | 'lesson-enter' | 'lesson-exit' | null>(null);
  const screenLoadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Отдельно от screenLoading (который определяет, ЧТО сейчас скрыто под
  // загрузкой и когда переход считается завершённым) — состояние самого
  // оверлея: мигание убрано, экран загрузки плавно появляется и исчезает,
  // а не пропадает вместе со сменой экрана резким скачком.
  const [loadingMounted, setLoadingMounted] = useState(false);
  const [loadingShown, setLoadingShown] = useState(false);
  const loadingUnmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (screenLoading !== null) {
      if (loadingUnmountTimer.current) {
        clearTimeout(loadingUnmountTimer.current);
        loadingUnmountTimer.current = null;
      }
      setLoadingMounted(true);
      const firstFrame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setLoadingShown(true));
      });
      return () => cancelAnimationFrame(firstFrame);
    }
    // screenLoading стал null — сначала плавно гасим (transition-opacity в
    // разметке ниже), и только после завершения затухания убираем оверлей
    // из DOM целиком.
    setLoadingShown(false);
    loadingUnmountTimer.current = setTimeout(() => setLoadingMounted(false), SCREEN_LOADING_FADE_MS);
    return () => {
      if (loadingUnmountTimer.current) clearTimeout(loadingUnmountTimer.current);
    };
  }, [screenLoading]);
  // Магазин, открытый корзинкой с экрана кухни, показывает только «Еду» и
  // «Интерьер» (и только кухонный подраздел интерьера) — из нижнего меню он
  // как обычно открывается полным (см. onChange у BottomNav ниже).
  const [shopKitchenOnly, setShopKitchenOnly] = useState(false);
  // Активная "комната" — главная или кухня. Меняется ТОЛЬКО явными иконками
  // (кухня на главной, домик на кухне) или свайпом вниз с кухни — и никогда
  // при открытии/закрытии обычных разделов (уроки/магазин/день/рейтинг/
  // прогресс), даже если их открыли из нижнего меню, находясь на кухне.
  // Благодаря этому закрытие такого раздела всегда возвращает туда, откуда
  // его открыли (см. baseSheet ниже), а не всегда на главную.
  const [room, setRoom] = useState<'home' | 'kitchen'>('home');
  const baseSheet: SheetId | null = room === 'kitchen' ? 'kitchen' : null;

  function closeSheet() {
    // страховка: шторка закрыта — урок точно не идёт, свайпы снова доступны
    setIsOnLesson(false);
    // Кухню закрываем свайпом вниз/тапом по фону так же, как и кнопкой-домиком
    // внутри неё самой — с экраном загрузки (см. closeKitchen).
    if (sheet === 'kitchen') {
      closeKitchen();
      return;
    }
    // Закрытие обычного раздела не меняет активную комнату.
    setSheet(baseSheet);
    setTab('home');
  }

  // Открываем шторку кухни СРАЗУ (не по завершении таймера) — так её выезд
  // отыгрывает за экраном загрузки, а не после него (см. комментарий у
  // SCREEN_LOADING_MS выше).
  function openKitchen() {
    setScreenLoading('kitchen');
    setRoom('kitchen');
    setSheet('kitchen');
    if (screenLoadingTimer.current) clearTimeout(screenLoadingTimer.current);
    screenLoadingTimer.current = setTimeout(() => {
      setScreenLoading(null);
    }, SCREEN_LOADING_MS);
  }

  // Возврат с кухни на главную — та же загрузка, только в обратную сторону:
  // шторка кухни начинает закрываться сразу, а не после экрана загрузки.
  function closeKitchen() {
    setScreenLoading('home');
    setRoom('home');
    setSheet(null);
    setTab('home');
    if (screenLoadingTimer.current) clearTimeout(screenLoadingTimer.current);
    screenLoadingTimer.current = setTimeout(() => {
      setScreenLoading(null);
    }, SCREEN_LOADING_MS);
  }

  function transitionLesson(direction: 'enter' | 'exit') {
    setScreenLoading(direction === 'enter' ? 'lesson-enter' : 'lesson-exit');
    if (screenLoadingTimer.current) clearTimeout(screenLoadingTimer.current);
    screenLoadingTimer.current = setTimeout(() => setScreenLoading(null), SCREEN_LOADING_MS);
    // Отдельный (не путать с navHidden — тот же сигнал использует и
    // родительский кабинет) точный флаг "сейчас идёт урок": по нему гасим
    // автопоказ модалки сюжетного события, чтобы она не перебивала урок.
    setIsOnLesson(direction === 'enter');
  }

  useEffect(() => {
    return () => {
      if (screenLoadingTimer.current) clearTimeout(screenLoadingTimer.current);
    };
  }, []);

  // Обучение при первом входе — запускается один раз (см. tutorialStore),
  // повторно уже не появляется само (можно включить заново из настроек).
  useEffect(() => {
    useTutorialStore.getState().startIfNeeded();
  }, []);

  // Игровые часы: задержки событий, плавное снижение показателей питомца и
  // отложенное напоминание о первом уроке проверяются независимо от того,
  // на каком экране сейчас находится ребёнок.
  useEffect(() => {
    const timer = window.setInterval(() => {
      usePetStore.getState().tickNeeds();
      setShowLessonReminder(shouldShowLessonReminder());
      setEventClock((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Мост для дев-панели (App.tsx, вне "телефона"): кнопки "Период 1/2/3" там
  // переключают usePeriodStore и просят здесь открыть раздел "Периоды" — сама
  // Home ничего не знает про дев-панель, только слушает этот запрос и сразу
  // его гасит, чтобы повторный клик по той же кнопке тоже срабатывал.
  const devNavRequest = useDevNavStore((s) => s.request);
  useEffect(() => {
    if (devNavRequest === 'period') {
      setSheet('day');
      useDevNavStore.getState().clearRequest();
    }
  }, [devNavRequest]);

  // Модалка сюжетного события периода — смонтирована здесь один раз, поэтому
  // может всплывать поверх ЛЮБОГО экрана внутри Home (главная, магазин,
  // копилка, статистика, список уроков…), а не только раздела "Периоды".
  // Единственное исключение — активный урок (isOnLesson): его не перебиваем.
  const [isOnLesson, setIsOnLesson] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  // Событие, которое ребёнок явно закрыл крестиком (не решил) — не лезем с
  // ним повторно на этом же экране, но при переходе на другой экран (или
  // другую шторку) даём игре попробовать показать его снова.
  const [dismissedEventId, setDismissedEventId] = useState<string | null>(null);
  const periodStatusForEvents = usePeriodStore((s) => s.status);
  // Подписки нужны только для перерисовки — getAvailableEvent() читает эти
  // сторы напрямую через getState() и сам по себе не реактивен.
  usePeriodEventStore((s) => s.completedEventIds.length);
  useLessonProgressStore((s) => s.completedLessonIds.length);
  const availableEvent = periodStatusForEvents === 'active' ? usePeriodEventStore.getState().getAvailableEvent() : null;

  useEffect(() => {
    if (!availableEvent || isOnLesson || tutorialActive) return;
    if (availableEvent.id === dismissedEventId) return;
    setOpenEventId(availableEvent.id);
    setEventModalOpen(true);
  }, [availableEvent?.id, isOnLesson, tutorialActive, dismissedEventId]);

  // Переход на другой экран/шторку — новый шанс показать отложенное событие.
  useEffect(() => {
    setDismissedEventId(null);
  }, [tab, sheet]);

  function closeEventModal() {
    setEventModalOpen(false);
    if (openEventId && usePeriodEventStore.getState().getAvailableEvent()?.id === openEventId) {
      setDismissedEventId(openEventId);
    }
  }

  function openAvailableEventModal() {
    const current = usePeriodEventStore.getState().getAvailableEvent();
    if (!current) return;
    setOpenEventId(current.id);
    setEventModalOpen(true);
  }

  function openLessonsFromReminder() {
    setTab('lessons');
    setSheet('lessons');
  }

  // Любой заход на урок (через напоминание или через нижнюю навигацию) считается
  // визитом — запоминаем время и прячем напоминание до следующего "долгого перерыва".
  useEffect(() => {
    if (sheet === 'lessons') {
      markLessonVisited();
      setShowLessonReminder(false);
    }
  }, [sheet]);

  const [previewRoom, setPreviewRoom] = useState<RoomProduct | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(74);
  // Родительский кабинет/зона занимают весь экран — на время убираем нижнее меню.
  const [navHidden, setNavHidden] = useState(false);

  // высота навигации меряется по факту — шторка останавливается ровно над ней
  useLayoutEffect(() => {
    if (navRef.current) setNavHeight(navRef.current.offsetHeight);
  }, []);
  const xpPercent = Math.min(100, Math.round((xp / xpToNext) * 100));

  const swipeUpRef = useRef<{ startX: number; startY: number } | null>(null);
  // Жест активен только когда над главным экраном ничего не открыто —
  // иначе свайп внутри шторки/превью/модалки/экрана загрузки случайно
  // триггерил бы переход на уроки.
  const swipeUpGestureActive = sheet === null && !previewRoom && !earnModalOpen && screenLoading === null;

  function handleRootPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!swipeUpGestureActive) return;
    swipeUpRef.current = { startX: e.clientX, startY: e.clientY };
  }

  function handleRootPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const start = swipeUpRef.current;
    swipeUpRef.current = null;
    if (!start || !swipeUpGestureActive) return;
    const dy = start.startY - e.clientY; // положительно — свайп вверх
    const dx = Math.abs(e.clientX - start.startX);
    if (dy > SWIPE_UP_THRESHOLD && dy > dx) {
      hapticTap();
      setTab('lessons');
      setSheet('lessons');
    }
  }

  return (
    // Фото комнаты — фон ВСЕГО экрана. Контент раскладывается колонкой
    // на всю высоту кадра: шапка сверху, навигация прижата к низу,
    // медведь занимает всё свободное место между ними.
    <div
      // isolate — свой стековый контекст: без него внутренние z-index (в том
      // числе тур z-[65], см. TutorialOverlay ниже) сравнивались бы напрямую
      // с оверлеем экрана загрузки в App.tsx (z-50, соседний элемент того же
      // родителя) и могли вылезти поверх него. С isolate все z-index внутри
      // Home гарантированно остаются под тем оверлеем, пока он не скрыт.
      className={`relative isolate h-full w-full overflow-hidden bg-[#b9835a] ${swipeUpGestureActive ? 'touch-none' : ''}`}
      onPointerDown={handleRootPointerDown}
      onPointerUp={handleRootPointerUp}
    >
      <img
        src={rooms.find((r) => r.id === activeRoomId)?.background ?? bgRoom}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-bottom"
      />

      <div className="relative flex h-full flex-col">
        {/* Шапка: питомец + монеты */}
        <div
          className="safe-area-topbar relative z-20 flex items-start justify-between gap-3 px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
        >
          {/* Блок питомца — без плашки, прямо поверх фото (как в референсе).
              Пропорции от диаметра аватара D=52: цветок 0.56D, его центр на 1.217D,
              полоса XP начинается на 1.587D, её высота 0.187D. */}
          {/* Аватарка + полоса опыта — кликабельны и ведут на экран "Прогресс"
              (5 уровней развития). Маленькая стрелочка справа — подсказка
              ребёнку, что сюда можно нажать (сам блок иначе выглядел бы как
              обычная неинтерактивная шапка). */}
          <button
            data-tour="home-level"
            onClick={() => setSheet('progress')}
            className="flex items-center rounded-2xl py-0.5 pr-1 transition active:scale-[0.97]"
            aria-label="Открыть прогресс уровня"
          >
            <div className="relative shrink-0">
              <img
                src={bearAvatar}
                alt={petName}
                className="h-[52px] w-[52px] rounded-full border-2 border-white object-cover shadow-lg"
              />
              <div className="absolute -right-[15px] top-1/2 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center drop-shadow">
                <img src={levelFlower} alt="" className="absolute inset-0 h-full w-full" />
                <span className="relative text-[11px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {level}
                </span>
              </div>
            </div>

            <div className="ml-[30px]">
              <div
                className="text-[15px] font-bold leading-none text-white"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.45)' }}
              >
                {petName}
              </div>
              <div
                className="mt-1.5 h-[10px] w-[118px] overflow-hidden rounded-full"
                style={{ background: 'rgba(18,16,32,0.42)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpPercent}%`,
                    background: 'linear-gradient(180deg, #8b88f4 0%, #6a62ea 100%)',
                  }}
                />
              </div>
              <div
                className="mt-1 text-[11px] font-medium leading-none text-white"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
              >
                {xp} / {xpToNext} XP
              </div>
            </div>

            <IconChevronRight
              className="ml-1 h-4 w-4 shrink-0 self-center text-white drop-shadow"
              style={{ opacity: 0.85 }}
            />
          </button>

          <div data-tour="home-coins" className="flex shrink-0 flex-col items-end gap-1.5">
            <div
              className="flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pl-2.5 pr-1.5 backdrop-blur-md"
              style={{
                background: 'rgba(26,20,40,0.30)',
                borderColor: 'rgba(255,255,255,0.30)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              }}
            >
              <img src={coinIcon} alt="" className="h-[22px] w-[22px]" />
              <span className="text-base font-bold leading-none text-white">{coins}</span>
              <button
                onClick={() => setEarnModalOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition active:scale-95"
                style={{ background: 'linear-gradient(180deg, #7c74f5 0%, #5b4de0 100%)' }}
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Метрики */}
        <div data-tour="home-metrics" className="relative z-20 mt-3 flex items-center gap-2.5 px-4">
          <GlassMetric
            icon={<img src={heartMetricIcon} alt="" className="h-full w-full object-contain" />}
            iconGradient="transparent"
            label="Здоровье"
            value={health}
            barGradient="linear-gradient(90deg, #fb7f92 0%, #ef4060 100%)"
          />
          <GlassMetric
            icon={<img src={smileMetricIcon} alt="" className="h-full w-full object-contain" />}
            iconGradient="transparent"
            label="Счастье"
            value={happiness}
            barGradient="linear-gradient(90deg, #f9cb63 0%, #efa622 100%)"
          />
          <GlassMetric
            icon={<img src={coinsMetricIcon} alt="" className="h-full w-full object-contain" />}
            iconGradient="transparent"
            label="Богатство"
            value={wealth}
            barGradient="linear-gradient(90deg, #63d98b 0%, #21a44f 100%)"
          />
        </div>

        {/* Кнопки под статистиками: слева стопкой настройки и (под ними) инвентарь,
            справа — вход в столовую (кормление питомца). Тот же визуальный стиль кнопки. */}
        <div className="relative z-20 mt-2 flex items-start justify-between px-4">
          <div className="flex flex-col gap-2">
            <button
              data-tour="home-settings"
              onClick={() => setSheet('settings')}
              className="flex h-11 w-11 items-center justify-center rounded-full border text-white backdrop-blur-md transition active:scale-95"
              style={{
                background: 'rgba(26,20,40,0.30)',
                borderColor: 'rgba(255,255,255,0.30)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              }}
              aria-label="Настройки"
            >
              <IconSettingsGear className="h-6 w-6" />
            </button>
            {/* "День" (задания дня, экран Day.tsx) и "Гардероб" временно
                отключены по просьбе пользователя — кнопки убраны, сами экраны
                и их код не удалены (sheet === 'period' → Day, sheet === 'wardrobe'
                → Wardrobe остаются в дереве ниже, просто больше никем не
                открываются). Чтобы вернуть — верните сюда две кнопки, см. git history. */}
            <button
              data-tour="home-inventory"
              onClick={() => setSheet('inventory')}
              className="flex h-11 w-11 items-center justify-center rounded-full border text-white backdrop-blur-md transition active:scale-95"
              style={{
                background: 'rgba(26,20,40,0.30)',
                borderColor: 'rgba(255,255,255,0.30)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              }}
              aria-label="Инвентарь"
            >
              <IconBackpackLight className="h-6 w-6" />
            </button>
          </div>
          <button
            data-tour="home-kitchen"
            // Кухня — отдельный экран кормления (не фон главного экрана,
            // см. inventoryStore.activeKitchenRoomId). Открывается шторкой,
            // как и остальные разделы; вкладка нижней навигации не меняется,
            // так как своей вкладки у кухни нет.
            onClick={openKitchen}
            className="flex h-11 w-11 items-center justify-center rounded-full border text-white backdrop-blur-md transition active:scale-95"
            style={{
              background: 'rgba(26,20,40,0.30)',
              borderColor: 'rgba(255,255,255,0.30)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            }}
            aria-label="Столовая"
          >
            <IconCutlery className="h-6 w-6" />
          </button>
        </div>

        {/* Медведь — занимает всё свободное место между метриками и карточкой.
            Карточка события и плашки серии верстаются НЕ как flex-соседи (иначе их
            появление/исчезновение меняет высоту этого блока и медведь "прыгает"),
            а как absolute-оверлей внутри него же — высота flex-1 и, соответственно,
            позиция медведя (проценты ниже) остаются неизменными в любом состоянии. */}
        <div className="relative z-0 min-h-0 flex-1">
          {/* Контактная тень: у PNG снизу ~6% прозрачного поля, поэтому
              тень поднята на 5.5% высоты сцены — ровно под лапы */}
          {/* Отбрасываемая тень: копия силуэта медведя, отражённая и сплющенная
              от линии лап и наклонённая влево (свет из окна справа).
              Форма повторяет лапы, поэтому медведь стоит, а не парит. */}
          <img
            src={bearSilhouette}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute left-1/2 h-[66%] w-auto select-none"
            style={{
              bottom: '40%',
              transformOrigin: 'bottom center',
              // skewX считается ДО отражения (scaleY(-0.18) идёт позже в списке,
              // но применяется к точке раньше skewX — CSS-функции работают
              // справа налево), поэтому чтобы тень легла влево, знак угла
              // нужно взять положительным, а не отрицательным.
              transform: 'translateX(-52%) scaleY(-0.18) skewX(22deg)',
              filter: 'brightness(0) blur(5px)',
              opacity: 0.5,
            }}
          />
          {/* Плотное касание прямо под лапами — задние лапы (на которых стоит медведь)
              должны приходиться примерно на центр коврика, а не на его ближний край. */}
          <div
            className="absolute bottom-[38%] left-1/2 h-[16px] w-[134px] rounded-[50%]"
            style={{
              transform: 'translateX(-52%)',
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(20,10,2,0.55) 0%, rgba(20,10,2,0.28) 50%, rgba(20,10,2,0) 76%)',
              filter: 'blur(3px)',
            }}
          />
          <div className="pointer-events-none absolute bottom-[34%] left-1/2 h-[70%] w-auto -translate-x-1/2 select-none drop-shadow-2xl">
            <BearAvatar selectedIds={outfitIds} />
          </div>

          {/* Карточка события + плашки — оверлей поверх фото, прижат к низу зоны медведя,
              не влияет на её высоту (см. комментарий выше). */}
          <div className="absolute inset-x-0 bottom-0 z-20 px-4">
          {petNeedsAttention && !tutorialActive && (
            <button
              onClick={openKitchen}
              className="mb-2 flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left shadow-lg"
              style={{ background: '#fff4df', borderColor: '#f0d6a2' }}
            >
              <span>
                <span className="block text-[13px] font-extrabold" style={{ color: '#8a5d1c' }}>
                  {health <= 35 ? 'Мишка хочет есть' : 'Мишке нужна забота'}
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold" style={{ color: '#a1740f' }}>
                  Покорми питомца или подними ему настроение.
                </span>
              </span>
              <span className="rounded-full bg-[#f0b94f] px-3 py-1.5 text-[11px] font-extrabold text-white">Позаботиться</span>
            </button>
          )}
          {/* Карточка-напоминание про урок: не постоянная, только если ребёнок
              давно не заходил на урок в течение дня (см. shouldShowLessonReminder)
              и напоминания не выключены в настройках. */}
          {showLessonReminder && remindersEnabled && (
            <div
              className="relative rounded-[26px] border px-3.5 pb-3.5 pt-[30px] shadow-xl"
              style={{ background: '#fbefe1', borderColor: '#eeddc3' }}
            >
              <span
                className="absolute -top-3 left-3.5 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #6d5ce7 0%, #5b4de0 55%, #7a4fd8 100%)' }}
              >
                <IconStar className="h-3.5 w-3.5 drop-shadow" style={{ color: '#fcd34d' }} />
                Событие дня
              </span>

              {/* Кластер 1:1 по замерам референса (доли от ширины кляксы B=92):
                  клякса 92x68 (h=0.735B); кость 0.519B x 0.481B при dx=0.251B, dy=0.107B;
                  кнопка 1.167B x 0.323B при dx=0.409B, dy=0.631B.
                  Клякса и кость — графика, вырезанная из самого референса. */}
              <div className="pointer-events-none absolute -top-[5px] right-3.5 h-[88px] w-[145px]">
                <img
                  src={boneBlob}
                  alt=""
                  className="absolute left-0 top-0 h-[68px] w-[92px] select-none"
                  draggable={false}
                />
                <img
                  src={boneToy}
                  alt=""
                  className="absolute left-[23px] top-[10px] h-[44px] w-auto select-none drop-shadow-sm"
                  draggable={false}
                />
                <button
                  onClick={openLessonsFromReminder}
                  className="pointer-events-auto absolute left-[38px] top-[58px] h-[30px] w-[107px] rounded-full text-[13px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)',
                    boxShadow:
                      'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
                  }}
                >
                  На урок
                </button>
              </div>


              <div className="pr-[148px]">
                <p
                  className="whitespace-pre-line text-[13.5px] font-bold leading-tight"
                  style={{ color: '#2c2a5e' }}
                >
                  {EVENT_COPY.title}
                </p>
                <p className="mt-1.5 text-[9.5px] leading-snug" style={{ color: '#7b7a8c' }}>
                  {EVENT_COPY.description}
                </p>
              </div>
            </div>
          )}

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            {/* Форма — скруглённый прямоугольник (не таблетка), с внутренней
                тенью и светлым бликом сверху: это даёт объём, как в референсе */}
            <button
              data-tour="home-piggy"
              onClick={() => { setPiggyPrefillAmount(null); setSheet('piggy'); }}
              className="flex min-w-0 items-center gap-2 rounded-[22px] px-2.5 py-2.5"
              style={{
                background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)',
                boxShadow:
                  'inset 0 3px 7px rgba(146,98,36,0.34), inset 0 -1px 2px rgba(255,255,255,0.30), 0 4px 10px rgba(0,0,0,0.18)',
              }}
            >
              {savingsGoal && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f5f3ff]">
                  <img src={savingsGoal.image} alt="" className="h-full w-full object-contain p-0.5 drop-shadow" />
                </span>
              )}
              <div className={`min-w-0 flex-1 ${savingsGoal ? '' : 'text-center'}`}>
                <div className="truncate text-[12px] font-bold" style={{ color: '#7d6034' }}>
                  {savingsGoal ? savingsGoal.name : 'Выбери цель и начни копить'}
                </div>
                {savingsGoal && (
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ background: '#e6d2a2', boxShadow: 'inset 0 2px 3px rgba(150,105,40,0.35)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${savingsProgressPercent}%`,
                        background: savingsProgressPercent === 100
                          ? 'linear-gradient(90deg, #51dd88 0%, #16af60 100%)'
                          : 'linear-gradient(90deg, #f1cf86 0%, #e3b355 100%)',
                      }}
                    />
                  </div>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setPiggyPrefillAmount(null); setSheet('piggy'); }}
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-[22px] px-2.5 py-2.5 transition active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)',
                boxShadow:
                  'inset 0 3px 7px rgba(146,98,36,0.34), inset 0 -1px 2px rgba(255,255,255,0.30), 0 4px 10px rgba(0,0,0,0.18)',
              }}
            >
              <img src={piggyIcon} alt="" className="h-8 w-8 shrink-0 object-contain drop-shadow" />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[10.5px] font-bold" style={{ color: '#4a3a22' }}>Накоплено</div>
                <div className="flex items-center gap-1 whitespace-nowrap text-[11px] font-bold" style={{ color: '#4a3a22' }}>
                  <img src={coinIcon} alt="" className="h-4 w-4 shrink-0" />
                  <span>{totalSaved} монет</span>
                </div>
              </div>
            </button>
          </div>
          </div>
        </div>

        {/* Навигация — прижата к низу кадра, поверх фото. Прячем на время
            родительского кабинета/зоны (см. onFullScreenChange у Settings) —
            высоту меряем один раз при монтировании, так что navHeight остаётся
            корректным для отступов шторок даже когда меню скрыто. */}
        <div
          ref={navRef}
          className={`relative z-50 pt-3 ${navHidden ? 'hidden' : ''}`}
        >
          <BottomNav
            active={tab}
            dotsEnabled={brightHintsEnabled}
            onChange={(next) => {
              // Звук тапа на нижней навигации теперь общий (globalTapSound),
              // здесь остаётся только вибро-отклик — специфика самой вкладки.
              hapticTap();
              setTab(next);
              // Вкладка "Главная" в нижнем меню — это НЕ переход в комнату
              // "главная" (комнаты переключаются только явными иконками
              // кухни/домика, см. room выше), а просто "закрыть текущий
              // раздел" — возвращаемся в ту комнату, что была активна.
              setSheet(next === 'home' ? baseSheet : next);
              // Магазин из нижнего меню — всегда полный, без кухонного ограничения
              // (в отличие от корзинки на экране кухни, см. openKitchenShop).
              if (next === 'shop') setShopKitchenOnly(false);
            }}
          />
        </div>
      </div>

      {/* Шторка разделов: выезжает снизу вверх, навигация остаётся видимой */}
      <BottomSheet open={sheet !== null} onClose={closeSheet} swipeDisabled={isOnLesson}>
        {sheet === 'lessons' ? (
          <Lessons
            bottomInset={navHeight}
            coins={coins}
            level={level}
            xp={xp}
            xpToNext={xpToNext}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onFullScreenChange={setNavHidden}
            onLessonTransition={transitionLesson}
            onClose={closeSheet}
          />
        ) : sheet === 'shop' ? (
          <Shop
            bottomInset={navHeight}
            coins={coins}
            ownedRoomIds={ownedRoomIds}
            kitchenOnly={shopKitchenOnly}
            onRoomSelect={(room) => setPreviewRoom(room)}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            confirmationEnabled={purchaseConfirmationEnabled}
            onClose={closeSheet}
          />
        ) : sheet === 'stats' ? (
          <Stats
            bottomInset={navHeight}
            coins={coins}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={closeSheet}
          />
        ) : sheet === 'day' ? (
          // Вкладка нижней навигации "day" теперь ведёт в раздел "Периоды" —
          // сам "День" (задания) переехал на отдельную иконку, см. sheet === 'period' ниже.
          <Period
            bottomInset={navHeight}
            onClose={closeSheet}
            onOpenPiggy={(amount) => { setPiggyPrefillAmount(amount); setSheet('piggy'); }}
            onOpenEvent={openAvailableEventModal}
            onOpenEarnModal={() => setEarnModalOpen(true)}
          />
        ) : sheet === 'progress' ? (
          <ProgressPage
            bottomInset={navHeight}
            coins={coins}
            level={level}
            xp={xp}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={closeSheet}
          />
        ) : sheet === 'piggy' ? (
          <PiggyBank
            bottomInset={navHeight}
            coins={coins}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={closeSheet}
            initialDepositAmount={piggyPrefillAmount}
            onSavingsPlanChange={(amount) => usePeriodStore.getState().updateSavingsPlan(amount)}
          />
        ) : sheet === 'period' ? (
          // Раздел "День" (задания дня) — раньше открывался вкладкой нижней
          // навигации, теперь только иконкой на главном экране (см. кнопку
          // рядом с настройками) и через "как заработать монеты".
          <Day
            bottomInset={navHeight}
            coins={coins}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={closeSheet}
          />
        ) : sheet === 'kitchen' ? (
          <Kitchen
            bottomInset={navHeight}
            coins={coins}
            level={level}
            xp={xp}
            xpToNext={xpToNext}
            petName={petName}
            health={health}
            happiness={happiness}
            wealth={wealth}
            activeKitchenRoomId={activeKitchenRoomId}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onOpenProgress={() => setSheet('progress')}
            onOpenShop={() => {
              setShopKitchenOnly(true);
              setTab('shop');
              setSheet('shop');
            }}
            onClose={closeKitchen}
          />
        ) : sheet === 'wardrobe' ? (
          <Wardrobe onClose={closeSheet} />
        ) : sheet === 'inventory' ? (
          <Inventory
            bottomInset={navHeight}
            coins={coins}
            ownedProductIds={ownedProductIds}
            onClose={closeSheet}
          />
        ) : sheet === 'settings' ? (
          <Settings
            bottomInset={navHeight}
            onClose={closeSheet}
            onFullScreenChange={setNavHidden}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#fbefe1] text-[15px] font-bold" style={{ color: '#7b7a8c' }}>
            Раздел в разработке
          </div>
        )}
      </BottomSheet>

      {/* Модалка сюжетного события — глобальная, поверх любого экрана внутри
          Home (см. эффект автопоказа выше), кроме активного урока. */}
      <EventModal open={eventModalOpen} onClose={closeEventModal} />

      {/* Окошко "как заработать монеты" — по кнопке "+" в балансе */}
      <EarnCoinsModal
        open={earnModalOpen}
        onClose={() => setEarnModalOpen(false)}
        onOpenLessons={() => {
          setEarnModalOpen(false);
          setTab('lessons');
          setSheet('lessons');
        }}
        // onOpenTasks не передан: "День" временно отключён, кнопка "Задания"
        // в этом окне сама не рендерится (см. EarnCoinsModal.tsx).
      />

      {previewRoom && (
        <div className="absolute inset-0 z-50">
          <RoomPreview
            rooms={roomsBySection(previewRoom.section)}
            initialRoomId={previewRoom.id}
            coins={coins}
            ownedRoomIds={ownedRoomIds}
            activeRoomId={previewRoom.section === 'kitchen' ? activeKitchenRoomId : activeRoomId}
            onBack={() => setPreviewRoom(null)}
            onBuy={(room) => {
              // Покупка/установка НЕ закрывает просмотр — комната куплена, но
              // человек может захотеть тут же её установить или просто
              // посмотреть дальше. Выйти можно только явной стрелкой "назад"
              // (см. onBack выше), и тогда откроется магазин, откуда пришли
              // (шторка sheet==='shop' всё это время остаётся открытой под просмотром).
              purchaseRoom(room);
            }}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            confirmationEnabled={purchaseConfirmationEnabled}
          />
        </div>
      )}

      {/* Экран загрузки между главной и кухней (в обе стороны) — поверх
          абсолютно всего (включая нижнюю навигацию и открытые шторки), как
          переход между экранами в App.tsx. Целевая шторка уже открывается/
          закрывается ПОД ним (см. openKitchen/closeKitchen) — когда экран
          загрузки исчезает, переход уже полностью завершён. */}
      {loadingMounted && (
        <div
          className="pointer-events-none absolute inset-0 z-[70] transition-opacity"
          style={{
            transitionProperty: 'opacity',
            transitionDuration: `${SCREEN_LOADING_FADE_MS}ms`,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: loadingShown ? 1 : 0,
            willChange: 'opacity',
          }}
        >
          <PageLoading durationMs={SCREEN_LOADING_MS} />
        </div>
      )}

      {/* Обучение при первом входе — смонтирован здесь, поверх главного экрана
          и всех шторок (уроки/день/магазин/рейтинг/кухня/гардероб/копилка),
          т.к. все они рендерятся внутри этого же корня. Ниже z-70 экрана
          загрузки перехода — на время короткого перехода тур скрыт под ним,
          а не мелькает поверх спиннера. */}
      <TutorialOverlay />
    </div>
  );
}
