'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useId, type ReactNode } from 'react';

/**
 * Lista ordenable por arrastre. El teclado la maneja igual: Tab hasta el asa,
 * Espacio para tomar, flechas para mover, Espacio para soltar.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  disabled,
  children,
}: {
  items: T[];
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
  children: (item: T, handle: ReactNode) => ReactNode;
}) {
  // dnd-kit numera sus descripciones accesibles con un contador de módulo, que
  // no va sincronizado entre servidor y cliente: con dos listas en la misma
  // página, la hidratación se queja. Un id estable de React lo resuelve.
  const dndId = useId();

  const sensors = useSensors(
    // 8px de holgura: en móvil, tocar para abrir no debe convertirse en arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to).map((i) => i.id));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ul className="relative flex flex-col gap-2">
          {items.map((item) => (
            <Row key={item.id} id={item.id} disabled={disabled}>
              {children}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );

  function Row({
    id,
    disabled: rowDisabled,
    children: render,
  }: {
    id: string;
    disabled?: boolean;
    children: (item: T, handle: ReactNode) => ReactNode;
  }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id,
      disabled: rowDisabled,
    });
    const item = items.find((i) => i.id === id);
    if (!item) return null;

    const handle = (
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={rowDisabled}
        aria-label="Reordenar"
        className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-lg
                   text-muted transition-colors hover:text-fg active:cursor-grabbing
                   disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden fill="currentColor">
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => <circle key={`${r}-${c}`} cx={2 + c * 8} cy={3 + r * 6} r="1.6" />),
          )}
        </svg>
      </button>
    );

    return (
      <li
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={isDragging ? 'relative z-10 opacity-90 shadow-lg' : undefined}
      >
        {render(item, handle)}
      </li>
    );
  }
}
