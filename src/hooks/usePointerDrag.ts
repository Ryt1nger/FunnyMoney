import { useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

// Сдвиг пальца в пикселях, начиная с которого жест считается перетаскиванием,
// а не простым тапом. Меньше — и обычный тап по карточке (выбор/клик)
// иногда ошибочно попадал бы в "дроп" на самого себя.
const DRAG_THRESHOLD = 10;

export interface DragPoint {
  id: string;
  /** Индекс слота/корзины, откуда взяли карточку (для перемещений между слотами). */
  from: number | null;
  /** Текущая позиция пальца, в координатах rootRef — для плавающей копии карточки. */
  x: number;
  y: number;
  startX: number;
  startY: number;
  /** true, если палец сдвинулся дальше DRAG_THRESHOLD — то есть это реальный drag. */
  moved: boolean;
}

/**
 * Перетаскивание карточек в упражнениях уроков — та же техника, что и
 * кормление питомца на кухне (Kitchen.tsx): Pointer Events + setPointerCapture,
 * БЕЗ нативного HTML5 drag-and-drop (draggable/onDragStart/onDrop). HTML5 DnD
 * рассчитан на мышь и на Android WebView почти не работает без долгого
 * нажатия — из-за этого карточки не переносились нормально одним движением
 * пальца.
 *
 * Опускание карточки ищет цель через
 * document.elementFromPoint(...).closest('[data-drop]') — так один
 * обработчик обслуживает любое число зон на сцене без хранения их ref'ов:
 * каждая зона просто помечается атрибутом data-drop="<ключ>".
 *
 * Простой тап (сдвиг пальца меньше DRAG_THRESHOLD) не считается
 * перетаскиванием — onDrop не вызывается, и срабатывает обычный onClick
 * карточки (выбор/действие по умолчанию), как и было раньше.
 */
export function usePointerDrag(rootRef: RefObject<HTMLElement | null>) {
  const [drag, setDrag] = useState<DragPoint | null>(null);

  function toLocal(clientX: number, clientY: number) {
    const rect = rootRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }

  function start(e: ReactPointerEvent, id: string, from: number | null = null) {
    // Не даём жесту всплыть выше — иначе родительский свайп/шторка может
    // перехватить перетаскивание карточки за свой собственный жест.
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const local = toLocal(e.clientX, e.clientY);
    setDrag({ id, from, ...local, startX: e.clientX, startY: e.clientY, moved: false });
  }

  function move(e: ReactPointerEvent) {
    setDrag((current) => {
      if (!current) return current;
      const local = toLocal(e.clientX, e.clientY);
      const dx = e.clientX - current.startX;
      const dy = e.clientY - current.startY;
      const moved = current.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD;
      return { ...current, ...local, moved };
    });
  }

  function end(e: ReactPointerEvent, onDrop: (id: string, from: number | null, zone: string | null) => void) {
    setDrag((current) => {
      if (!current) return null;
      if (current.moved) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const zoneEl = el?.closest<HTMLElement>('[data-drop]');
        onDrop(current.id, current.from, zoneEl?.dataset.drop ?? null);
      }
      return null;
    });
  }

  function cancel() {
    setDrag(null);
  }

  return { drag, start, move, end, cancel };
}
