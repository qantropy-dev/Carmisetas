'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { PriceTag } from '@/components/product/price-tag';
import { SizeCircles } from '@/components/product/size-circles';
import { Sheet } from '@/components/ui/sheet';
import { useBag } from '@/lib/bag';
import { ambientTokens } from '@/lib/color';
import { resolvePrice } from '@/lib/pricing';
import type { Garment } from '@/lib/queries/products';
import type { GarmentSize } from '@/lib/supabase/database.types';

/**
 * Añadir a la bolsa sin salir del catálogo.
 *
 * Una prenda no se puede comprar sin talla, así que el atajo no es un botón
 * suelto: abre el selector, y de ahí a la bolsa. Para elegir color o ver las
 * fotos está la ficha, y el enlace queda a la vista.
 */
export function QuickAdd({
  garment,
  open,
  onClose,
}: {
  garment: Garment;
  open: boolean;
  onClose: () => void;
}) {
  const [size, setSize] = useState<GarmentSize | null>(null);
  const { add, setOpen } = useBag();

  const chosen = size ? garment.sizes.find((s) => s.size === size) : null;
  const price = chosen
    ? resolvePrice({ basePrice: chosen.price, compareAtPrice: garment.price.compareAt })
    : garment.price;
  const soldOut = garment.sizes.every((s) => !s.available);

  function addToBag() {
    if (!chosen?.variantId || !size) return;
    add({
      variantId: chosen.variantId,
      productId: garment.id,
      slug: garment.slug,
      name: garment.name,
      colorId: garment.colorId,
      colorName: garment.colorName,
      swatchHex: garment.swatchHex,
      size,
      unitPrice: chosen.price,
      cutoutUrl: garment.cutoutUrl,
    });
    setSize(null);
    onClose();
    setOpen(true);
  }

  return (
    <Sheet open={open} onClose={onClose} title={garment.name}>
      <div className="flex flex-col gap-5" style={ambientTokens(garment.ambientHex) as React.CSSProperties}>
        <div
          className="grid place-items-center rounded-2xl px-4 py-6"
          style={{ backgroundColor: 'var(--ambient)', color: 'var(--ambient-fg)' }}
        >
          {garment.cutoutUrl ? (
            <Image
              src={garment.cutoutUrl}
              alt=""
              width={320}
              height={410}
              sizes="220px"
              className="max-h-40 w-auto object-contain"
            />
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            {garment.colorName}
            {size ? ` · Talla ${size}` : ''}
          </p>
          <PriceTag price={price} size="md" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Elige la talla</p>
          <SizeCircles
            sizes={garment.sizes}
            value={size}
            onChange={setSize}
            className="[--ambient-hairline:var(--color-muted)] [--ambient-fg:var(--color-fg)] [--ambient:var(--color-bg)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={addToBag}
            disabled={!chosen?.variantId || soldOut}
            className="min-h-12 rounded-[var(--radius-pill)] bg-fg px-6 text-sm font-medium text-bg
                       transition-opacity disabled:opacity-40"
          >
            {soldOut ? 'Agotada' : size ? 'Agregar a la bolsa' : 'Elige una talla'}
          </button>
          <Link
            href={`/prenda/${garment.slug}`}
            className="min-h-11 text-center text-sm text-muted underline-offset-4 hover:underline"
          >
            Ver la ficha completa
          </Link>
        </div>
      </div>
    </Sheet>
  );
}
