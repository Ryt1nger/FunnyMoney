import { useEffect, useRef, useState } from 'react';
import heroBg from '../assets/onboarding/hero-bg.jpg';
import cakeIcon from '../assets/onboarding/cake.png';
import bearHeadIcon from '../assets/onboarding/bear-head.png';
import pawsIcon from '../assets/onboarding/paws-trim.png';
import { IconChevronLeft, IconChevronRight, IconArrowRight, IconDice } from '../components/icons';

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

const AGE_MIN = 1;
const AGE_MAX = 99;
const AGES = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => i + AGE_MIN);
const RANDOM_NAMES = ['Мани', 'Бублик', 'Тедди', 'Кекс', 'Барни', 'Гриша', 'Пончик', 'Кузя'];

interface Props {
  onComplete: (age: number, petName: string) => void;
}

/** Ширина одного числа в барабане (px) — используется и в разметке, и в расчётах скролла. */
const DRUM_ITEM_WIDTH = 40;

function clampIndex(i: number) {
  return Math.min(AGES.length - 1, Math.max(0, i));
}

/**
 * Барабан выбора возраста: сама рамка-фокус стоит на месте по центру,
 * а числа 1–99 прокручиваются под ней, как настоящий барабан прокрутки —
 * не "фокус бегает по цифрам", а "цифры бегают под фокусом".
 *
 * Тут только ОДИН механизм двигает скролл — физический scrollLeft контейнера —
 * будь то палец пользователя, стрелка (scrollBy) или тап по числу (scrollTo).
 * index всегда просто читается из текущего scrollLeft через onScroll, поэтому
 * визуальная позиция и выбранное число никогда не могут разъехаться.
 */
function AgeDrum({
  initialIndex,
  onChange,
  controlRef,
}: {
  initialIndex: number;
  onChange: (i: number) => void;
  controlRef: { current: { step: (delta: number) => void; jumpTo: (i: number) => void } | null };
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [renderIndex, setRenderIndex] = useState(initialIndex);

  // Мгновенная установка стартовой позиции без анимации — один раз при монтировании.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollLeft = initialIndex * DRUM_ITEM_WIDTH;
      });
    });
    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Стрелки/тап управляют барабаном напрямую через scrollBy/scrollTo —
  // никакого отдельного "sync-эффекта" по index, значит и гонки между ними нет.
  useEffect(() => {
    controlRef.current = {
      step: (delta: number) => {
        const el = scrollerRef.current;
        if (!el) return;
        const nextIndex = clampIndex(Math.round(el.scrollLeft / DRUM_ITEM_WIDTH) + delta);
        el.scrollTo({ left: nextIndex * DRUM_ITEM_WIDTH, behavior: 'smooth' });
      },
      jumpTo: (i: number) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ left: clampIndex(i) * DRUM_ITEM_WIDTH, behavior: 'smooth' });
      },
    };
  }, [controlRef]);

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const nearest = clampIndex(Math.round(el.scrollLeft / DRUM_ITEM_WIDTH));
    setRenderIndex((prev) => (prev === nearest ? prev : nearest));
    onChange(nearest);

    // Догоняем ровный снап уже после того, как скролл (палец/инерция/анимация) остановился —
    // подстраховка на случай, если браузерный scroll-snap сам не дотянул точно до центра.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el2 = scrollerRef.current;
      if (!el2) return;
      const settled = clampIndex(Math.round(el2.scrollLeft / DRUM_ITEM_WIDTH));
      const target = settled * DRUM_ITEM_WIDTH;
      if (Math.abs(el2.scrollLeft - target) > 0.5) {
        el2.scrollTo({ left: target, behavior: 'smooth' });
      }
    }, 120);
  }

  return (
    <div className="relative mt-1 h-12">
      {/* Затухание по краям, чтобы числа не обрывались резко */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white/90 to-transparent" />

      {/* Неподвижная рамка-фокус по центру — под ней едут числа */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: VIOLET,
          boxShadow:
            'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.3)',
        }}
      />

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div aria-hidden style={{ flex: `0 0 calc(50% - ${DRUM_ITEM_WIDTH / 2}px)` }} />
        {AGES.map((value, i) => {
          const selected = i === renderIndex;
          const dist = Math.abs(i - renderIndex);
          return (
            <button
              key={value}
              type="button"
              onClick={() => controlRef.current?.jumpTo(i)}
              style={{ flex: `0 0 ${DRUM_ITEM_WIDTH}px`, scrollSnapAlign: 'center' }}
              className="relative z-20 flex h-full items-center justify-center"
            >
              <span
                className={`font-extrabold transition-all ${
                  selected ? 'text-[19px] text-white' : dist <= 2 ? 'text-[15px]' : 'text-[13px]'
                }`}
                style={{ color: selected ? '#fff' : dist > 2 ? '#c7c4d9' : '#4a4560' }}
              >
                {value}
              </span>
            </button>
          );
        })}
        <div aria-hidden style={{ flex: `0 0 calc(50% - ${DRUM_ITEM_WIDTH / 2}px)` }} />
      </div>
    </div>
  );
}

/**
 * Экран первого запуска: знакомство — выбор возраста и имени питомца.
 * Герой-картинка (медвежонок за столом) уже содержит логотип и книжки,
 * поверх неё — только заголовок и подзаголовок.
 */
export default function Onboarding({ onComplete }: Props) {
  const [ageIndex, setAgeIndex] = useState(AGES.indexOf(7));
  const [name, setName] = useState('Мани');
  const ageDrumControl = useRef<{ step: (delta: number) => void; jumpTo: (i: number) => void } | null>(null);

  const age = AGES[ageIndex];

  function shiftAge(delta: number) {
    ageDrumControl.current?.step(delta);
  }

  function randomizeName() {
    setName((current) => {
      const pool = RANDOM_NAMES.filter((n) => n !== current);
      return pool[Math.floor(Math.random() * pool.length)] ?? current;
    });
  }

  const canContinue = name.trim().length > 0;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#2d2b45]">
      {/* Герой: фон с медвежонком (логотип и книжки уже в картинке) + заголовок.
          Высота — flex-1 (не aspect-ratio): герой забирает ровно то место, которое
          останется после кремовой панели снизу. Панель сама минимальной высоты —
          под свой контент, без скролла — поэтому чем компактнее панель, тем выше герой,
          как на макете. Затемнение — в самом верху картинки (под лого и заголовком),
          плавно сходит на нет книзу. */}
      <div className="relative w-full min-h-0 flex-1 overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '50% 2%' }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[42%]"
          style={{ background: 'linear-gradient(180deg, rgba(15,14,30,0.62) 0%, rgba(15,14,30,0.34) 55%, rgba(15,14,30,0) 100%)' }}
        />
        <div className="absolute inset-x-0 top-[29%] max-w-[62%] px-5">
          <h1
            className="text-[23px] leading-[1.1] text-white drop-shadow-md"
            style={{ fontFamily: "'Baloo 2', system-ui, sans-serif", fontWeight: 700 }}
          >
            Давай познакомимся!
          </h1>
          <p className="mt-1.5 max-w-[190px] text-[12px] leading-snug text-white/90 drop-shadow-md">
            Настрой своего мишку, чтобы начать увлекательное путешествие в мир финансов!
          </p>
        </div>
      </div>

      {/* Кремовая панель с настройками — высота по контенту (shrink-0), минимальная,
          но без скролла: весь контент должен помещаться. */}
      <div className="relative z-10 -mt-5 flex shrink-0 flex-col overflow-hidden rounded-t-[26px] bg-[#fbefe1]">
        {/* Декоративные полупрозрачные лапки по углам панели */}
        <img
          src={pawsIcon}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -left-4 bottom-24 h-16 w-16 opacity-[0.14]"
        />
        <img
          src={pawsIcon}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-3 top-6 h-12 w-12 rotate-[35deg] opacity-[0.12]"
        />

        <div className="relative flex flex-col gap-3 px-4 pb-3 pt-5">
          {/* Карточка: возраст */}
          <div className="rounded-[20px] bg-white/90 p-3.5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <img src={cakeIcon} alt="" className="h-9 w-9 shrink-0 object-contain" />
              <div className="min-w-0">
                <div className="text-[15px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                  Сколько тебе лет?
                </div>
                <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: '#8b899e' }}>
                  Выбери свой возраст, чтобы мы подобрали интересные задания!
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <button
                onClick={() => shiftAge(-1)}
                disabled={ageIndex === 0}
                aria-label="Меньше"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6f6c8a] transition active:scale-90 disabled:opacity-30"
                style={{ background: 'rgba(111,108,138,0.1)' }}
              >
                <IconChevronLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <AgeDrum initialIndex={ageIndex} onChange={setAgeIndex} controlRef={ageDrumControl} />
              </div>

              <button
                onClick={() => shiftAge(1)}
                disabled={ageIndex === AGES.length - 1}
                aria-label="Больше"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6f6c8a] transition active:scale-90 disabled:opacity-30"
                style={{ background: 'rgba(111,108,138,0.1)' }}
              >
                <IconChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Карточка: имя питомца */}
          <div className="rounded-[20px] bg-white/90 p-3.5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <img src={bearHeadIcon} alt="" className="h-9 w-9 shrink-0 object-contain" />
              <div className="min-w-0">
                <div className="text-[15px] font-bold leading-tight" style={{ color: '#2c2a5e' }}>
                  Как назовём мишку?
                </div>
                <div className="mt-0.5 text-[11.5px] leading-snug" style={{ color: '#8b899e' }}>
                  Придумай имя для своего нового друга!
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                placeholder="Имя мишки"
                className="min-w-0 flex-1 rounded-2xl px-3.5 py-2.5 text-[15px] font-bold outline-none"
                style={{ background: '#f1eef9', color: '#2c2a5e' }}
              />
              <button
                onClick={randomizeName}
                aria-label="Случайное имя"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition active:scale-90"
                style={{ background: VIOLET }}
              >
                <IconDice className="h-5 w-5" />
              </button>
            </div>

            <div
              className="mt-2.5 rounded-full px-3 py-1.5 text-center text-[11px] font-medium"
              style={{ background: '#f1eef9', color: '#8b899e' }}
            >
              ✨ Имя можно будет изменить позже
            </div>
          </div>
        </div>

        <div className="relative flex shrink-0 items-center justify-center pb-5 pt-2">
          {/* Лапки — абсолютно позиционированы на фиксированном отступе от края экрана
              (а не через gap рядом с кнопкой), чтобы расстояние край→лапка было
              гарантированно одинаковым с обеих сторон независимо от ширины кнопки. */}
          <img
            src={pawsIcon}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-16 w-16 -translate-y-1/2 -scale-x-100 select-none opacity-25"
          />
          <button
            onClick={() => canContinue && onComplete(age, name.trim())}
            disabled={!canContinue}
            className="flex items-center justify-center gap-2 rounded-full px-9 py-3.5 text-[15px] font-bold text-white transition active:translate-y-[2px] active:scale-[0.99] disabled:opacity-60"
            style={{
              background: VIOLET,
              boxShadow:
                'inset 0 2px 0 rgba(176,175,246,0.55), inset 0 -2px 0 rgba(71,72,187,0.8), 0 4px 10px rgba(92,90,216,0.26)',
            }}
          >
            Продолжить
            <IconArrowRight className="h-4 w-4" />
          </button>
          <img
            src={pawsIcon}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 h-16 w-16 -translate-y-1/2 select-none opacity-25"
          />
        </div>
      </div>
    </div>
  );
}
