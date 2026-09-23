import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/lesson1/lesson-video.mov';
import scene1 from '../assets/lesson1/backgrounds/practice-1.png';
import scene2 from '../assets/lesson1/backgrounds/practice-2.png';
import scene3 from '../assets/lesson1/backgrounds/practice-3.png';
import scene4 from '../assets/lesson1/backgrounds/practice-4.png';
import scene5 from '../assets/lesson1/backgrounds/practice-5.png';
import { IconArrowLeft, IconBook } from '../components/icons';
import foodBowl from '../assets/items/food/bowl-blue-kibble.png';
import piggyBank from '../assets/piggy-bank/piggy.png';
import starIcon from '../assets/icons/xp-star.png';
import toyCar from '../assets/lesson1/items/toy-car.png';
import { pauseBackgroundMusic, startBackgroundMusic } from '../services/backgroundMusic';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void }

const scenes = [scene1, scene2, scene3, scene4, scene5];
const practiceItems = [
  { id: 'food', label: 'Еда', price: 60, image: foodBowl, category: 'must' },
  { id: 'toy', label: 'Игрушка', price: 50, image: toyCar, category: 'want' },
  { id: 'savings', label: 'Копилка', price: 20, image: piggyBank, category: 'save' },
] as const;

type PracticeItem = (typeof practiceItems)[number];

function DraggableItem({ item, sourceSlot, setDragging, onClick }: { item: PracticeItem; sourceSlot?: number; setDragging: (value: { id: string; from: number | null }) => void; onClick: () => void }) {
  return <div draggable onDragStart={() => setDragging({ id: item.id, from: sourceSlot ?? null })} onClick={onClick} className="flex min-h-0 cursor-grab flex-col items-center justify-center rounded-[15px] bg-white/90 p-1 text-center shadow-[0_3px_8px_rgba(83,65,90,.12)] transition active:cursor-grabbing active:scale-95">
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white/70"><img src={item.image} alt="" className="h-full w-full object-contain p-1" /></div>
    <span className="mt-0.5 text-[clamp(10px,3vw,14px)] font-extrabold leading-none text-[#17469d]">{item.label}</span>
    <span className="text-[clamp(9px,2.7vw,12px)] font-bold text-[#17469d]">🪙 {item.price}</span>
  </div>;
}

/** Первый урок: видео и чистые фоновые сцены практики.
 * Интерфейс заданий будет добавляться отдельным слоем поверх этого каркаса.
 */
export default function LessonOne({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const [placements, setPlacements] = useState<(string | null)[]>([null, null, null]);
  const [dragging, setDragging] = useState<{ id: string; from: number | null } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    pauseBackgroundMusic();
    return () => startBackgroundMusic();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => setWatched(true);
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, []);

  function placeItem(slot: number, id: string) {
    setPlacements((current) => {
      const next = [...current];
      const from = next.indexOf(id);
      const replaced = next[slot];
      if (from >= 0) next[from] = replaced ?? null;
      next[slot] = id;
      return next;
    });
    setDragging(null);
  }

  function returnToTray(id: string) {
    setPlacements((current) => current.map((value) => value === id ? null : value));
    setDragging(null);
  }

  if (phase === 'video') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#17152f]">
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${playing ? '' : 'scale-105 blur-xl opacity-60'}`}
        />
        <button aria-label="Назад" onClick={onBack} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>
        <button onClick={() => { setWatched(true); setPhase('practice'); }} className="absolute right-5 top-7 z-20 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">Пропустить</button>
        {!playing && !watched && <button aria-label="Воспроизвести видео" onClick={() => { setPlaying(true); void videoRef.current?.play().catch(() => setWatched(true)); }} className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#675ff3] text-5xl text-white shadow-lg">▶</button>}
        {watched && <button onClick={() => setPhase('practice')} className="absolute bottom-8 left-6 right-6 z-20 rounded-[28px] bg-[#675ff3] py-4 text-xl font-black text-white shadow-lg">Решать</button>}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#fbefe1]">
      <img src={scenes[scene]} alt="Фон практического задания" className="absolute inset-0 h-full w-full object-cover object-center" />

      {/* Кнопка назад повторяет шапку разделов на главной */}
      <button aria-label="Назад" onClick={scene === 0 ? onBack : () => setScene((value) => value - 1)} className="absolute left-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"><IconArrowLeft className="h-5 w-5" /></button>

      <div className="absolute left-1/2 top-[2.8%] z-20 flex h-[6%] w-[44%] -translate-x-1/2 items-center rounded-full border border-white/30 bg-[#4d497d]/55 px-[5%] shadow-[0_4px_14px_rgba(50,42,110,.25)] backdrop-blur-md">
        <div className="relative flex w-full items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/45" />
          {scenes.map((_, index) => (
            <span
              key={index}
              className={`relative z-10 h-3.5 w-3.5 rounded-full border-2 border-white/55 transition ${index === scene ? 'bg-white shadow-[0_0_0_2px_rgba(114,106,255,.75),0_0_10px_3px_rgba(255,255,255,.85)]' : index < scene ? 'bg-[#d9d8ff]' : 'bg-[#817b98]'}`}
            />
          ))}
        </div>
      </div>

      {/* Круглая кнопка книги — единственный дополнительный элемент на чистом фоне */}
      <button aria-label="Открыть урок" className="absolute right-5 top-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#5b4cf0] text-white shadow-[0_6px_18px_rgba(74,60,205,.38)] transition active:scale-95"><IconBook className="h-7 w-7" /></button>

      <div className="absolute left-[5%] right-[5%] top-[40%] bottom-[21%] z-10 grid grid-cols-3 grid-rows-[minmax(0,1.18fr)_minmax(0,.82fr)] gap-2.5">
        {[
          { label: 'Обязательное', color: 'bg-[#dff8d7]', border: '#83cf7a', icon: foodBowl, slot: 0 },
          { label: 'Накопления', color: 'bg-[#d8f7f5]', border: '#78cacc', icon: piggyBank, slot: 1 },
          { label: 'Желания', color: 'bg-[#eedfff]', border: '#b18de9', icon: starIcon, slot: 2 },
        ].map((category) => {
          const placed = placements[category.slot];
          const item = practiceItems.find((entry) => entry.id === placed);
          return <div key={category.label} onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && placeItem(category.slot, dragging.id)} className={`flex min-h-0 flex-col rounded-[20px] ${category.color} p-2 shadow-[0_4px_12px_rgba(85,71,100,.14)]`}>
            <div className="flex min-w-0 items-center gap-1 text-center text-[clamp(8px,2.2vw,11px)] font-black leading-none text-[#1f5a2b]"><img src={category.icon} alt="" className="h-5 w-5 shrink-0 object-contain" /><span className="min-w-0 flex-1 whitespace-nowrap">{category.label}</span></div>
            <div className="mt-1.5 flex min-h-0 flex-1 items-center justify-center rounded-xl border-2 border-dashed bg-white/10 p-1" style={{ borderColor: category.border }}>
              {item && <DraggableItem item={item} sourceSlot={category.slot} setDragging={setDragging} onClick={() => returnToTray(item.id)} />}
            </div>
          </div>;
        })}
        <div className="col-span-3 grid min-h-0 grid-cols-3 gap-2 rounded-[22px] bg-white/55 p-2" onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && returnToTray(dragging.id)}>
          {practiceItems.filter((item) => !placements.includes(item.id)).map((item) => <DraggableItem key={item.id} item={item} setDragging={setDragging} onClick={() => placeItem(placements.findIndex((value) => value === null), item.id)} />)}
        </div>
      </div>

      <div className="absolute bottom-[3.5%] left-[4%] right-[4%] z-20 flex items-center gap-[6%]">
        <button type="button" aria-label="Подсказка" className="flex h-14 w-[45%] min-w-0 shrink-0 items-center justify-center gap-3 rounded-[30px] bg-white/95 px-3 text-[clamp(14px,4.2vw,16px)] font-extrabold text-[#16449b] shadow-[0_6px_18px_rgba(80,63,120,.16)] backdrop-blur-sm transition active:scale-[.98]">
          <span className="flex h-[clamp(36px,10vw,41px)] w-[clamp(36px,10vw,41px)] shrink-0 items-center justify-center rounded-full bg-[#6355f0] text-[clamp(21px,6vw,25px)] shadow-[0_3px_8px_rgba(72,58,200,.35)]">💡</span>
          <span className="whitespace-nowrap">Подсказка</span>
        </button>
        <button type="button" aria-label="Проверить" className="h-14 min-w-0 flex-1 rounded-[30px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] px-2 text-[clamp(18px,5.8vw,22px)] font-extrabold text-white shadow-[0_7px_18px_rgba(80,65,215,.38)] transition active:scale-[.98]">Проверить</button>
      </div>
    </div>
  );
}
