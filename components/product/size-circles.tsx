'use client';

import type { GarmentSize } from '@/lib/supabase/database.types';

export type SizeOption = { size: GarmentSize; available: boolean };

/**
 * Tallas en círculos. Las agotadas quedan deshabilitadas de verdad
 * (`disabled` + `aria-disabled`), no solo atenuadas.
 */
export function SizeCircles({
  sizes,
  value,
  onChange,
  label = 'Tallas',
  className = '',
}: {
  sizes: SizeOption[];
  value?: GarmentSize | null;
  onChange?: (size: GarmentSize) => void;
  label?: string;
  className?: string;
}) {
  const readOnly = onChange === undefined;

  return (
    <div
      role={readOnly ? 'list' : 'radiogroup'}
      aria-label={label}
      className={`flex flex-wrap gap-1.5 ${className}`}
    >
      {sizes.map(({ size, available }) => {
        const selected = value === size;
        const classes = `grid size-10 place-items-center rounded-full border text-sm transition
          border-[var(--ambient-hairline)]
          ${selected ? 'border-[var(--ambient-fg)] bg-[var(--ambient-fg)] text-[var(--ambient)]' : ''}
          ${available ? '' : 'line-through opacity-35'}`;

        if (readOnly) {
          return (
            <span
              key={size}
              role="listitem"
              className={classes}
              title={available ? undefined : 'Agotada'}
            >
              {size}
            </span>
          );
        }

        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={!available}
            disabled={!available}
            onClick={() => onChange(size)}
            title={available ? undefined : 'Agotada'}
            className={`${classes} disabled:cursor-not-allowed hover:border-[var(--ambient-fg)]`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
