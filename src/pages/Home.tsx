import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import bearFull from '../assets/pet/bear-main.png';
// обрезанный по силуэту вариант — только для отбрасываемой тени,
// иначе прозрачное поле PNG превращается после отражения в зазор
import bearSilhouette from '../assets/pet/bear-main-trim.png';
import bearAvatar from '../assets/pet/bear-avatar.png';
import bgRoom from '../assets/backgrounds/room-day.jpg';
import RoomPreview from './RoomPreview';
import { rooms, type RoomProduct } from '../data/shopData';
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
import LessonsPlaceholder from './LessonsPlaceholder';
import Inventory from './Inventory';
import Shop from './Shop';
import Stats from './Stats';
import Settings from './Settings';
import Day, { type DayTab } from './Day';
import ProgressPage from './Progress';
import { usePetStore } from '../features/pet/petStore';
import { useEconomyStore } from '../features/economy/economyStore';
import { useInventoryStore } from '../features/inventory/inventoryStore';
import { useDayProgressStore } from '../features/progress/dayProgressStore';
import { useSettingsStore } from '../features/settings/settingsStore';
import { purchaseRoom } from '../features/economy/purchase';
import { hapticTap } from '../services/haptics';
import { progressLevels } from '../data/progressLevels';
import {
  IconStar,
  IconPlus,
  IconGift,
  IconFlame,
  IconBackpackLight,
  IconSettingsGear,
  IconChevronRight,
} from '../components/icons';

// Уровень/опыт — отдельная прогресс-система уроков, которая ещё не подключена
// (уроки пока заглушка), поэтому пока фиксированные значения для оформления шапки.
// Порог XP берётся из общих данных уровней (src/data/progressLevels.ts) — тот же
// источник, что показывает экран "Прогресс", чтобы шапка и экран не расходились.
const LEVEL = 1;
const XP = 0;
const XP_TO_NEXT = progressLevels[LEVEL - 1].xpThreshold;

// Карточка "Событие дня" — не постоянный баннер, а напоминание: показываем её,
// только если ребёнок давно (несколько часов) не заходил на урок в течение дня.
const EVENT_COPY = {
  title: 'Мишка заскучал\nбез урока!',
  description: 'Давно не был на уроке!',
};

// Русское склонение "день/дня/дней" для карточки серии.
function pluralDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня';
  return 'дней';
}

const LAST_LESSON_VISIT_KEY = 'funnymoney_last_lesson_visit_at';
const LESSON_REMINDER_THRESHOLD_MS = 3 * 60 * 60 * 1000;

function shouldShowLessonReminder() {
  try {
    const raw = localStorage.getItem(LAST_LESSON_VISIT_KEY);
    if (!raw) return true; // ещё ни разу не заходил — точно пора напомнить
    const lastVisit = Number(raw);
    if (!Number.isFinite(lastVisit)) return true;
    return Date.now() - lastVisit > LESSON_REMINDER_THRESHOLD_MS;
  } catch {
    return true;
  }
}

function markLessonVisited() {
  try {
    localStorage.setItem(LAST_LESSON_VISIT_KEY, String(Date.now()));
  } catch {
    // localStorage недоступен — просто не запоминаем, напоминание останется активным
  }
}

type SheetId = TabId | 'inventory' | 'settings' | 'progress';

export default function Home() {
  const pet = usePetStore((s) => s.pet);
  const coins = useEconomyStore((s) => s.coins);
  const wealthScore = useEconomyStore((s) => s.wealthScore);
  const ownedRoomIds = useInventoryStore((s) => s.ownedRoomIds);
  const activeRoomId = useInventoryStore((s) => s.activeRoomId);
  const ownedProductIds = useInventoryStore((s) => s.ownedProductIds);
  const streakDays = useDayProgressStore((s) => s.streak);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const brightHintsEnabled = useSettingsStore((s) => s.brightHintsEnabled);

  const petName = pet?.name ?? 'Мишка';
  const health = pet?.health ?? 0;
  const happiness = pet?.happiness ?? 0;
  // Богатство — метрика-проценты 0..100, производная от wealthScore экономики.
  const wealth = Math.max(0, Math.min(100, wealthScore));

  const [tab, setTab] = useState<TabId>('home');
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [showLessonReminder, setShowLessonReminder] = useState(shouldShowLessonReminder);
  // Окошко "как заработать монеты" по кнопке "+" в балансе — ведёт либо на
  // уроки, либо в раздел наград на экране "День".
  const [earnModalOpen, setEarnModalOpen] = useState(false);
  const [dayInitialTab, setDayInitialTab] = useState<DayTab>('tasks');

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

  // высота навигации меряется по факту — шторка останавливается ровно над ней
  useLayoutEffect(() => {
    if (navRef.current) setNavHeight(navRef.current.offsetHeight);
  }, []);
  const xpPercent = Math.min(100, Math.round((XP / XP_TO_NEXT) * 100));

  return (
    // Фото комнаты — фон ВСЕГО экрана. Контент раскладывается колонкой
    // на всю высоту кадра: шапка сверху, навигация прижата к низу,
    // медведь занимает всё свободное место между ними.
    <div className="relative h-full w-full overflow-hidden bg-[#b9835a]">
      <img
        src={rooms.find((r) => r.id === activeRoomId)?.background ?? bgRoom}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-bottom"
      />

      <div className="relative flex h-full flex-col">
        {/* Шапка: питомец + монеты */}
        <div className="relative z-20 flex items-start justify-between gap-3 px-4 pt-5">
          {/* Блок питомца — без плашки, прямо поверх фото (как в референсе).
              Пропорции от диаметра аватара D=52: цветок 0.56D, его центр на 1.217D,
              полоса XP начинается на 1.587D, её высота 0.187D. */}
          {/* Аватарка + полоса опыта — кликабельны и ведут на экран "Прогресс"
              (5 уровней развития). Маленькая стрелочка справа — подсказка
              ребёнку, что сюда можно нажать (сам блок иначе выглядел бы как
              обычная неинтерактивная шапка). */}
          <button
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
                  {LEVEL}
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
                {XP} / {XP_TO_NEXT} XP
              </div>
            </div>

            <IconChevronRight
              className="ml-1 h-4 w-4 shrink-0 self-center text-white drop-shadow"
              style={{ opacity: 0.85 }}
            />
          </button>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
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
        <div className="relative z-20 mt-3 flex items-center gap-2.5 px-4">
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

        {/* Кнопки инвентаря и настроек — отдельной строкой под статистиками:
            настройки слева, инвентарь справа (тот же визуальный стиль кнопки). */}
        <div className="relative z-20 mt-2 flex justify-between px-4">
          <button
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
          <button
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
            className="pointer-events-none absolute left-1/2 h-[58%] w-auto select-none"
            style={{
              bottom: '35.6%',
              transformOrigin: 'bottom center',
              transform: 'translateX(-52%) scaleY(-0.18) skewX(-22deg)',
              filter: 'brightness(0) blur(5px)',
              opacity: 0.5,
            }}
          />
          {/* Плотное касание прямо под лапами — задние лапы (на которых стоит медведь)
              должны приходиться примерно на центр коврика, а не на его ближний край. */}
          <div
            className="absolute bottom-[33.4%] left-1/2 h-[14px] w-[118px] rounded-[50%]"
            style={{
              transform: 'translateX(-52%)',
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(20,10,2,0.55) 0%, rgba(20,10,2,0.28) 50%, rgba(20,10,2,0) 76%)',
              filter: 'blur(3px)',
            }}
          />
          <img
            src={bearFull}
            alt={petName}
            draggable={false}
            className="pointer-events-none absolute bottom-[29%] left-1/2 h-[62%] w-auto -translate-x-1/2 select-none object-contain drop-shadow-2xl"
          />

          {/* Карточка события + плашки — оверлей поверх фото, прижат к низу зоны медведя,
              не влияет на её высоту (см. комментарий выше). */}
          <div className="absolute inset-x-0 bottom-0 z-20 px-4">
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

          <div className="mt-2.5 flex gap-2.5">
            {/* Форма — скруглённый прямоугольник (не таблетка), с внутренней
                тенью и светлым бликом сверху: это даёт объём, как в референсе */}
            <div
              className="flex flex-[1.3] items-center gap-2.5 rounded-[22px] px-3 py-2.5"
              style={{
                background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)',
                boxShadow:
                  'inset 0 3px 7px rgba(146,98,36,0.34), inset 0 -1px 2px rgba(255,255,255,0.30), 0 4px 10px rgba(0,0,0,0.18)',
              }}
            >
              <IconGift className="h-10 w-10 shrink-0 drop-shadow" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold" style={{ color: '#7d6034' }}>
                  Уроки скоро откроются
                </div>
                <div
                  className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full"
                  style={{
                    background: '#e6d2a2',
                    boxShadow: 'inset 0 2px 3px rgba(150,105,40,0.35)',
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '0%',
                      background: 'linear-gradient(90deg, #f1cf86 0%, #e3b355 100%)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              onClick={
                streakDays === 0
                  ? () => {
                      setDayInitialTab('tasks');
                      setTab('day');
                      setSheet('day');
                    }
                  : undefined
              }
              className={`flex flex-1 items-center gap-2 rounded-[22px] px-3 py-2.5 ${
                streakDays === 0 ? 'cursor-pointer transition active:scale-[0.98]' : ''
              }`}
              style={{
                background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)',
                boxShadow:
                  'inset 0 3px 7px rgba(146,98,36,0.34), inset 0 -1px 2px rgba(255,255,255,0.30), 0 4px 10px rgba(0,0,0,0.18)',
              }}
            >
              <IconFlame
                className="h-9 w-9 shrink-0 drop-shadow"
                style={streakDays === 0 ? { opacity: 0.45 } : undefined}
              />
              {streakDays === 0 ? (
                <div className="min-w-0 leading-tight">
                  <div className="text-[11.5px] font-bold" style={{ color: '#4a3a22' }}>
                    Начни серию!
                  </div>
                  <div className="text-[9.5px] font-semibold leading-snug" style={{ color: '#8a6a3a' }}>
                    Выполни задание дня
                  </div>
                </div>
              ) : (
                <div className="leading-tight">
                  <div className="whitespace-nowrap text-[13px] font-bold" style={{ color: '#4a3a22' }}>
                    {streakDays} {pluralDays(streakDays)}
                  </div>
                  <div className="text-[12px] font-bold" style={{ color: '#4a3a22' }}>
                    серия
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Навигация — прижата к низу кадра, поверх фото */}
        <div
          ref={navRef}
          className="relative z-50 pt-3"
        >
          <BottomNav
            active={tab}
            dotsEnabled={brightHintsEnabled}
            onChange={(next) => {
              // Звук тапа на нижней навигации теперь общий (globalTapSound),
              // здесь остаётся только вибро-отклик — специфика самой вкладки.
              hapticTap();
              setTab(next);
              setSheet(next === 'home' ? null : next);
              if (next === 'day') setDayInitialTab('tasks');
            }}
          />
        </div>
      </div>

      {/* Шторка разделов: выезжает снизу вверх, навигация остаётся видимой */}
      <BottomSheet
        open={sheet !== null}
        onClose={() => {
          setSheet(null);
          setTab('home');
        }}
      >
        {sheet === 'lessons' ? (
          <LessonsPlaceholder
            bottomInset={navHeight}
            coins={coins}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : sheet === 'shop' ? (
          <Shop
            bottomInset={navHeight}
            coins={coins}
            ownedRoomIds={ownedRoomIds}
            onRoomSelect={(room) => setPreviewRoom(room)}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : sheet === 'stats' ? (
          <Stats
            bottomInset={navHeight}
            coins={coins}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : sheet === 'day' ? (
          <Day
            bottomInset={navHeight}
            coins={coins}
            initialTab={dayInitialTab}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : sheet === 'progress' ? (
          <ProgressPage
            bottomInset={navHeight}
            coins={coins}
            level={LEVEL}
            xp={XP}
            onOpenEarnModal={() => setEarnModalOpen(true)}
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : sheet === 'inventory' ? (
          <Inventory
            bottomInset={navHeight}
            coins={coins}
            ownedProductIds={ownedProductIds}
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : sheet === 'settings' ? (
          <Settings
            bottomInset={navHeight}
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#fbefe1] text-[15px] font-bold" style={{ color: '#7b7a8c' }}>
            Раздел в разработке
          </div>
        )}
      </BottomSheet>

      {/* Окошко "как заработать монеты" — по кнопке "+" в балансе */}
      <EarnCoinsModal
        open={earnModalOpen}
        onClose={() => setEarnModalOpen(false)}
        onOpenLessons={() => {
          setEarnModalOpen(false);
          setTab('lessons');
          setSheet('lessons');
        }}
        onOpenRewards={() => {
          setEarnModalOpen(false);
          setDayInitialTab('rewards');
          setTab('day');
          setSheet('day');
        }}
      />

      {previewRoom && (
        <div className="absolute inset-0 z-50">
          <RoomPreview
            rooms={rooms}
            initialRoomId={previewRoom.id}
            coins={coins}
            ownedRoomIds={ownedRoomIds}
            activeRoomId={activeRoomId}
            onBack={() => setPreviewRoom(null)}
            onBuy={(room) => {
              // Покупка/установка НЕ закрывает просмотр — комната куплена, но
              // человек может захотеть тут же её установить или просто
              // посмотреть дальше. Выйти можно только явной стрелкой "назад"
              // (см. onBack выше), и тогда откроется магазин, откуда пришли
              // (шторка sheet==='shop' всё это время остаётся открытой под просмотром).
              purchaseRoom(room);
            }}
          />
        </div>
      )}
    </div>
  );
}
