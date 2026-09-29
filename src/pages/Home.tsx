import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
// обрезанный по силуэту вариант — только для отбрасываемой тени,
// иначе прозрачное поле PNG превращается после отражения в зазор
import bearSilhouette from '../assets/pet/bear-main-trim.png';
import bgRoom from '../assets/backgrounds/room-day.jpg';
import RoomPreview from './RoomPreview';
import { rooms, roomsBySection, shopProducts, type RoomProduct } from '../data/shopData';
import boneToy from '../assets/items/toys/bone-toy-card.png';
import boneBlob from '../assets/ui/bone-blob.png';
import levelFlower from '../assets/ui/level-flower.png';
import coinIcon from '../assets/icons/coin.png';
import resultCheckIcon from '../assets/icons/result-check.png';
import resultTargetIcon from '../assets/icons/result-target.png';
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
import { getCharacterById } from '../data/petCharacters';
import Kitchen from './Kitchen';
import gamepadIcon from '../assets/icons/gamepad.png';
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
import { ECONOMY_RULES, wealthPercentFromCapital, type PeriodResult } from '../core/economy';
import { usePeriodEventStore } from '../features/periodEvents/eventStore';
import { getPeriodEvents, getPeriodLessonIds } from '../features/periodEvents/eventData';
import { PERIODS } from '../data/periodsData';
import type { PetActionType } from '../core/periodRules';
import { useLessonProgressStore } from '../features/progress/lessonProgressStore';
import EventModal from '../features/periodEvents/components/EventModal';
import { feedPet, giveMedicine, purchaseRoom } from '../features/economy/purchase';
import { hapticSuccess, hapticTap } from '../services/haptics';
import {
  playGameCoinSound,
  playGameHealSound,
  playGameHitSound,
  playGameLaneSound,
  playGameOverSound,
  playGamePowerupSound,
  playGameShieldBlockSound,
  playGameStartSound,
  playRewardSound,
} from '../services/soundEffects';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';
import { pauseGameMusic, startGameMusic } from '../services/gameMusic';
import { stopVoiceover } from '../services/voiceover';
import { RoadRunnerGame, type GameEventType, type GameResult } from '../features/minigame/roadrunner';
import { storage } from '../services/storage';
import { progressLevels, MAX_LEVEL } from '../data/progressLevels';
import {
  IconStar,
  IconPlus,
  IconBackpackLight,
  IconSettingsGear,
  IconCutlery,
  IconBook,
  IconCalendar,
  IconBowl,
  IconGamepad,
} from '../components/icons';
import piggyIcon from '../assets/piggy-bank/piggy.png';
import medicineIcon from '../assets/lesson-items/medicine.png';

// После стартового обучения даём ребёнку немного освоиться и только потом
// предлагаем первый обязательный урок.
const EVENT_COPY = {
  title: 'Мишка заскучал\nбез урока!',
  description: 'Давно не был на уроке!',
};

const PERIOD_GUIDE_DELAY_MS = 60 * 1000;
const NOTICE_GAP_MS = 1500;
// Центральное окно — только редкая эскалация, если ребёнок действительно
// долго не следует следующему шагу цикла. Основной режим — нижняя карточка.
const GUIDE_ESCALATION_MS = 3 * 60 * 1000;

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
// Переходы в игру и из неё — мягче и чуть дольше: экран загрузки сначала
// полностью проявляется, и только под ним меняется экран (см. openRoadRunner).
const GAME_LOADING_FADE_MS = 700;
const GAME_LOADING_MS = 2000;
// Выход из игры — заметно быстрее входа.
const GAME_EXIT_FADE_MS = 400;
const GAME_EXIT_LOADING_MS = 1000;

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
  const savingsGoal = useEconomyStore((s) => s.savingsGoal);
  const totalSaved = useEconomyStore((s) => s.savingsBalance ?? s.totalSaved);
  const currentPeriodId = usePeriodStore((s) => s.id);
  const savingsProgressPercent = savingsGoal
    ? Math.min(100, Math.round((totalSaved / Math.max(1, savingsGoal.price)) * 100))
    : 0;
  const ownedRoomIds = useInventoryStore((s) => s.ownedRoomIds);
  const activeRoomId = useInventoryStore((s) => s.activeRoomId);
  const activeKitchenRoomId = useInventoryStore((s) => s.activeKitchenRoomId);
  const ownedProductIds = useInventoryStore((s) => s.ownedProductIds);
  const medicineQty = useInventoryStore((s) => s.medicineQty);
  const outfitIds = useInventoryStore((s) => s.outfitIds);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const brightHintsEnabled = useSettingsStore((s) => s.brightHintsEnabled);
  const demoMode = useSettingsStore((s) => s.demoMode);
  const purchaseConfirmationEnabled = useSettingsStore((s) => s.purchaseConfirmationEnabled);
  const tutorialActive = useTutorialStore((s) => s.active);

  const petName = pet?.name ?? 'Мишка';
  const character = getCharacterById(pet?.characterId);
  const health = pet?.health ?? 0;
  const happiness = pet?.happiness ?? 0;
  const petNeedsAttention = health <= 65 || happiness <= 35;
  // Ниже 20% здоровья на главном экране показываем больного мишку (тот же
  // персонаж/цвет худи, что выбрали на онбординге) вместо обычной позы —
  // на этой картинке одежда уже нарисована, поэтому оверлей гардероба поверх
  // неё не накладываем (иначе позиции вещей, откалиброванные под обычную
  // стоячую позу, разъедутся на другой позе больного мишки).
  const isSick = health < 20;
  // Богатство — текущий капитал (кошелёк + копилка) относительно учебного
  // максимума текущего периода, а не сумма небольших бонусов событий.
  const wealth = useEconomyStore((s) => wealthPercentFromCapital(
    s.coins,
    s.savingsBalance ?? s.totalSaved,
    currentPeriodId,
  ));

  const [tab, setTab] = useState<TabId>('home');
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [piggyPrefillAmount, setPiggyPrefillAmount] = useState<number | null>(null);
  const [showLessonReminder, setShowLessonReminder] = useState(shouldShowLessonReminder);
  const [lessonReminderSuppressed, setLessonReminderSuppressed] = useState(false);
  const [periodGuideEscalated, setPeriodGuideEscalated] = useState(false);
  const [petNoticeVisible, setPetNoticeVisible] = useState(false);
  const petNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eventClock, setEventClock] = useState(0);
  // Окошко "как заработать монеты" по кнопке "+" в балансе — ведёт либо на
  // уроки, либо на задания дня.
  const [earnModalOpen, setEarnModalOpen] = useState(false);
  // Экран загрузки между главной и кухней (в обе стороны) — см. SCREEN_LOADING_MS.
  // null — не показан; 'kitchen'/'home' — какой переход сейчас скрыт под ним.
  const [screenLoading, setScreenLoading] = useState<'kitchen' | 'home' | 'lesson-enter' | 'lesson-exit' | 'game-enter' | 'game-exit' | null>(null);
  const screenLoadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Отдельно от screenLoading (который определяет, ЧТО сейчас скрыто под
  // загрузкой и когда переход считается завершённым) — состояние самого
  // оверлея: мигание убрано, экран загрузки плавно появляется и исчезает,
  // а не пропадает вместе со сменой экрана резким скачком.
  const [loadingMounted, setLoadingMounted] = useState(false);
  const [loadingShown, setLoadingShown] = useState(false);
  const loadingUnmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Какой фон у экрана загрузки — запоминаем, чтобы при плавном затухании он не менялся.
  const [loadingGameBg, setLoadingGameBg] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [loadingExit, setLoadingExit] = useState(false);
  const loadingFadeMs = useRef(SCREEN_LOADING_FADE_MS);
  const roadRunnerSwapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (screenLoading !== null) {
      stopVoiceover();
      const exit = screenLoading === 'game-exit';
      const slow = screenLoading === 'game-enter' || exit;
      loadingFadeMs.current = exit ? GAME_EXIT_FADE_MS : slow ? GAME_LOADING_FADE_MS : SCREEN_LOADING_FADE_MS;
      setLoadingSlow(slow);
      setLoadingExit(exit);
      setLoadingGameBg(screenLoading === 'game-enter');
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
    loadingUnmountTimer.current = setTimeout(() => {
      setLoadingMounted(false);
      requestAnimationFrame(() => window.dispatchEvent(new Event('voiceover-ready')));
    }, loadingFadeMs.current);
    return () => {
      if (loadingUnmountTimer.current) clearTimeout(loadingUnmountTimer.current);
    };
  }, [screenLoading]);
  // Магазин, открытый корзинкой с экрана кухни, показывает только «Еду» и
  // «Интерьер» (и только кухонный подраздел интерьера) — из нижнего меню он
  // как обычно открывается полным (см. onChange у BottomNav ниже).
  const [shopKitchenOnly, setShopKitchenOnly] = useState(false);
  const [shopInitialCategory, setShopInitialCategory] = useState<'food' | 'care' | 'toys' | 'clothes' | 'interior'>('food');
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
      if (roadRunnerSwapTimer.current) clearTimeout(roadRunnerSwapTimer.current);
    };
  }, []);

  // Обучение при первом входе — только тур по главному экрану (см.
  // tutorialStore), запускается один раз, повторно уже не появляется само
  // (можно включить заново из настроек). Туры остальных разделов запускаются
  // каждый на своём экране, при первом заходе в него.
  useEffect(() => {
    useTutorialStore.getState().startTourIfNeeded('home');
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
  // Мини-игра «Гонка мишки» — открывается кнопкой-геймпадом под иконкой кухни
  const [roadRunnerOpen, setRoadRunnerOpen] = useState(false);
  // Источник запуска игры: свободный заработок или обязательное
  // взаимодействие с питомцем после последствия события.
  const [roadRunnerPurpose, setRoadRunnerPurpose] = useState<'free' | 'pet'>('free');
  const [roadRunnerCareAction, setRoadRunnerCareAction] = useState<PetActionType | undefined>(undefined);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [periodResultModal, setPeriodResultModal] = useState<{ periodId: number; result: PeriodResult } | null>(null);
  const noticeGapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [noticeGapActive, setNoticeGapActive] = useState(false);
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  // Событие, которое ребёнок явно закрыл крестиком (не решил) — не лезем с
  // ним повторно на этом же экране, но при переходе на другой экран (или
  // другую шторку) даём игре попробовать показать его снова.
  const [dismissedEventId, setDismissedEventId] = useState<string | null>(null);
  const periodStatusForEvents = usePeriodStore((s) => s.status);
  const periodPlan = usePeriodStore((s) => s.plan);
  // Подписки нужны только для перерисовки — getAvailableEvent() читает эти
  // сторы напрямую через getState() и сам по себе не реактивен.
  usePeriodEventStore((s) => s.completedEventIds.length);
  useLessonProgressStore((s) => s.completedLessonIds.length);
  const periodLessonIds = getPeriodLessonIds(Math.min(5, Math.max(1, currentPeriodId)) as 1 | 2 | 3 | 4 | 5);
  const firstLessonId = periodLessonIds[0];
  const secondLessonId = periodLessonIds[1];
  const firstLessonDone = useLessonProgressStore((s) => !firstLessonId || s.isCompleted(firstLessonId));
  const secondLessonDone = useLessonProgressStore((s) => !secondLessonId || s.isCompleted(secondLessonId));
  const availableEvent = periodStatusForEvents === 'active' ? usePeriodEventStore.getState().getAvailableEvent() : null;
  const pendingPetAction = usePeriodEventStore((s) => s.getPendingPetAction());
  function startNoticeGap(duration = demoMode ? 250 : NOTICE_GAP_MS) {
    if (noticeGapTimer.current) clearTimeout(noticeGapTimer.current);
    setNoticeGapActive(true);
    noticeGapTimer.current = setTimeout(() => {
      setNoticeGapActive(false);
      setEventClock((value) => value + 1);
    }, duration);
  }

  const periodGuideReady = (() => {
    if (tutorialActive || sheet !== null) return false;
    const finishedAt = storage.get<number>('tutorial_finished_at');
    return typeof finishedAt === 'number'
      && Date.now() - finishedAt >= (demoMode ? 3000 : PERIOD_GUIDE_DELAY_MS);
  })();
  const periodEventCount = usePeriodEventStore((s) => s.completedEventIds.length);
  const periodGuide = periodGuideReady && !pendingPetAction
    ? !firstLessonDone
      ? { title: 'Сначала заработаем монетки', text: 'Пройди первый урок — потом распределим деньги.', button: 'Открыть урок' as const, action: 'lesson' as const }
      : periodStatusForEvents === 'planning' && !periodPlan
        ? { title: 'Начнём первый период', text: 'Распредели монетки: нужное, желания и копилка.', button: 'Открыть период' as const, action: 'period' as const }
      : secondLessonId && periodStatusForEvents === 'active' && !secondLessonDone && periodEventCount >= 2
          ? { title: 'Время второго урока', text: 'Пройди урок, чтобы открыть новую часть периода.', button: 'Открыть урок' as const, action: 'lesson' as const }
          : null
    : null;
  const periodGuideActive = !!periodGuide;
  const periodGuideAction = periodGuide?.action ?? null;

  // Обычная подсказка периода сначала спокойно лежит под статистиками.
  // Только если ребёнок долго её игнорирует, она становится одним центральным
  // окном. Другие сообщения в это время не показываются.
  useEffect(() => {
    if (!periodGuideActive || periodGuideEscalated || tutorialActive || sheet !== null || eventModalOpen || periodResultModal || pendingPetAction) return;
    const timer = window.setTimeout(() => {
      setLessonReminderSuppressed(true);
      setPeriodGuideEscalated(true);
    }, demoMode ? 8000 : GUIDE_ESCALATION_MS);
    return () => window.clearTimeout(timer);
  }, [periodGuideActive, periodGuideAction, periodGuideEscalated, tutorialActive, sheet, eventModalOpen, periodResultModal, pendingPetAction, demoMode]);

  function openPeriodGuide(action: 'lesson' | 'period') {
    startNoticeGap();
    if (action === 'lesson') {
      setTab('lessons');
      setSheet('lessons');
    } else {
      setTab('day');
      setSheet('day');
    }
  }

  // После последнего события показываем итог периода и ждём осознанного выбора
  // ребёнка: успешный период можно продолжить, неудачный — повторить.
  useEffect(() => {
    const period = usePeriodStore.getState();
    if (period.status !== 'active') return;
    const events = getPeriodEvents(period.id as 1 | 2 | 3 | 4 | 5);
    const eventState = usePeriodEventStore.getState();
    const allEventsDone = events.length > 0 && events.every((event) => eventState.completedEventIds.includes(event.id));
    if (!allEventsDone || eventState.getPendingPetAction()) return;
    if (eventState.nextEventAt && Date.now() < eventState.nextEventAt) return;
    if (period.completePeriod()) {
      const completed = usePeriodStore.getState();
      if (completed.result) setPeriodResultModal({ periodId: completed.id, result: completed.result });
    }
  }, [eventClock, periodStatusForEvents, pendingPetAction]);

  useEffect(() => () => {
    if (noticeGapTimer.current) clearTimeout(noticeGapTimer.current);
  }, []);

  function continueAfterPeriod() {
    const modal = periodResultModal;
    const current = usePeriodStore.getState();
    if (!modal || current.status !== 'completed' || modal.result.score < 70) return;
    if (current.id >= 5) {
      setPeriodResultModal(null);
      return;
    }
    const economy = useEconomyStore.getState();
    current.advancePeriod(economy.coins, economy.savingsBalance ?? economy.totalSaved);
    const nextPeriod = usePeriodStore.getState().id;
    usePeriodEventStore.getState().syncPeriod(nextPeriod as 1 | 2 | 3 | 4 | 5);
    setPeriodResultModal(null);
    setEventClock((value) => value + 1);
  }

  function repeatFailedPeriod() {
    const modal = periodResultModal;
    const current = usePeriodStore.getState();
    if (!modal || current.status !== 'completed' || modal.result.score >= 70) return;
    current.repeatPeriodWithBonus();
    usePeriodEventStore.getState().resetCurrentPeriod();
    setPeriodResultModal(null);
    setEventClock((value) => value + 1);
  }

  const medicineProduct = shopProducts.find((product) => product.id === 'medicine-pet');
  const cheapestToyPrice = shopProducts
    .filter((product) => product.category === 'toys')
    .reduce((minimum, product) => Math.min(minimum, product.price), Number.POSITIVE_INFINITY);
  const canAffordToy = coins >= cheapestToyPrice;
  const hasMedicine = (medicineProduct ? medicineQty[medicineProduct.id] ?? 0 : 0) > 0;
  const hasFood = Object.values(useInventoryStore.getState().foodQty).some((quantity) => quantity > 0);
  const hasToy = shopProducts.some((product) => product.category === 'toys' && ownedProductIds.includes(product.id));
  const canAffordMedicine = !!medicineProduct && coins >= medicineProduct.price;
  const recentCareAction = pendingPetAction ? usePetStore.getState().findRecentCareInteraction(pendingPetAction) : null;
  const unrelatedRecentCare = pendingPetAction ? usePetStore.getState().findRecentOtherCareInteraction(pendingPetAction) : null;
  const requiredCareLabel = pendingPetAction === 'medicine' ? 'лекарство' : pendingPetAction === 'feed' ? 'корм' : 'игрушка';

  // Уведомление о незавершённой заботе не должно превращаться в вечный
  // блокирующий экран. Оно показывается один раз для каждого pending-действия,
  // закрывается крестиком или само исчезает через 4 секунды. Само действие
  // при этом остаётся в store и может быть выполнено позже через игру/кухню.
  useEffect(() => {
    if (petNoticeTimer.current) clearTimeout(petNoticeTimer.current);
    if (!pendingPetAction) {
      setPetNoticeVisible(false);
      return;
    }
    setPetNoticeVisible(true);
    petNoticeTimer.current = setTimeout(() => setPetNoticeVisible(false), 4000);
    return () => {
      if (petNoticeTimer.current) clearTimeout(petNoticeTimer.current);
    };
  }, [pendingPetAction]);

  useEffect(() => () => {
    if (petNoticeTimer.current) clearTimeout(petNoticeTimer.current);
  }, []);
  const petActionCopy: Record<PetActionType, { title: string; text: string; button: string }> = {
    feed: { title: 'Питомцу нужен корм', text: 'Покорми питомца, чтобы продолжить период.', button: 'Покормить' },
    buyToy: {
      title: 'Питомцу стало скучно',
      text: canAffordToy
        ? 'Купи игрушку, чтобы порадовать питомца и продолжить период.'
        : 'Монет на игрушку сейчас не хватает. Можно купить игрушку позже, а затем поиграть с Мани.',
      button: 'Купить игрушку',
    },
    medicine: { title: 'Питомцу нужна помощь', text: hasMedicine ? 'Лекарство уже куплено — теперь дай его питомцу.' : canAffordMedicine ? 'Купи и дай лекарство, чтобы продолжить период.' : 'Монет на лекарство пока не хватает. Покорми питомца — это поможет продолжить.', button: hasMedicine ? 'Дать лекарство' : canAffordMedicine ? 'Купить лекарство' : 'Покормить' },
  };

  function openRequiredPetAction(action: PetActionType) {
    startNoticeGap();
    const hasRecentAction = !!usePetStore.getState().findRecentCareInteraction(action);
    if ((action === 'feed' && (hasRecentAction || hasFood)) || (action === 'buyToy' && (hasRecentAction || hasToy)) || (action === 'medicine' && (hasRecentAction || hasMedicine))) {
      openPetGame();
      return;
    }
    if (action === 'feed') {
      openKitchen();
      return;
    }
    if (action === 'medicine' && !hasMedicine && !canAffordMedicine) {
      openKitchen();
      return;
    }
    setShopKitchenOnly(false);
    setShopInitialCategory(action === 'medicine' ? 'care' : 'toys');
    setSheet('shop');
  }

  // Вход в игру — экран загрузки с картинкой мишки на велосипеде; игра
  // монтируется сразу под ним, чтобы к моменту затухания всё уже было на месте.
  function openRoadRunner(purpose: 'free' | 'pet', careAction?: PetActionType) {
    setRoadRunnerPurpose(purpose);
    setRoadRunnerCareAction(careAction);
    setScreenLoading('game-enter');
    // Игру монтируем, только когда загрузка полностью проявилась — иначе
    // экран игры резко «выскакивает» под ещё прозрачной загрузкой.
    if (roadRunnerSwapTimer.current) clearTimeout(roadRunnerSwapTimer.current);
    roadRunnerSwapTimer.current = setTimeout(() => setRoadRunnerOpen(true), GAME_LOADING_FADE_MS);
    if (screenLoadingTimer.current) clearTimeout(screenLoadingTimer.current);
    screenLoadingTimer.current = setTimeout(() => setScreenLoading(null), GAME_LOADING_MS);
  }

  function openPetGame() {
    openRoadRunner('pet', pendingPetAction ?? undefined);
  }

  // Монеты, собранные в «Гонке мишки», сразу попадают в кошелёк (один раз за заезд — это гарантирует сама игра)
  function completeRoadRunner(result: GameResult) {
    if (result.coins > 0) {
      useEconomyStore.getState().applyCoinsDelta(result.coins, 'Монеты из мини-игры «Гонка мишки»', {
        periodId: currentPeriodId,
        category: 'reward',
      });
      playRewardSound();
      hapticSuccess();
    }

    // Запуск из карточки обязательного действия — это полноценная забота о
    // питомце. Чем лучше заезд, тем заметнее положительное последствие, но
    // даже короткий заезд даёт небольшой эффект и не оставляет ребёнка в
    // бесконечном обязательном действии.
    if (roadRunnerPurpose === 'pet') {
      const action = usePeriodEventStore.getState().getPendingPetAction();
      const petStore = usePetStore.getState();
      const inventory = useInventoryStore.getState();
      const quality = result.meters >= 180 ? 10 : result.meters >= 80 ? 7 : 4;

      // Покупка и использование разделены: если предмет уже куплен, мини-игра
      // завершает именно заботу, не списывая монеты повторно.
      if (action === 'feed' && !petStore.findRecentCareInteraction('feed')) {
        const foodId = Object.entries(inventory.foodQty).find(([, quantity]) => quantity > 0)?.[0];
        const food = shopProducts.find((product) => product.id === foodId && product.category === 'food');
        if (food) feedPet(food);
        else petStore.recordCareInteraction('feed', 'event');
      } else if (action === 'medicine' && !petStore.findRecentCareInteraction('medicine')) {
        if (medicineProduct && (inventory.medicineQty[medicineProduct.id] ?? 0) > 0) giveMedicine(medicineProduct);
        else petStore.recordCareInteraction('medicine', 'event');
      } else if (action === 'buyToy' && !petStore.findRecentCareInteraction('buyToy')) {
        petStore.recordCareInteraction('buyToy', 'event');
      }

      if (action) usePeriodEventStore.getState().completePendingCare(action);
      const careEffect = action === 'feed'
        ? { health: Math.round(quality * 0.7), happiness: Math.round(quality * 0.3) }
        : action === 'medicine'
          ? { health: quality }
          : { happiness: quality };
      petStore.applyDelta(careEffect);
      usePetStore.getState().registerInteraction();
      usePetStore.getState().addXp(ECONOMY_RULES.miniGameRewardXp);
      startNoticeGap();
      setEventClock((value) => value + 1);
    }
  }

  // Выход из игры — стандартный экран загрузки; игра убирается под ним.
  function closeRoadRunner() {
    setScreenLoading('game-exit');
    if (roadRunnerSwapTimer.current) clearTimeout(roadRunnerSwapTimer.current);
    roadRunnerSwapTimer.current = setTimeout(() => {
      setRoadRunnerOpen(false);
      setRoadRunnerPurpose('free');
      setRoadRunnerCareAction(undefined);
    }, GAME_EXIT_FADE_MS);
    if (screenLoadingTimer.current) clearTimeout(screenLoadingTimer.current);
    screenLoadingTimer.current = setTimeout(() => setScreenLoading(null), GAME_EXIT_LOADING_MS);
  }

  // Музыка игры: пока игра открыта — общая музыка приложения на паузе, играет
  // тихий трек игры (плавно нарастает); при выходе — наоборот.
  useEffect(() => {
    if (!roadRunnerOpen) return undefined;
    pauseBackgroundMusic();
    startGameMusic();
    return () => {
      pauseGameMusic();
      // не включаем общую музыку, если её выключили в настройках
      if (useSettingsStore.getState().musicEnabled) startBackgroundMusic();
    };
  }, [roadRunnerOpen]);

  function onRoadRunnerEvent(event: GameEventType) {
    switch (event) {
      case 'start':
        playGameStartSound();
        break;
      case 'lane':
        playGameLaneSound();
        break;
      case 'coin':
        playGameCoinSound();
        break;
      case 'hit':
        playGameHitSound();
        hapticTap();
        break;
      case 'shield-block':
        playGameShieldBlockSound();
        hapticSuccess();
        break;
      case 'powerup':
        playGamePowerupSound();
        hapticSuccess();
        break;
      case 'heal':
        playGameHealSound();
        hapticSuccess();
        break;
      case 'gameover':
        playGameOverSound();
        break;
    }
  }

  function petActionIcon(action: PetActionType) {
    if (action === 'feed') return <IconBowl className="h-5 w-5" />;
    if (action === 'medicine') return <img src={medicineIcon} alt="" className="h-7 w-7 object-contain" />;
    return <IconGamepad className="h-5 w-5" />;
  }

  const previousPendingPetAction = useRef<PetActionType | null>(pendingPetAction);
  useEffect(() => {
    if (previousPendingPetAction.current && !pendingPetAction) startNoticeGap();
    previousPendingPetAction.current = pendingPetAction;
  }, [pendingPetAction]);

  useEffect(() => {
    // Сюжетное событие — самое последнее в очереди. Оно никогда не перебивает
    // урок, переход между экранами, обучение, результат периода, обязательное
    // действие питомца или понятную подсказку следующего шага.
    if (
      !availableEvent
      || isOnLesson
      || tutorialActive
      || sheet !== null
      || screenLoading !== null
      || noticeGapActive
      || !!pendingPetAction
      || roadRunnerOpen
      || !!periodGuide
      || !!periodResultModal
      || earnModalOpen
    ) return;
    if (availableEvent.id === dismissedEventId) return;
    setOpenEventId(availableEvent.id);
    setEventModalOpen(true);
  }, [availableEvent?.id, isOnLesson, roadRunnerOpen, tutorialActive, sheet, screenLoading, noticeGapActive, pendingPetAction, periodGuide, periodResultModal, earnModalOpen, dismissedEventId]);

  // Переход на другой экран/шторку — новый шанс показать отложенное событие.
  useEffect(() => {
    setDismissedEventId(null);
  }, [tab, sheet]);

  function closeEventModal() {
    setEventModalOpen(false);
    startNoticeGap();
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
    startNoticeGap();
    setLessonReminderSuppressed(true);
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
          {/* Аватарка + полоса опыта: уровень — это возраст мишки. Блок только
              показывает его, на экран "Прогресс" отсюда больше не переходим. */}
          <div
            data-tour="home-level"
            className="flex items-center rounded-2xl py-0.5 pr-1"
            aria-label="Возраст мишки"
          >
            <div className="relative shrink-0">
              <img
                src={character.avatarImage}
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

          </div>

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

        {pendingPetAction && petNoticeVisible && !noticeGapActive && !periodResultModal && !roadRunnerOpen && sheet === null && !isOnLesson && !tutorialActive && (
          <div
            className="pointer-events-auto absolute inset-0 z-[62] flex items-center justify-center bg-[rgba(20,14,26,0.5)] p-7 backdrop-blur-[2px]"
            onClick={() => setPetNoticeVisible(false)}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[300px] rounded-[28px] p-5 pt-6 shadow-2xl"
              style={{
                background: '#fbefe1',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 24px 48px rgba(20,10,30,0.35), 0 4px 14px rgba(20,10,30,0.18)',
              }}
            >
              <button
                type="button"
                aria-label="Закрыть уведомление"
                onClick={() => setPetNoticeVisible(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#8b899e] transition active:scale-90"
                style={{ background: 'rgba(120,110,150,0.10)' }}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
              <div className="flex justify-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)',
                    boxShadow: '0 8px 18px rgba(150,105,40,0.32), inset 0 2px 3px rgba(255,255,255,0.6)',
                  }}
                >
                  <span style={{ color: '#d99526' }}>{petActionIcon(pendingPetAction)}</span>
                </div>
              </div>

              <h2 className="mt-3.5 text-center text-[18px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                {petActionCopy[pendingPetAction].title}
              </h2>
                <p className="mt-1.5 px-1 text-center text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
                {recentCareAction
                  ? 'Ты уже позаботился о Мани. Давай закрепим результат небольшой игрой!'
                  : unrelatedRecentCare
                    ? `Мани стало веселее, но ему всё ещё нужно ${requiredCareLabel}.`
                    : petActionCopy[pendingPetAction].text}
              </p>

              {pendingPetAction === 'buyToy' && !canAffordToy ? (
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => openRequiredPetAction('buyToy')}
                    className="rounded-full bg-gradient-to-b from-[#8b88f4] to-[#6262e4] px-2 py-3 text-[12px] font-extrabold text-white shadow-lg transition active:scale-[0.98]"
                  >
                    Купить игрушку
                  </button>
                  <button
                    onClick={openPetGame}
                    className="rounded-full bg-gradient-to-b from-[#62d67d] to-[#2fa64f] px-2 py-3 text-[12px] font-extrabold text-white shadow-lg transition active:scale-[0.98]"
                  >
                    Поиграть
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openRequiredPetAction(pendingPetAction)}
                  className="mt-4 w-full rounded-full py-3 text-[14px] font-extrabold text-white shadow-lg transition active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)',
                    boxShadow:
                      'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
                  }}
                >
                  {petActionCopy[pendingPetAction].button}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Тот же вид, что и окошко "Как заработать монеты?" (EarnCoinsModal) —
            круглая иконка сверху, заголовок и подпись по центру, одна кнопка
            и крестик-закрытие в углу, вместо прежней "плашки со значком в ряд". */}
        {periodGuide && !noticeGapActive && periodGuideEscalated && !periodResultModal && !pendingPetAction && !eventModalOpen && (
          <div
            className="pointer-events-auto absolute inset-0 z-[62] flex items-center justify-center bg-[rgba(20,14,26,0.5)] p-7 backdrop-blur-[2px]"
            onClick={() => setPeriodGuideEscalated(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[300px] rounded-[28px] p-5 pt-6 shadow-2xl"
              style={{
                background: '#fbefe1',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 24px 48px rgba(20,10,30,0.35), 0 4px 14px rgba(20,10,30,0.18)',
              }}
            >
              <button
                onClick={() => setPeriodGuideEscalated(false)}
                aria-label="Закрыть"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-[#a19cb0] transition active:scale-90"
                style={{ background: 'rgba(120,110,150,0.10)' }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>

              <div className="flex justify-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, #a9a6f8 0%, #7574f0 100%)',
                    boxShadow: '0 8px 18px rgba(92,90,216,0.38), inset 0 2px 3px rgba(255,255,255,0.6)',
                  }}
                >
                  {periodGuide.action === 'lesson' ? (
                    <IconBook className="h-8 w-8 text-white" />
                  ) : (
                    <IconCalendar className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>

              <h2 className="mt-3.5 text-center text-[18px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                {periodGuide.title}
              </h2>
              <p className="mt-1.5 px-1 text-center text-[12.5px] leading-snug" style={{ color: '#7b7a8c' }}>
                {periodGuide.text}
              </p>

              <button
                onClick={() => { setPeriodGuideEscalated(false); openPeriodGuide(periodGuide.action); }}
                className="mt-4 w-full rounded-full py-3 text-[14px] font-extrabold text-white shadow-lg transition active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)',
                  boxShadow:
                    'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
                }}
              >
                {periodGuide.button}
              </button>
            </div>
          </div>
        )}

        {periodResultModal && (
          <div className="pointer-events-auto absolute inset-0 z-[63] flex items-center justify-center bg-[rgba(31,25,45,0.28)] p-5 backdrop-blur-[6px]">
            <div className="relative w-full max-w-[560px] rounded-[28px] border border-[#e8d6bb] bg-[#fbefe1] px-4 pb-4 pt-7 text-center shadow-2xl">
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-extrabold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6d5ce7 0%, #5b4de0 55%, #7a4fd8 100%)' }}>
                <IconStar className="h-4 w-4" style={{ color: '#fcd34d' }} />
                Итог периода {periodResultModal.periodId}
              </span>
              <img
                src={periodResultModal.result.score >= 70 ? resultCheckIcon : resultTargetIcon}
                alt=""
                className="mx-auto mb-2 h-16 w-16 object-contain"
              />
              <div className="text-[18px] font-black" style={{ color: '#2c2a5e' }}>
                {periodResultModal.result.score >= 70 ? 'Отлично, период завершён!' : 'Попробуем период ещё раз'}
              </div>
              <p className="mt-1.5 text-[11px] font-semibold leading-snug" style={{ color: '#7b7a8c' }}>
                {periodResultModal.result.score >= 70
                  ? 'Твои решения повлияли на питомца и на наши деньги.'
                  : 'Некоторые важные потребности не закрыты. В следующий раз у тебя будет небольшой бонус.'}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-[16px] bg-[#ffe9ef] px-2 py-2">
                  <div className="text-[10px] font-bold text-[#a85b72]">Здоровье</div>
                  <div className="text-[16px] font-black text-[#ef4060]">{health}%</div>
                  <div className="text-[9px] font-bold text-[#a85b72]">{periodResultModal.result.satietyDelta >= 0 ? '+' : ''}{periodResultModal.result.satietyDelta}</div>
                </div>
                <div className="rounded-[16px] bg-[#fff3d9] px-2 py-2">
                  <div className="text-[10px] font-bold text-[#a1740f]">Счастье</div>
                  <div className="text-[16px] font-black text-[#eaa622]">{happiness}%</div>
                  <div className="text-[9px] font-bold text-[#a1740f]">+{periodResultModal.result.moodDelta}</div>
                </div>
                <div className="rounded-[16px] bg-[#e6f9ee] px-2 py-2">
                  <div className="text-[10px] font-bold text-[#24754b]">Богатство</div>
                  <div className="text-[16px] font-black text-[#21a44f]">{wealth}%</div>
                  <div className="text-[9px] font-bold text-[#24754b]">План: {periodResultModal.result.planMatchPercent}%</div>
                </div>
              </div>
              <div className="mt-3 rounded-[14px] bg-white/60 px-3 py-2 text-[11px] font-extrabold" style={{ color: '#5d57a8' }}>
                Результат: {periodResultModal.result.score} из 100
              </div>
              {periodResultModal.result.score >= 70 && (
                <div className="mt-2 flex items-center justify-center gap-1.5 rounded-[14px] bg-[#e6f9ee] px-3 py-2 text-[12px] font-black text-[#24754b]">
                  <img src={coinIcon} alt="" className="h-5 w-5" />
                  +{PERIODS.find((period) => period.id === periodResultModal.periodId)?.rewardCoins ?? 0} монет за успешное завершение
                </div>
              )}
              {periodResultModal.result.score >= 70 ? (
                <button
                  onClick={continueAfterPeriod}
                  className="mt-3 w-full rounded-full py-3 text-[13px] font-extrabold text-white shadow-md transition active:scale-[0.98]"
                  style={{ background: 'linear-gradient(180deg, #8b88f4 0%, #6262e4 100%)' }}
                >
                  {periodResultModal.periodId >= 5 ? 'Завершить' : 'Перейти дальше'}
                </button>
              ) : (
                <button
                  onClick={repeatFailedPeriod}
                  className="mt-3 w-full rounded-full py-3 text-[13px] font-extrabold text-white shadow-md transition active:scale-[0.98]"
                  style={{ background: 'linear-gradient(180deg, #f08b65 0%, #d85d6e 100%)' }}
                >
                  Повторить период
                </button>
              )}
            </div>
          </div>
        )}

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
          <div className="flex flex-col gap-2">
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
            {/* Мини-игра «Гонка мишки» — под иконкой кухни, тот же стиль кнопки */}
            <button
              data-tour="home-minigame"
              onClick={() => openRoadRunner('free')}
              className="flex h-11 w-11 items-center justify-center rounded-full border text-white backdrop-blur-md transition active:scale-95"
              style={{
                background: 'rgba(26,20,40,0.30)',
                borderColor: 'rgba(255,255,255,0.30)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              }}
              aria-label="Мини-игра"
            >
              <img src={gamepadIcon} alt="" className="h-6 w-6 object-contain" draggable={false} />
            </button>
          </div>
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
            <BearAvatar selectedIds={isSick ? [] : outfitIds} bearImage={isSick ? character.sickMainImage : character.mainImage} />
          </div>

          {/* Карточка события + плашки — оверлей поверх фото, прижат к низу зоны медведя,
              не влияет на её высоту (см. комментарий выше). */}
          <div className="absolute inset-x-0 bottom-0 z-20 px-4">
          {periodGuide
            && !noticeGapActive
            && !periodGuideEscalated
            && !periodResultModal
            && !pendingPetAction
            && !eventModalOpen && (
            <button
              onClick={() => openPeriodGuide(periodGuide.action)}
              className="mb-2 flex w-full flex-col gap-3 rounded-[26px] border px-4 py-3.5 text-left shadow-xl"
              style={{ background: '#fbefe1', borderColor: '#eeddc3' }}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eeeaff] text-[#5d57e0]">
                  {periodGuide.action === 'lesson' ? <IconBook className="h-6 w-6" /> : <IconCalendar className="h-6 w-6" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-extrabold leading-tight text-[#2c2a5e]">{periodGuide.title}</span>
                  <span className="mt-1 block text-[12px] font-semibold leading-snug text-[#7b7a8c] line-clamp-2">{periodGuide.text}</span>
                </span>
              </span>
              <span className="block w-full rounded-full py-2.5 text-center text-[13px] font-extrabold text-white shadow-md" style={{ background: 'linear-gradient(180deg, #8b88f4 0%, #6262e4 100%)' }}>{periodGuide.button}</span>
            </button>
          )}
          {petNeedsAttention
            && !tutorialActive
            && !periodResultModal
            && !pendingPetAction
            && !periodGuide
            && !eventModalOpen
            && sheet === null && (
            <button
              onClick={openKitchen}
              className="mb-2 flex w-full items-center justify-between rounded-[22px] border px-4 py-3.5 text-left shadow-[0_6px_20px_rgba(31,37,105,0.14)]"
              style={{ background: 'rgba(255,255,255,0.94)', borderColor: 'rgba(255,255,255,0.8)' }}
            >
              <span className="min-w-0 pr-3">
                <span className="block text-[16px] font-extrabold leading-tight" style={{ color: '#2c2a5e' }}>
                  {health <= 35 ? 'Мишка хочет есть' : 'Мишке нужна забота'}
                </span>
                <span className="mt-1 block text-[12.5px] font-semibold leading-snug" style={{ color: '#7b7a8c' }}>
                  Покорми питомца или подними ему настроение.
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-gradient-to-b from-[#8b88f4] to-[#6262e4] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-[0_4px_10px_rgba(92,90,216,0.26)]">Позаботиться</span>
            </button>
          )}
          {/* Карточка-напоминание про урок: не постоянная, только если ребёнок
              давно не заходил на урок в течение дня (см. shouldShowLessonReminder)
              и напоминания не выключены в настройках. */}
          {showLessonReminder
            && !lessonReminderSuppressed
            && remindersEnabled
            && !petNeedsAttention
            && !tutorialActive
            && !periodResultModal
            && !pendingPetAction
            && !periodGuide
            && !eventModalOpen
            && sheet === null && (
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
            initialCategory={shopInitialCategory}
            onRoomSelect={(room) => setPreviewRoom(room)}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            confirmationEnabled={purchaseConfirmationEnabled}
            onProductPurchased={(product) => {
              if (!pendingPetAction) return;
              const matches = pendingPetAction === 'feed' && product.category === 'food'
                || pendingPetAction === 'medicine' && product.category === 'care'
                || pendingPetAction === 'buyToy' && product.category === 'toys';
              if (!matches) return;
              closeSheet();
              window.setTimeout(() => openPetGame(), 360);
            }}
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
            tutorialActive={tutorialActive}
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
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#fbefe1] px-6 text-center">
            <p className="text-[15px] font-bold" style={{ color: '#7b7a8c' }}>Раздел пока недоступен</p>
            <button onClick={closeSheet} className="rounded-full px-5 py-2.5 text-[13px] font-extrabold text-white" style={{ background: 'linear-gradient(180deg, #8b88f4 0%, #6262e4 100%)' }}>Вернуться</button>
          </div>
        )}
      </BottomSheet>

      {/* Модалка сюжетного события — глобальная, поверх любого экрана внутри
          Home (см. эффект автопоказа выше), кроме активного урока. */}
      <EventModal open={eventModalOpen} onClose={closeEventModal} />

      {roadRunnerOpen && (
        <div className="absolute inset-0 z-[80]">
          <RoadRunnerGame
            onExit={closeRoadRunner}
            onFinish={completeRoadRunner}
            onEvent={onRoadRunnerEvent}
            activity={roadRunnerPurpose === 'pet' ? roadRunnerCareAction : undefined}
          />
        </div>
      )}

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
            onBuy={(room, savingsContribution = 0) => {
              // Покупка/установка НЕ закрывает просмотр — комната куплена, но
              // человек может захотеть тут же её установить или просто
              // посмотреть дальше. Выйти можно только явной стрелкой "назад"
              // (см. onBack выше), и тогда откроется магазин, откуда пришли
              // (шторка sheet==='shop' всё это время остаётся открытой под просмотром).
              purchaseRoom(room, { savingsContribution });
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
          data-voiceover-blocking="true"
          className="pointer-events-none absolute inset-0 z-[90] transition-opacity"
          style={{
            transitionProperty: 'opacity',
            transitionDuration: `${loadingExit ? GAME_EXIT_FADE_MS : loadingSlow ? GAME_LOADING_FADE_MS : SCREEN_LOADING_FADE_MS}ms`,
            transitionTimingFunction: loadingSlow ? 'ease-in-out' : 'cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: loadingShown ? 1 : 0,
            willChange: 'opacity',
          }}
        >
          <PageLoading durationMs={loadingExit ? GAME_EXIT_LOADING_MS : loadingSlow ? GAME_LOADING_MS : SCREEN_LOADING_MS} variant={loadingGameBg ? 'game' : 'default'} />
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
