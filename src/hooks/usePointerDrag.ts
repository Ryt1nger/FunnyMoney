import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

// Сдвиг пальца в пикселях, начиная с которого жест считается перетаскиванием,
// а не простым тапом. Меньше — и обычный тап по карточке (выбор/клик)
// иногда ошибочно попадал бы в "дроп" на самого себя.
const DRAG_THRESHOLD = 10;

export type DropHandler = (id: string, from: number | null, zone: string | null) => void;

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
  /** id указателя — нужен для подстраховки на уровне window (см. ниже). */
  pointerId: number;
}

function resolveZone(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  return el?.closest<HTMLElement>('[data-drop]')?.dataset.drop ?? null;
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
 *
 * `onDrop` передаётся сюда, в сам хук (а не только в каждый вызов `end()`),
 * потому что нужен как "план Б" на уровне window — см. комментарий ниже
 * про зависающую карточку.
 */
export function usePointerDrag(rootRef: RefObject<HTMLElement | null>, onDrop: DropHandler) {
  const [drag, setDrag] = useState<DragPoint | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  // Синхронное зеркало state — чтобы обработчики на window могли прочитать
  // самое свежее значение сразу, без функционального updater'а setDrag
  // (там нельзя было бы синхронно вызвать onDrop как побочный эффект).
  const dragRef = useRef<DragPoint | null>(null);
  dragRef.current = drag;

  // На десктопе браузер по умолчанию пытается запустить собственный HTML5
  // drag изображения. Тогда вместо карточки захватывается только картинка и
  // Pointer Events перестают получать движение мыши. Перехватываем этот
  // нативный drag внутри упражнения — карточка всегда остаётся единым
  // интерактивным элементом, независимо от точки захвата.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const preventNativeImageDrag = (event: DragEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('img')) event.preventDefault();
    };
    root.addEventListener('dragstart', preventNativeImageDrag, true);
    return () => root.removeEventListener('dragstart', preventNativeImageDrag, true);
  }, [rootRef]);

  function toLocal(clientX: number, clientY: number) {
    const rect = rootRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }

  function start(e: ReactPointerEvent, id: string, from: number | null = null) {
    // Не даём жесту всплыть выше — иначе родительский свайп/шторка может
    // перехватить перетаскивание карточки за свой собственный жест.
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // На части WebView/Safari setPointerCapture иногда бросает исключение
      // (например, если pointerId ещё не считается "активным" браузером —
      // воспроизводится и в обычном Chrome при программной эмуляции тача).
      // Раньше это исключение обрывало start() ДО setDrag(...): палец
      // физически продолжал двигаться по экрану, а состояние жеста так и
      // оставалось пустым — move()/end() тихо ничего не делали (`if
      // (!current) return`), и карточка визуально "зависала" на месте вместо
      // того, чтобы полететь за пальцем — именно тот баг, который чинит этот
      // try/catch. Для touch-указателей браузер и так неявно продолжает
      // слать move/up тому же элементу (implicit capture из Touch Events),
      // так что сам жест от отсутствия capture не ломается — важно лишь не
      // дать исключению прервать инициализацию состояния.
    }
    const local = toLocal(e.clientX, e.clientY);
    setDrag({ id, from, ...local, startX: e.clientX, startY: e.clientY, moved: false, pointerId: e.pointerId });
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

  function end(e: ReactPointerEvent, onDropCallback: DropHandler) {
    // Гасим всплытие: иначе то же pointerup дойдёт и до window-подстраховки
    // ниже, и она попытается обработать уже обработанный здесь дроп второй
    // раз (dragRef ещё не успеет обновиться синхронно до её срабатывания).
    // Подстраховка тогда предназначена только для случаев, когда ЭТОТ
    // обработчик вовсе не получил событие (см. её комментарий).
    e.stopPropagation();
    setDrag((current) => {
      if (!current) return null;
      if (current.moved) {
        onDropCallback(current.id, current.from, resolveZone(e.clientX, e.clientY));
      }
      return null;
    });
  }

  function cancel() {
    setDrag(null);
  }

  // Подстраховка на уровне window: если по какой-то причине сама карточка не
  // получила pointerup/pointercancel (потерян capture, элемент пересоздан
  // ре-рендером и т.п.), жест всё равно завершается по отпусканию пальца
  // ГДЕ УГОДНО на экране. Без этого карточка осталась бы "приклеенной" к
  // пальцу навсегда, и помогал бы только перезаход в урок.
  // Зависимость — именно pointerId, а не весь объект drag: он меняется на
  // каждый pointermove (новые x/y), и пересоздавать window-слушатели с такой
  // частотой на каждый кадр перетаскивания не нужно.
  const dragPointerId = drag?.pointerId ?? null;
  useEffect(() => {
    if (dragPointerId === null) return;
    const pointerId = dragPointerId;

    function onWindowUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      const current = dragRef.current;
      if (!current) return;
      setDrag(null);
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      const moved = current.moved || Math.hypot(dx, dy) > DRAG_THRESHOLD;
      if (moved) onDropRef.current(current.id, current.from, resolveZone(event.clientX, event.clientY));
    }
    function onWindowCancel(event: PointerEvent) {
      if (event.pointerId !== pointerId) return;
      setDrag(null);
    }

    window.addEventListener('pointerup', onWindowUp);
    window.addEventListener('pointercancel', onWindowCancel);
    return () => {
      window.removeEventListener('pointerup', onWindowUp);
      window.removeEventListener('pointercancel', onWindowCancel);
    };
  }, [dragPointerId]);

  return { drag, start, move, end, cancel };
}
