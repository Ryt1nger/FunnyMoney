import { useEffect, useMemo, useRef, useState } from 'react';
import videoSrc from '../assets/lesson1/lesson-video.mov';
import scene1 from '../assets/lesson1/step-1.png';
import scene2 from '../assets/lesson1/step-2.png';
import scene3 from '../assets/lesson1/step-3.png';
import scene4 from '../assets/lesson1/step-4.png';
import scene5 from '../assets/lesson1/step-5.png';
import { usePetStore } from '../features/pet/petStore';
import CoinBadge from '../components/CoinBadge';

type Phase = 'video' | 'practice' | 'done';
type Marks = Record<string, boolean>;
type Assignment = Record<string, string>;
interface Props { onBack: () => void }

const scenes = [scene1, scene2, scene3, scene4, scene5];
const hints = [
  'Еда нужна каждый день. Игрушка радует. Копилка помогает накопить на цель.',
  'Сначала добавь еду и лекарство. Потом посмотри, сколько осталось.',
  'Можно ли обойтись без этого сегодня? Вода, поводок и лекарство нужны на прогулке.',
  'Ищи экономию в желаниях, не в еде и здоровье.',
  'Игрушку выбираем только после обязательного: баланс → обязательное → покупка → остаток.',
];

function Card({ id: _id, icon, label, price, selected, onClick }: { id: string; icon: string; label: string; price?: number; selected: boolean; onClick: () => void }) {
  return <button aria-label={label} onClick={onClick} className={`min-h-[84px] rounded-[20px] border-2 bg-[#fffdfb] p-2 shadow-[0_5px_12px_rgba(90,70,90,.12)] transition active:scale-95 ${selected ? 'border-[#645cf0] bg-[#f0efff] ring-2 ring-[#a5a0ff]' : 'border-white/80'}`}><div className="text-4xl leading-none">{icon}</div><div className="mt-1 text-[14px] font-extrabold leading-tight text-[#16449b]">{label}</div>{price !== undefined && <div className="mt-1 scale-75"><CoinBadge coins={price} /></div>}</button>;
}

function Bubble({ title, text }: { title: string; text: string }) { return <div className="absolute right-[5%] top-[10%] z-10 w-[48%] rounded-[28px] bg-white/95 px-5 py-4 text-[#21499d] shadow-[0_8px_22px_rgba(51,41,95,.18)]"><h2 className="text-[21px] font-black leading-tight">{title}</h2><p className="mt-1.5 text-[15px] font-semibold leading-snug text-[#647aa7]">{text}</p></div>; }

export default function LessonOne({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('video');
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Marks>({});
  const [assigned, setAssigned] = useState<Assignment>({});
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { const video = videoRef.current; if (!video) return; const ended = () => setWatched(true); video.addEventListener('ended', ended); return () => video.removeEventListener('ended', ended); }, []);
  const sequence = useMemo(() => Object.keys(assigned).sort((a, b) => Number(assigned[a]) - Number(assigned[b])).join(','), [assigned]);
  const toggle = (id: string) => { setFeedback(null); setSelected((prev) => ({ ...prev, [id]: !prev[id] })); };
  const resetFor = (n: number) => { setStep(n); setSelected({}); setAssigned({}); setActiveCard(null); setFeedback(null); setHintOpen(false); };
  const next = () => step === 4 ? setPhase('done') : resetFor(step + 1);
  function check() {
    let ok = false;
    if (step === 0) ok = assigned.food === 'must' && assigned.savings === 'save' && assigned.toy === 'want';
    if (step === 1) ok = Boolean(selected.food && selected.medicine && selected.stickers) && !selected.toy;
    if (step === 2) ok = Boolean(selected.water && selected.leash && selected.medicine) && !selected.toy && !selected.bow && !selected.candy;
    if (step === 3) ok = selected.cut && selected.gift;
    if (step === 4) ok = sequence === 'balance,need,buy,rest';
    if (ok) { usePetStore.getState().addXp(5); setFeedback('Молодец! Всё верно. +5 XP'); } else setFeedback('Почти! Попробуй ещё раз — монеты не пропадут.');
  }
  if (phase === 'video') return <div className="relative h-full w-full overflow-hidden bg-[#14132b]"><video ref={videoRef} src={videoSrc} playsInline preload="metadata" className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${playing ? '' : 'scale-105 blur-xl opacity-60'}`} /><div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" /><button aria-label="Назад" onClick={onBack} className="absolute left-4 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/25 text-4xl text-white backdrop-blur-md">‹</button><button onClick={() => { setWatched(true); setPhase('practice'); }} className="absolute right-5 top-7 z-20 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">Пропустить</button>{!playing && !watched && <button aria-label="▶" onClick={() => { setPlaying(true); void videoRef.current?.play().catch(() => setWatched(true)); }} className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#675ff3] text-5xl text-white shadow-lg">▶</button>}{watched && <button onClick={() => setPhase('practice')} className="absolute bottom-8 left-6 right-6 z-20 rounded-[28px] bg-[#675ff3] py-4 text-xl font-black text-white shadow-lg">Решать</button>}</div>;
  if (phase === 'done') return <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#fff_0,#fbefe1_55%,#e7e2ff_100%)] px-7 text-center"><button aria-label="Назад" onClick={onBack} className="absolute left-4 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-4xl text-[#40358b] shadow">‹</button><div className="text-7xl">🎉</div><h2 className="mt-5 text-3xl font-black text-[#173f96]">Урок пройден!</h2><p className="mt-3 text-lg font-semibold text-[#6276a5]">Сначала нужное, потом цель — и только затем то, что хочется.</p><button onClick={onBack} className="mt-8 rounded-[26px] bg-[#675ff3] px-10 py-4 text-lg font-black text-white shadow-lg">К урокам</button></div>;

  const item = (id: string, icon: string, label: string, price?: number) => <Card id={id} icon={icon} label={label} price={price} selected={Boolean(selected[id] || activeCard === id)} onClick={() => { setFeedback(null); if (step === 0 || step === 4) setActiveCard(id); else toggle(id); }} />;
  const assign = (category: string) => { if (!activeCard) return; setAssigned((prev) => ({ ...prev, [activeCard]: category })); setActiveCard(null); };
  return <div className="relative h-full w-full overflow-hidden bg-[#fbefe1] text-[#204a9d]"><img src={scenes[step]} alt="" className="absolute inset-0 h-full w-full object-fill" /><button aria-label="Назад" onClick={step === 0 ? onBack : () => resetFor(step - 1)} className="absolute left-[5%] top-[2.5%] z-20 flex h-[8%] w-[13%] items-center justify-center rounded-full bg-white/40 text-4xl text-white shadow backdrop-blur-md">‹</button><div className="absolute left-[31%] top-[2.5%] z-20 flex h-[6%] w-[43%] items-center justify-between rounded-full bg-white/30 px-[4%] backdrop-blur-md">{[0,1,2,3,4].map((n) => <span key={n} className={`h-3 w-3 rounded-full border-2 border-white/70 ${n <= step ? 'bg-[#645cf0]' : 'bg-white/35'}`} />)}</div><div className="absolute right-[5%] top-[2.5%] z-20 flex h-[8%] w-[13%] items-center justify-center rounded-full bg-[#645cf0] text-2xl shadow-lg">📖</div>
    {step === 0 && <><Bubble title="Разложи покупки!" text="Что нужно сначала, что можно отложить, а что просто хочется?" /><div className="absolute bottom-[6%] left-[4%] right-[4%] z-10 rounded-[30px] bg-[#fff8ed]/95 p-4 shadow-xl"><div className="grid grid-cols-3 gap-2"><div className="rounded-2xl bg-[#def7d4] p-2"><div className="mb-2 rounded-2xl border-2 border-dashed border-[#86ce83] py-2 text-center text-xs font-black">ОБЯЗАТЕЛЬНОЕ</div>{item('food','🍲','Еда',60)}</div><div className="rounded-2xl bg-[#d8f6f5] p-2"><div className="mb-2 rounded-2xl border-2 border-dashed border-[#74c8ca] py-2 text-center text-xs font-black">НАКОПЛЕНИЯ</div>{item('savings','🐷','Копилка',20)}</div><div className="rounded-2xl bg-[#f0ddff] p-2"><div className="mb-2 rounded-2xl border-2 border-dashed border-[#b08bec] py-2 text-center text-xs font-black">ЖЕЛАНИЯ</div>{item('toy','🚗','Игрушка',50)}</div></div><div className="mt-3 flex gap-2"><button onClick={() => assign('must')} className="flex-1 rounded-2xl bg-[#d8f6d4] py-2 text-xs font-black">В обязательное</button><button onClick={() => assign('save')} className="flex-1 rounded-2xl bg-[#d8f6f5] py-2 text-xs font-black">В накопления</button><button onClick={() => assign('want')} className="flex-1 rounded-2xl bg-[#f0ddff] py-2 text-xs font-black">В желания</button></div></div></>}
    {step === 1 && <><Bubble title="Собери корзину!" text="Выбери обязательные покупки и уложись в бюджет 100 монет." /><div className="absolute bottom-[6%] left-[4%] right-[4%] z-10 rounded-[30px] bg-[#fff8ed]/95 p-4 shadow-xl"><div className="mb-3 flex items-center justify-between rounded-2xl bg-[#eaf4ff] px-4 py-2 text-lg font-black">🪙 Бюджет: 100 <span className="rounded-full bg-white px-3 py-1 text-sm">{Object.values(selected).filter(Boolean).length}/3</span></div><div className="grid grid-cols-4 gap-2">{item('food','🍲','Еда',50)}{item('medicine','💊','Лекарство',30)}{item('stickers','🌈','Наклейки',20)}{item('toy','🚗','Игрушка',40)}</div><div className="mt-3 rounded-2xl bg-[#dff6ff] p-3 text-center text-sm font-black">🧺 Выбери еду, лекарство и наклейки</div></div></>}
    {step === 2 && <><Bubble title="Найди лишнее!" text="Что нужно взять на прогулку с собачкой? Выбери только необходимое." /><div className="absolute bottom-[6%] left-[4%] right-[4%] z-10 rounded-[30px] bg-[#fff8ed]/95 p-4 shadow-xl"><div className="grid grid-cols-3 gap-2">{item('water','💧','Вода')}{item('leash','🦮','Поводок')}{item('medicine','💊','Лекарство')}{item('toy','🧸','Игрушка')}{item('bow','🎀','Бантик')}{item('candy','🍬','Конфета')}</div><div className="mt-3 rounded-2xl bg-[#dff6ff] p-3 text-center text-sm font-black">🧺 В корзине: {Object.values(selected).filter(Boolean).length}/3</div></div></>}
    {step === 3 && <><Bubble title="Появилась новая покупка!" text="Уменьши развлечения на 10 и добавь 10 монет на подарок другу." /><div className="absolute bottom-[6%] left-[4%] right-[4%] z-10 rounded-[30px] bg-[#fff8ed]/95 p-4 shadow-xl"><h3 className="mb-2 rounded-full bg-[#ddd9ff] px-4 py-2 text-lg font-black">Твой план</h3><div className="grid grid-cols-4 gap-2">{item('food','🍲','Еда',60)}{item('savings','🐷','Копилка',20)}{item('cut','🎮','Развлечения',10)}{item('gift','🎁','Подарок',10)}</div><div className="mt-3 flex justify-center gap-6 text-lg font-black"><span className="rounded-full bg-[#ffd1d1] px-4 py-1 text-[#d65353]">−10</span><span className="rounded-full bg-[#d4f6d2] px-4 py-1 text-[#369a4e]">+10</span></div></div></>}
    {step === 4 && <><Bubble title="Расставь шаги!" text="Поставь действия в правильном порядке. С чего начать, а чем закончить?" /><div className="absolute bottom-[6%] left-[4%] right-[4%] z-10 rounded-[30px] bg-[#fff8ed]/95 p-4 shadow-xl"><div className="mb-3 grid grid-cols-4 gap-2">{['balance','need','buy','rest'].map((id, i) => <div key={id} className="rounded-2xl border-2 border-dashed border-[#9eb6e7] bg-[#eef5ff] py-3 text-center text-xl font-black">{assigned[id] || i + 1}</div>)}</div><div className="grid grid-cols-4 gap-2">{item('balance','💳','Баланс')}{item('need','📝','Обязательное')}{item('buy','🛒','Покупка')}{item('rest','🧸','Остаток')}</div><button onClick={() => { if (activeCard) { setAssigned((prev) => ({ ...prev, [activeCard]: String(Object.keys(prev).length + 1) })); setActiveCard(null); } }} className="mt-3 w-full rounded-2xl bg-[#e7e2ff] py-2 text-sm font-black">Поставить выбранным следующим</button></div></>}
    <div className="absolute bottom-[1.5%] left-[7%] right-[7%] z-20 flex gap-3"><button onClick={() => setHintOpen(true)} className="flex-1 rounded-[24px] bg-white/95 py-3 text-sm font-black text-[#2856a8] shadow-lg">💡 Подсказка</button><button onClick={feedback?.startsWith('Молодец') ? next : check} className="flex-[1.35] rounded-[24px] bg-[#675ff3] py-3 text-lg font-black text-white shadow-lg">{feedback?.startsWith('Молодец') ? 'Дальше' : 'Проверить'}</button></div>{hintOpen && <div className="absolute bottom-[11%] left-[7%] right-[7%] z-30 rounded-3xl bg-white/95 p-4 text-center text-sm font-semibold text-[#4d679b] shadow-xl"><button onClick={() => setHintOpen(false)} className="absolute right-3 top-1 text-xl">×</button>{hints[step]}</div>}{feedback && <div className={`absolute bottom-[11%] left-[7%] right-[7%] z-25 rounded-3xl p-3 text-center text-sm font-black shadow-xl ${feedback.startsWith('Молодец') ? 'bg-[#dff8df] text-[#23733a]' : 'bg-[#fff4db] text-[#976b1f]'}`}>{feedback}</div>}
  </div>;
}
