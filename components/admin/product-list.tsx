'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { reorder, setFlag } from '@/app/admin/(panel)/prendas/actions';
import { SortableList } from '@/components/admin/sortable-list';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/empty-state';
import type { AdminProductRow } from '@/lib/queries/admin';
import type { CategoryRow } from '@/lib/supabase/database.types';
import { slugify } from '@/lib/slug';

type Status = 'todas' | 'activas' | 'ocultas' | 'destacadas';

const STATUSES: { value: Status; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'activas', label: 'Activas' },
  { value: 'ocultas', label: 'Ocultas' },
  { value: 'destacadas', label: 'Destacadas' },
];

type Flags = { isActive: boolean; isFeatured: boolean };

export function ProductList({
  products,
  categories,
}: {
  products: AdminProductRow[];
  categories: CategoryRow[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status>('todas');
  const [category, setCategory] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  // El interruptor tiene que responder al instante en el celular; el servidor
  // confirma después y `revalidatePath` corrige si algo falló.
  const [flags, setOptimisticFlag] = useOptimistic(
    Object.fromEntries(
      products.map((p) => [p.id, { isActive: p.isActive, isFeatured: p.isFeatured }]),
    ) as Record<string, Flags>,
    (state, patch: { id: string; field: keyof Flags; value: boolean }) => ({
      ...state,
      [patch.id]: { ...(state[patch.id] as Flags), [patch.field]: patch.value },
    }),
  );

  const ordered = useMemo(() => {
    if (!order) return products;
    const byId = new Map(products.map((p) => [p.id, p]));
    return order.flatMap((id) => {
      const found = byId.get(id);
      return found ? [found] : [];
    });
  }, [products, order]);

  const needle = slugify(search);
  const filtering = needle !== '' || status !== 'todas' || category !== null;

  const visible = ordered.filter((p) => {
    if (category && p.categoryId !== category) return false;
    const f = flags[p.id] ?? { isActive: p.isActive, isFeatured: p.isFeatured };
    if (status === 'activas' && !f.isActive) return false;
    if (status === 'ocultas' && f.isActive) return false;
    if (status === 'destacadas' && !f.isFeatured) return false;
    if (needle && !slugify(`${p.name} ${p.slug}`).includes(needle)) return false;
    return true;
  });

  function handleReorder(ids: string[]) {
    setOrder(ids);
    startTransition(async () => {
      await reorder('products', ids);
    });
  }

  function handleFlag(id: string, field: keyof Flags, value: boolean) {
    startTransition(async () => {
      setOptimisticFlag({ id, field, value });
      await setFlag(id, field === 'isActive' ? 'is_active' : 'is_featured', value);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar prenda"
          aria-label="Buscar prenda"
          className="min-h-11 w-full rounded-[var(--radius-pill)] border border-muted/30 bg-transparent
                     px-4 text-base outline-none focus-visible:border-fg sm:text-sm"
        />

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {STATUSES.map((s) => (
            <Chip key={s.value} on={status === s.value} onClick={() => setStatus(s.value)}>
              {s.label}
            </Chip>
          ))}
          <span aria-hidden className="mx-1 w-px shrink-0 bg-muted/25" />
          {categories.map((c) => (
            <Chip
              key={c.id}
              on={category === c.id}
              onClick={() => setCategory(category === c.id ? null : c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted" aria-live="polite">
        {visible.length} de {products.length}
        {filtering ? ' · el orden por arrastre se desactiva mientras filtras' : ' · arrastra para reordenar'}
        {pending ? ' · guardando…' : ''}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          title="Ninguna prenda coincide"
          detail="Prueba con otro texto, o quita los filtros."
        />
      ) : (
        <SortableList items={visible} onReorder={handleReorder} disabled={filtering}>
          {(p, handle) => {
            const f = flags[p.id] ?? { isActive: p.isActive, isFeatured: p.isFeatured };
            return (
              <article
                className={`flex items-center gap-2 rounded-2xl border border-muted/20 bg-bg p-2
                            transition-opacity ${f.isActive ? '' : 'opacity-55'}`}
              >
                {handle}

                <Link
                  href={`/admin/prendas/${p.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1"
                >
                  <span
                    className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl"
                    style={{ backgroundColor: p.colors[0]?.ambientHex ?? 'transparent' }}
                  >
                    {p.colors[0]?.cutoutUrl ? (
                      <Image
                        src={p.colors[0].cutoutUrl}
                        alt=""
                        width={96}
                        height={123}
                        className="size-9 object-contain"
                      />
                    ) : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{p.name}</span>
                      {f.isFeatured ? (
                        <span
                          aria-label="Destacada"
                          title="Destacada"
                          className="size-1.5 shrink-0 rounded-full bg-accent"
                        />
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      <span className="tabular-nums">{p.price.finalLabel}</span>
                      {p.categoryName ? <span>· {p.categoryName}</span> : null}
                      <span>
                        · {p.inStock}/{p.totalVariants} tallas
                      </span>
                    </span>
                  </span>

                  <span className="hidden shrink-0 gap-1 sm:flex">
                    {p.colors.slice(0, 4).map((c) => (
                      <span
                        key={c.id}
                        title={c.name}
                        className="size-4 rounded-full border border-muted/30"
                        style={{ backgroundColor: c.swatchHex }}
                      />
                    ))}
                  </span>
                </Link>

                <div className="flex shrink-0 flex-col items-center gap-1.5 pr-1">
                  <Switch
                    checked={f.isActive}
                    onChange={(v) => handleFlag(p.id, 'isActive', v)}
                    label={`${p.name}: visible en la tienda`}
                  />
                  <Switch
                    checked={f.isFeatured}
                    onChange={(v) => handleFlag(p.id, 'isFeatured', v)}
                    label={`${p.name}: destacada en el hero`}
                  />
                </div>
              </article>
            );
          }}
        </SortableList>
      )}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-9 shrink-0 rounded-[var(--radius-pill)] px-3.5 text-sm transition
                  ${on ? 'bg-fg text-bg' : 'border border-muted/30 text-muted hover:text-fg'}`}
    >
      {children}
    </button>
  );
}
