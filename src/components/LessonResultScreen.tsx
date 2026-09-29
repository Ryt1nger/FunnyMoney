import coinIcon from '../assets/icons/coin.png';
import checkIcon from '../assets/icons/result-check.png';
import coinsStackIcon from '../assets/icons/result-coins.png';
import xpStarIcon from '../assets/icons/result-xp.png';
import targetIcon from '../assets/icons/result-target.png';
import { IconArrowLeft } from './icons';
import { usePetStore } from '../features/pet/petStore';
import { getCharacterById } from '../data/petCharacters';

export interface LessonResultScreenProps {
  /** Номер урока в курсе (1..6) — показывается в заголовке карточки. */
  lessonStep: number;
  lessonTitle: string;
  /** Короткое имя навыка для нижней правой плитки. */
  skillName: string;
  /** Фраза "чему научился" в зелёном баннере. */
  outcomeText: string;
  correctCount: number;
  totalCount: number;
  coinsEarned: number;
  xpEarned: number;
  /** Текущий баланс монет — показывается в шапке (после начисления награды). */
  walletCoins: number;
  onRetry: () => void;
  onBackToList: () => void;
}

// Маленькая круглая иконка-заглушка (обновление/список) — отдельного ассета
// под эти кнопки в проекте нет, поэтому рисуем простым инлайн-SVG в стиле
// остальных иконок приложения (components/icons.tsx).
function IconRefresh({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v5h5" />
      <path d="M20 20v-5h-5" />
      <path d="M5.1 15a8 8 0 0 0 13.8 2.4M18.9 9A8 8 0 0 0 5.1 6.6" />
    </svg>
  );
}

function IconGrid({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

/** Плитка с иконкой сверху и парой строк (заголовок/значение) в 2×2-сетке
 * результатов. Порядок строк настраивается — в макете он разный для каждой
 * плитки (где-то крупное значение сверху, где-то подпись). */
function StatTile({
  icon,
  top,
  bottom,
  bottomColor = '#1b3f8f',
}: {
  icon: string;
  top: string;
  bottom: string;
  bottomColor?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[16px] bg-[#fbefe1] px-2 py-2.5 text-center">
      <img src={icon} alt="" className="h-9 w-9 object-contain" />
      <span className="text-[9.5px] font-bold leading-tight text-[#8a86a3]">{top}</span>
      <span className="line-clamp-1 text-[14px] font-black leading-tight" style={{ color: bottomColor }}>{bottom}</span>
    </div>
  );
}

/** Экран результатов урока — показывается вместо самого урока сразу после
 * прохождения последней сцены практики (см. Lessons.tsx: activeLesson +
 * lessonResult). Показывает итоги (сколько решений верных, сколько монет и
 * XP начислено, какой навык закрыт) и три действия: следующий урок, начать
 * заново или вернуться к списку уроков. */
export default function LessonResultScreen({
  lessonStep,
  lessonTitle,
  skillName,
  outcomeText,
  correctCount,
  totalCount,
  coinsEarned,
  xpEarned,
  walletCoins,
  onRetry,
  onBackToList,
}: LessonResultScreenProps) {
  const character = getCharacterById(usePetStore((s) => s.pet?.characterId));

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#fbefe1]">
      <style>{`@keyframes lessonResultIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes lessonResultPop{0%{opacity:0;transform:scale(.7)}60%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}@keyframes lessonResultFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>

      <div
        className="safe-area-topbar relative z-10 flex shrink-0 items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <button
          aria-label="Назад к урокам"
          onClick={onBackToList}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-[#4a4560] backdrop-blur-md transition active:scale-95"
        >
          <IconArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 shadow-sm">
          <img src={coinIcon} alt="" className="h-5 w-5" />
          <span className="text-[14px] font-black leading-none text-[#4a4560]">{walletCoins}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1">
        <div className="flex items-center justify-center gap-2">
          <span aria-hidden className="inline-block h-4 w-2.5 -skew-x-[18deg] rounded-[2px] bg-[#f6c84c]" />
          <h1 className="text-center text-[23px] font-black leading-tight text-[#1b3f8f]">Урок завершён!</h1>
          <span aria-hidden className="inline-block h-4 w-2.5 -skew-x-[18deg] rounded-[2px] bg-[#f6c84c]" />
        </div>
        <p className="mt-0.5 text-center text-[12.5px] font-bold text-[#8a86a3]">Результаты урока</p>

        <div className="mt-4 rounded-[26px] bg-white/85 p-3 shadow-[0_10px_30px_rgba(80,63,120,.14)] [animation:lessonResultIn_360ms_ease-out]">
          <p className="text-[15px] font-black leading-snug text-[#1b3f8f]">Урок {lessonStep}. {lessonTitle}</p>

          <div
            className="relative mt-2.5 flex h-[148px] items-center justify-center overflow-hidden rounded-[20px]"
            style={{ background: 'linear-gradient(160deg,#efe3ff 0%,#dcebff 45%,#ffe9d6 100%)' }}
          >
            <span aria-hidden className="absolute left-[8%] top-[14%] text-[15px] text-[#f6c84c] [animation:lessonResultFloat_2600ms_ease-in-out_infinite]">★</span>
            <span aria-hidden className="absolute right-[10%] top-[20%] text-[11px] text-[#8fd6ff] [animation:lessonResultFloat_2200ms_ease-in-out_infinite_.3s]">★</span>
            <span aria-hidden className="absolute bottom-[12%] left-[14%] text-[11px] text-[#ff9ecb] [animation:lessonResultFloat_2400ms_ease-in-out_infinite_.5s]">★</span>
            <img src={coinsStackIcon} alt="" className="absolute right-[9%] bottom-[14%] h-7 w-7 object-contain drop-shadow [animation:lessonResultFloat_2800ms_ease-in-out_infinite_.2s]" />
            <img
              src={character.mainImage}
              alt=""
              className="relative z-10 h-[92%] object-contain drop-shadow-[0_10px_18px_rgba(60,45,120,.28)] [animation:lessonResultPop_460ms_cubic-bezier(.34,1.56,.64,1)]"
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatTile icon={checkIcon} top="Правильных решений" bottom={`${correctCount} из ${totalCount}`} bottomColor="#1f8a3f" />
            <StatTile icon={coinsStackIcon} top="монет" bottom={`+${coinsEarned}`} bottomColor="#c9862a" />
            <StatTile icon={xpStarIcon} top="XP" bottom={`+${xpEarned} XP`} bottomColor="#5d4bd1" />
            <StatTile icon={targetIcon} top="Навык" bottom={skillName} />
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-[16px] bg-[#e6f7ea] px-3 py-2.5">
            <span aria-hidden className="text-[16px] leading-none">🌱</span>
            <p className="flex-1 text-[12px] font-bold leading-snug text-[#1f6f3a]">{outcomeText}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onBackToList}
            className="flex h-14 w-full items-center justify-center gap-1.5 rounded-[26px] bg-gradient-to-b from-[#8379ff] via-[#6b61f4] to-[#5044e8] text-[16px] font-extrabold text-white shadow-[0_7px_18px_rgba(80,65,215,.38)] transition active:scale-[.98]"
          >
            <IconGrid className="h-4 w-4" />
            К урокам
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[26px] bg-[#efeaf7] text-[14px] font-extrabold text-[#5d57c9] transition active:scale-[.98]"
          >
            <IconRefresh className="h-4 w-4" />
            Повторить
          </button>
        </div>
      </div>
    </div>
  );
}
