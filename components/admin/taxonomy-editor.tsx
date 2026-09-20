'use client';

import { useActionState, useState, useTransition } from 'react';
import { removeTaxonomy, saveTaxonomy } from '@/app/admin/(panel)/colecciones/actions';
import { reorder } from '@/app/admin/(panel)/prendas/actions';
import { SortableList } from '@/components/admin/sortable-list';
import { Button } from '@/components/ui/button';
import { inputClass } from '@/components/ui/field';
import { Status } from '@/components/ui/status';
import { IDLE, type ActionState } from '@/lib/actions';
import { slugify } from '@/lib/slug';
import type { CategoryRow } from '@/lib/supabase/database.types';

export function TaxonomyEditor({
  entity,
  title,
  hint,
  items,
}: {
  entity: 'categories' | 'collections';
  title: string;
  hint: string;
  items: CategoryRow[];
}) {
  const [state, action, pending] = useActionState(saveTaxonomy, IDLE);
  const [notice, setNotice] = useState<ActionState>(IDLE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [, startTransition] = useTransition();
  const [name, setName] = useState('');

  const ordered = order
    ? order.flatMap((id) => {
        const found = items.find((i) => i.id === id);
        return found ? [found] : [];
      })
    : items;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl">{title}</h2>
        <p className="text-sm text-muted">{hint}</p>
      </div>

      {ordered.length > 0 ? (
        <SortableList
          items={ordered}
          onReorder={(ids) => {
            setOrder(ids);
            startTransition(async () => {
              await reorder(entity, ids);
            });
          }}
        >
          {(item, handle) => (
            <div className="flex items-center gap-1 rounded-2xl border border-muted/20 p-2">
              {handle}
              {editingId === item.id ? (
                <Row item={item} onDone={() => setEditingId(null)} />
              ) : (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{item.name}</span>
                    <span className="block truncate font-mono text-xs text-muted">{item.slug}</span>
                  </span>
                  <Button type="button" variant="quiet" onClick={() => setEditingId(item.id)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() =>
                      startTransition(async () => setNotice(await removeTaxonomy(entity, item.id)))
                    }
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          )}
        </SortableList>
      ) : (
        <p className="rounded-xl border border-dashed border-muted/30 px-4 py-5 text-center text-sm text-muted">
          Todavía no hay ninguna.
        </p>
      )}

      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="entity" value={entity} />
        <input type="hidden" name="slug" value={slugify(name)} />
        <label className="min-w-0 flex-1">
          <span className="sr-only">Nombre</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={entity === 'categories' ? 'Camisetas' : 'Esencial'}
            className={inputClass}
            required
          />
        </label>
        <Button type="submit" disabled={pending || name.trim().length < 2}>
          Agregar
        </Button>
      </form>

      <Status state={state} />
      <Status state={notice} />
    </section>
  );

  function Row({ item, onDone }: { item: CategoryRow; onDone: () => void }) {
    const [rowState, rowAction, rowPending] = useActionState(saveTaxonomy, IDLE);
    const [value, setValue] = useState(item.name);

    if (rowState.ok) onDone();

    return (
      <form action={rowAction} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <input type="hidden" name="entity" value={entity} />
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="slug" value={slugify(value)} />
        <input
          name="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputClass} min-w-0 flex-1`}
          required
          autoFocus
        />
        <Button type="submit" variant="solid" disabled={rowPending}>
          Guardar
        </Button>
        <Button type="button" variant="quiet" onClick={onDone}>
          Cancelar
        </Button>
      </form>
    );
  }
}
