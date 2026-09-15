import { useLayoutEffect, useRef, useState } from 'react';
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
import GlassMetric from '../components/GlassMetric';
import BottomNav, { type TabId } from '../components/BottomNav';
import BottomSheet from '../components/BottomSheet';
import Lessons from './Lessons';
import Shop from './Shop';
import Stats from './Stats';
import {
  IconHeart,
  IconSmile,
  IconCoinStack,
  IconStar,
  IconPlus,
  IconGift,
  IconFlame,
} from '../components/icons';

// Мок-данные — цель F2 довести вёрстку 1:1 под референс, реальный
// стор (usePetStore/useEconomyStore) подключаем следующим проходом.
const mock = {
  petName: 'Мишка',
  level: 3,
  xp: 240,
  xpToNext: 500,
  coins: 709,
  health: 82,
  happiness: 76,
  wealth: 64,
  event: {
    title: 'Мишка хочет поиграть\nс новой игрушкой!',
    description: 'У тебя есть 300 монет. Что выберешь?',
  },
  rewardStepsLeft: 1,
  rewardProgress: 80,
  streakDays: 6,
};

export default function Home() {
  const [tab, setTab] = useState<TabId>('home');
  const [sheet, setSheet] = useState<TabId | null>(null);
  const [coins, setCoins] = useState(mock.coins);
  const [ownedRoomIds, setOwnedRoomIds] = useState<string[]>(['room-day']);
  const [activeRoomId, setActiveRoomId] = useState('room-day');
  const [previewRoom, setPreviewRoom] = useState<RoomProduct | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(74);

  // высота навигации меряется по факту — шторка останавливается ровно над ней
  useLayoutEffect(() => {
    if (navRef.current) setNavHeight(navRef.current.offsetHeight);
  }, []);
  const xpPercent = Math.min(100, Math.round((mock.xp / mock.xpToNext) * 100));

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
          <div className="flex items-center">
            <div className="relative shrink-0">
              <img
                src={bearAvatar}
                alt={mock.petName}
                className="h-[52px] w-[52px] rounded-full border-2 border-white object-cover shadow-lg"
              />
              <div className="absolute -right-[15px] top-1/2 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center drop-shadow">
                <img src={levelFlower} alt="" className="absolute inset-0 h-full w-full" />
                <span className="relative text-[11px] font-extrabold" style={{ color: '#2c2a5e' }}>
                  {mock.level}
                </span>
              </div>
            </div>

            <div className="ml-[30px]">
              <div
                className="text-[15px] font-bold leading-none text-white"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.45)' }}
              >
                {mock.petName}
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
                {mock.xp} / {mock.xpToNext} XP
              </div>
            </div>
          </div>

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
              className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition active:scale-95"
              style={{ background: 'linear-gradient(180deg, #7c74f5 0%, #5b4de0 100%)' }}
            >
              <IconPlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Метрики */}
        <div className="relative z-20 mt-3 flex gap-2.5 px-4">
          <GlassMetric
            icon={<IconHeart className="h-4 w-4" style={{ color: '#ffffff' }} />}
            iconGradient="linear-gradient(180deg, #fb7185 0%, #e11d48 100%)"
            label="Здоровье"
            value={mock.health}
            barGradient="linear-gradient(90deg, #fb7f92 0%, #ef4060 100%)"
          />
          <GlassMetric
            icon={<IconSmile className="h-4 w-4" style={{ color: '#8a5a00' }} />}
            iconGradient="linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)"
            label="Счастье"
            value={mock.happiness}
            barGradient="linear-gradient(90deg, #f9cb63 0%, #efa622 100%)"
          />
          <GlassMetric
            icon={<IconCoinStack className="h-4 w-4" style={{ color: '#ffffff' }} />}
            iconGradient="linear-gradient(180deg, #4ade80 0%, #16a34a 100%)"
            label="Богатство"
            value={mock.wealth}
            barGradient="linear-gradient(90deg, #63d98b 0%, #21a44f 100%)"
          />
        </div>

        {/* Медведь — занимает всё свободное место между метриками и карточкой */}
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
            className="pointer-events-none absolute left-1/2 h-[86%] w-auto select-none"
            style={{
              bottom: '6.6%',
              transformOrigin: 'bottom center',
              transform: 'translateX(-52%) scaleY(-0.18) skewX(-22deg)',
              filter: 'brightness(0) blur(5px)',
              opacity: 0.5,
            }}
          />
          {/* Плотное касание прямо под лапами */}
          <div
            className="absolute bottom-[4.4%] left-1/2 h-[14px] w-[118px] rounded-[50%]"
            style={{
              transform: 'translateX(-52%)',
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(20,10,2,0.55) 0%, rgba(20,10,2,0.28) 50%, rgba(20,10,2,0) 76%)',
              filter: 'blur(3px)',
            }}
          />
          <img
            src={bearFull}
            alt={mock.petName}
            draggable={false}
            className="pointer-events-none absolute bottom-0 left-1/2 h-[92%] w-auto -translate-x-1/2 select-none object-contain drop-shadow-2xl"
          />
        </div>

        {/* Карточка события + плашки — поверх фото */}
        <div className="relative z-20 px-4">
          {/* Карточка низкая; бейдж и круг с костью намеренно выступают
              за её верхнюю границу — поэтому overflow не обрезаем */}
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
                className="pointer-events-auto absolute left-[38px] top-[58px] h-[30px] w-[107px] rounded-full text-[13px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)',
                  boxShadow:
                    'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
                }}
              >
                Решить
              </button>
            </div>


            <div className="pr-[148px]">
              <p
                className="whitespace-pre-line text-[13.5px] font-bold leading-tight"
                style={{ color: '#2c2a5e' }}
              >
                {mock.event.title}
              </p>
              <p className="mt-1.5 whitespace-nowrap text-[9.5px]" style={{ color: '#7b7a8c' }}>
                {mock.event.description}
              </p>
            </div>
          </div>

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
                  Награда через {mock.rewardStepsLeft} задание
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
                      width: `${mock.rewardProgress}%`,
                      background: 'linear-gradient(90deg, #f1cf86 0%, #e3b355 100%)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              className="flex flex-1 items-center gap-2 rounded-[22px] px-3 py-2.5"
              style={{
                background: 'linear-gradient(180deg, #fbeac4 0%, #f6dca6 100%)',
                boxShadow:
                  'inset 0 3px 7px rgba(146,98,36,0.34), inset 0 -1px 2px rgba(255,255,255,0.30), 0 4px 10px rgba(0,0,0,0.18)',
              }}
            >
              <IconFlame className="h-9 w-9 shrink-0 drop-shadow" />
              <div className="leading-tight">
                <div className="whitespace-nowrap text-[13px] font-bold" style={{ color: '#4a3a22' }}>
                  {mock.streakDays} дней
                </div>
                <div className="text-[12px] font-bold" style={{ color: '#4a3a22' }}>
                  серия
                </div>
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
            onChange={(next) => {
              setTab(next);
              setSheet(next === 'home' ? null : next);
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
          <Lessons
            bottomInset={navHeight}
            coins={coins}
            level={mock.level}
            xp={mock.xp}
            xpToNext={mock.xpToNext}
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
            onClose={() => {
              setSheet(null);
              setTab('home');
            }}
          />
        ) : sheet === 'stats' ? (
          <Stats
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

      {previewRoom && (
        <div className="absolute inset-0 z-50">
          <RoomPreview
            room={previewRoom}
            coins={coins}
            owned={ownedRoomIds.includes(previewRoom.id)}
            active={activeRoomId === previewRoom.id}
            onBack={() => setPreviewRoom(null)}
            onBuy={(room) => {
              if (ownedRoomIds.includes(room.id)) {
                setActiveRoomId(room.id);
                setPreviewRoom(null);
                return;
              }
              if (coins < room.price) return;
              setCoins((c) => c - room.price);
              setOwnedRoomIds((ids) => [...ids, room.id]);
              setActiveRoomId(room.id);
              setPreviewRoom(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
