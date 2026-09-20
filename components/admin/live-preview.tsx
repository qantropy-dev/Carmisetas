'use client';

import Image from 'next/image';
import { ambientTokens } from '@/lib/color';
import { effectivePrice, resolvePrice } from '@/lib/pricing';
import {
  GARMENT_SIZES,
  type ProductColorRow,
  type ProductVariantRow,
} from '@/lib/supabase/database.types';

/**
 * Lo que verá el cliente, con los valores que hay ahora mismo en el formulario.
 * No es una maqueta aparte: usa los mismos `ambientTokens` y el mismo
 * `resolvePrice` que el sitio público, así que si aquí se ve mal, allá también.
 */
export function LivePreview({
  name,
  headline,
  basePrice,
  compareAtPrice,
  colors,
  variants,
  selectedColorId,
  onSelectColor,
}: {
  name: string;
  headline: string;
  basePrice: number;
  compareAtPrice: number | null;
  colors: ProductColorRow[];
  variants: ProductVariantRow[];
  selectedColorId: string | null;
  onSelectColor: (id: string) => void;
}) {
  const color = colors.find((c) => c.id === selectedColorId) ?? colors[0] ?? null;
  const mine = variants.filter((v) => v.color_id === color?.id);
  const from = mine.length
    ? Math.min(...mine.map((v) => effectivePrice({ basePrice, priceOverride: v.price_override })))
    : basePrice;
  const price = resolvePrice({ basePrice: from, compareAtPrice });

  return (
    <div
      className="stage flex flex-col items-center gap-4 rounded-3xl px-5 py-7"
      style={ambientTokens(color?.ambient_hex ?? '#E6E1D8') as React.CSSProperties}
    >
      <div className="grid h-44 w-full place-items-center">
        {color?.cutout_url ? (
          <Image
            src={color.cutout_url}
            alt=""
            width={320}
            height={410}
            className="float-idle max-h-44 w-auto object-contain
                       drop-shadow-[0_14px_20px_var(--ambient-shadow)]"
          />
        ) : (
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--ambient-muted)]">
            Falta el recorte
          </p>
        )}
      </div>

      <div className="text-center">
        <h3 className="text-2xl uppercase">{name || 'Sin nombre'}</h3>
        {headline ? (
          <p className="mt-1 text-sm text-[var(--ambient-muted)]">{headline}</p>
        ) : null}
      </div>

      <p className="flex items-baseline gap-2">
        {price.compareAtLabel ? (
          <span className="text-sm line-through opacity-55">{price.compareAtLabel}</span>
        ) : null}
        {price.discountPercent !== null ? (
          <span className="text-sm">−{price.discountPercent}%</span>
        ) : null}
        <span className="text-2xl font-semibold tabular-nums">{price.finalLabel}</span>
      </p>

      <div className="flex gap-1.5">
        {GARMENT_SIZES.map((size) => {
          const variant = mine.find((v) => v.size === size);
          const out = !variant || !variant.is_active || variant.stock_status === 'agotado';
          return (
            <span
              key={size}
              className={`grid size-8 place-items-center rounded-full border text-xs
                          border-[var(--ambient-hairline)] ${out ? 'line-through opacity-35' : ''}`}
            >
              {size}
            </span>
          );
        })}
      </div>

      {colors.length > 1 ? (
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectColor(c.id)}
              aria-label={`Ver ${c.color_name}`}
              aria-pressed={c.id === color?.id}
              className={`size-6 rounded-full border transition
                          ${c.id === color?.id ? 'border-[var(--ambient-fg)]' : 'border-[var(--ambient-hairline)]'}`}
              style={{ backgroundColor: c.swatch_hex }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
