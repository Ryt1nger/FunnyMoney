import { useEffect, useRef, useState } from 'react';

interface Props {
  /** null/пусто — подсказка скрыта. Смена текста при уже открытой подсказке
   * просто обновляет содержимое без анимации выхода. */
  text: string | null;
}

const LEAVE_MS = 200;

/** Плашка подсказки в практике урока — то же место/вид во всех уроках
 * (вынесено сюда, чтобы не дублировать в 6 файлах). Раньше пропадала рывком
 * (условный рендер `{hintText && (...)}` размонтировал её мгновенно вместе с
 * setHintText(null) по таймеру/смене сцены/повторному тапу) — теперь плавно
 * гаснет и уезжает вниз, и только после этого убирается из DOM. */
export default function LessonHintBubble({ text }: Props) {
  const [rendered, setRendered] = useState(text);
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (text) {
      if (leaveTimer.current) {
        clearTimeout(leaveTimer.current);
        leaveTimer.current = null;
      }
      setRendered(text);
      setLeaving(false);
      return;
    }
    if (rendered) {
      setLeaving(true);
      leaveTimer.current = setTimeout(() => {
        setRendered(null);
        setLeaving(false);
      }, LEAVE_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  }, []);

  if (!rendered) return null;

  return (
    <>
      <style>{`@keyframes lessonHintIn{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes lessonHintOut{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(6px) scale(.98)}}`}</style>
      <div
        className="absolute bottom-[22%] left-[6%] right-[6%] z-20 rounded-2xl bg-[#fff3cd] px-4 py-2 text-center text-[clamp(11px,3.2vw,13px)] font-bold text-[#7a5b13] shadow-[0_4px_12px_rgba(120,90,20,.2)]"
        style={{ animation: leaving ? `lessonHintOut ${LEAVE_MS}ms ease-in forwards` : 'lessonHintIn 200ms ease-out' }}
      >
        💡 {rendered}
      </div>
    </>
  );
}
