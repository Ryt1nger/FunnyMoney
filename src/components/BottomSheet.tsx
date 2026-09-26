import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  /** true — свайп вниз не закрывает шторку (например, во время урока) */
  swipeDisabled?: boolean;
  children: ReactNode;
}

// Сколько нужно свайпнуть вниз (px), чтобы шторка закрылась.
const SWIPE_CLOSE_THRESHOLD = 70;
// Порог, после которого жест уже считается «начался» (иначе любой тап/тряска считался бы жестом).
const SWIPE_START_THRESHOLD = 6;

interface DragInfo {
  startX: number;
  startY: number;
  lastDy: number;
  /** null, пока не решили, что это жест закрытия (а не обычный скролл/тап) */
  tracking: boolean;
  /** ближайший скроллящийся родитель под пальцем — если он не наверху, это его скролл, не наш свайп */
  scrollable: HTMLElement | null;
}

function findScrollableAncestor(el: Element | null, root: HTMLElement | null): HTMLElement | null {
  let node = el as HTMLElement | null;
  while (node && node !== root && node !== document.body) {
    const style = getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Шторка, выезжающая снизу вверх. Навигация остаётся видимой под ней.
 * Свайп вниз закрывает шторку — но только если под пальцем нет скроллящегося
 * контента, который ещё не докручен до верха (иначе обычная прокрутка списка
 * вниз... то есть вверх по контенту работала бы через раз как закрытие).
 */
export default function BottomSheet({ open, onClose, swipeDisabled = false, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), 440);
    return () => clearTimeout(t);
  }, [open]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Во время урока жест закрытия отключён целиком. Перетаскивание карточек
    // внутри урока этим не затрагивается: оно живёт на самих карточках.
    if (swipeDisabled) {
      dragRef.current = null;
      return;
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastDy: 0,
      tracking: false,
      scrollable: findScrollableAncestor(e.target as Element, sheetRef.current),
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    const dx = e.clientX - d.startX;

    if (!d.tracking) {
      if (Math.abs(dy) < SWIPE_START_THRESHOLD && Math.abs(dx) < SWIPE_START_THRESHOLD) return;
      // Не преимущественно вертикальный жест — не наш случай (горизонтальный
      // скролл ленты еды на кухне и т.п.), перестаём следить вовсе.
      if (Math.abs(dx) > Math.abs(dy)) {
        dragRef.current = null;
        return;
      }
      // Тянут вниз, но под пальцем список, ещё не докрученный до верха —
      // это его собственная прокрутка, а не жест закрытия шторки.
      if (dy > 0 && d.scrollable && d.scrollable.scrollTop > 0) {
        dragRef.current = null;
        return;
      }
      // Тянут вверх — закрытие свайпом вниз не про это, оставляем как обычный скролл.
      if (dy < 0) {
        dragRef.current = null;
        return;
      }
      d.tracking = true;
    }

    d.lastDy = dy;
  }

  function handlePointerUp() {
    const d = dragRef.current;
    dragRef.current = null;
    if (d?.tracking && d.lastDy > SWIPE_CLOSE_THRESHOLD) onClose();
  }

  if (!mounted) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 z-30 bg-black/35 transition-opacity duration-300"
        style={{ opacity: shown ? 1 : 0 }}
      />
      <div
        ref={sheetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        className="absolute inset-0 z-40 touch-pan-y overflow-hidden rounded-t-[26px] shadow-2xl transition-transform duration-[420ms]"
        style={{
          transform: shown ? 'translateY(0)' : 'translateY(100%)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {children}
      </div>
    </>
  );
}
