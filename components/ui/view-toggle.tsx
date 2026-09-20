'use client';

import Link from 'next/link';

export type CatalogView = 'perchero' | 'lista';

/**
 * Cambio entre perchero y lista. Son enlaces reales, no estado de cliente: la
 * vista queda en la URL y se puede compartir o volver atrás.
 */
export function ViewToggle({ current }: { current: CatalogView }) {
  const options: { value: CatalogView; label: string }[] = [
    { value: 'perchero', label: 'Perchero' },
    { value: 'lista', label: 'Lista' },
  ];

  return (
    <div
      role="group"
      aria-label="Forma de ver el catálogo"
      className="inline-flex rounded-[var(--radius-pill)] p-1"
      style={{ backgroundColor: 'color-mix(in srgb, var(--ambient-fg) 7%, transparent)' }}
    >
      {options.map((option) => {
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={`/catalogo?vista=${option.value}`}
            scroll={false}
            aria-current={active ? 'true' : undefined}
            className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] transition-colors
              ${active
                ? 'bg-[var(--ambient-fg)] text-[var(--ambient)]'
                : 'text-[var(--ambient-muted)] hover:text-[var(--ambient-fg)]'}`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
