'use client';

import { useMemo, useState } from 'react';
import { BentoCard } from '@/components/bento-grid/bento-card';
import { EmptyState } from '@/components/ui/empty-state';
import { slugify } from '@/lib/slug';
import type { Garment } from '@/lib/queries/products';
import type { CategoryRow } from '@/lib/supabase/database.types';

/**
 * Grilla bento: las destacadas ocupan el doble de ancho y alto. Se filtra en el
 * cliente porque el catálogo cabe entero en memoria y así el buscador responde
 * sin esperar al servidor.
 */
export function BentoGrid({
  products,
  categories,
}: {
  products: Garment[];
  categories: CategoryRow[];
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const needle = slugify(search);
  const visible = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.categorySlug !== category) return false;
        if (needle && !slugify(`${p.name} ${p.colorName}`).includes(needle)) return false;
        return true;
      }),
    [products, category, needle],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">Buscar prenda</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar"
            className="min-h-12 w-full rounded-[var(--radius-pill)] border bg-transparent pl-11 pr-4
                       text-base outline-none transition-colors
                       border-[var(--ambient-hairline)] placeholder:text-[var(--ambient-muted)]
                       focus-visible:border-[var(--ambient-fg)] sm:text-sm"
          />
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 opacity-55"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="7" cy="7" r="4.6" />
            <path d="m10.6 10.6 3 3" strokeLinecap="round" />
          </svg>
        </label>

        {/* Chips circulares de categoría. */}
        <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
          <CategoryChip
            label="Todo"
            initial="·"
            on={category === null}
            onClick={() => setCategory(null)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              initial={c.name.slice(0, 1)}
              on={category === c.slug}
              onClick={() => setCategory(category === c.slug ? null : c.slug)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--ambient-muted)]" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'prenda' : 'prendas'}
      </p>

      {visible.length === 0 ? (
        <EmptyState
          title="Nada por aquí"
          detail="Prueba con otra palabra, o quita el filtro de categoría."
        />
      ) : (
        <div className="grid auto-rows-min grid-cols-2 gap-3 sm:grid-cols-4">
          {visible.map((product, i) => (
            <BentoCard
              key={product.id}
              product={product}
              large={product.isFeatured}
              priority={i < 2}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  initial,
  on,
  onClick,
}: {
  label: string;
  initial: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex shrink-0 flex-col items-center gap-1.5"
    >
      <span
        className={`grid size-14 place-items-center rounded-full border font-display text-lg
                    transition-colors
                    ${on
                      ? 'border-[var(--ambient-fg)] bg-[var(--ambient-fg)] text-[var(--ambient)]'
                      : 'border-[var(--ambient-hairline)]'}`}
      >
        {initial}
      </span>
      <span className={`text-[11px] ${on ? '' : 'text-[var(--ambient-muted)]'}`}>{label}</span>
    </button>
  );
}
