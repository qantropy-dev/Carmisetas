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
      style={{ backgroundColor: 'var(--ambient-veil)' }}
    >
      {options.map((option) => {
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={`/catalogo?vista=${option.value}`}
            scroll={false}
            aria-current={active ? 'true' : undefined}
            className={`flex min-h-10 items-center rounded-[var(--radius-pill)] px-3.5 text-[13px]
              transition-colors
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
