import { useEffect, useRef, useState } from 'react';
import videoSrc from '../assets/lesson1/lesson-video.mov';
import scene1 from '../assets/lesson1/backgrounds/practice-1.png';
import scene2 from '../assets/lesson1/backgrounds/practice-2.png';
import scene3 from '../assets/lesson1/backgrounds/practice-3.png';
import scene4 from '../assets/lesson1/backgrounds/practice-4.png';
import scene5 from '../assets/lesson1/backgrounds/practice-5.png';
import { IconArrowLeft, IconBook } from '../components/icons';

type Phase = 'video' | 'practice';
interface Props { onBack: () => void }

const scenes = [scene1, scene2, scene3, scene4, scene5];

/** Первый урок: видео и чистые фоновые сцены практики.
 * Интерфейс заданий будет добавляться отдельным слоем поверх этого каркаса.
 */
export default function LessonOne({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [scene, setScene] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => setWatched(true);
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, []);

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
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/65" />
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

      <div className="absolute bottom-[3.5%] left-[4%] right-[4%] z-20 flex items-center gap-[7%]">
        <button type="button" aria-label="Подсказка" className="flex h-14 w-[43%] min-w-0 shrink-0 items-center justify-center gap-2 rounded-[30px] bg-white/95 px-2 text-[clamp(14px,4.5vw,17px)] font-extrabold text-[#16449b] shadow-[0_6px_18px_rgba(80,63,120,.16)] backdrop-blur-sm transition active:scale-[.98]">
          <span className="flex h-[clamp(36px,11vw,44px)] w-[clamp(36px,11vw,44px)] shrink-0 items-center justify-center rounded-full bg-[#6355f0] text-[clamp(21px,6.5vw,26px)] shadow-[0_3px_8px_rgba(72,58,200,.35)]">💡</span>
          <span className="whitespace-nowrap">Подсказка</span>
        </button>
        <button type="button" aria-label="Проверить" className="h-14 min-w-0 flex-1 rounded-[30px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] px-2 text-[clamp(18px,5.8vw,22px)] font-extrabold text-white shadow-[0_7px_18px_rgba(80,65,215,.38)] transition active:scale-[.98]">Проверить</button>
      </div>
    </div>
  );
}
