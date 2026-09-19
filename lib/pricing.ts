/**
 * Precios en COP como enteros (sin decimales), formateados en es-CO.
 * Espeja `public.effective_price` en la base para que UI y datos no se separen.
 */

export type PriceInput = {
  basePrice: number;
  priceOverride?: number | null;
  compareAtPrice?: number | null;
};

/** Precio final = price_override ?? base_price. */
export function effectivePrice({ basePrice, priceOverride }: PriceInput): number {
  return priceOverride ?? basePrice;
}

/**
 * Descuento redondeado hacia abajo, o null si no hay tachado real.
 * Solo cuenta si compare_at_price supera al precio final.
 */
export function discountPercent(input: PriceInput): number | null {
  const final = effectivePrice(input);
  const compare = input.compareAtPrice;
  if (!compare || compare <= final) return null;
  return Math.floor(((compare - final) / compare) * 100);
}

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** 89900 -> "$ 89.900" */
export function formatCOP(amount: number): string {
  // Intl produce "$ 89.900" con NBSP; lo normalizamos a un espacio fino estable.
  return COP.format(Math.round(amount)).replace(/ /g, ' ');
}

export type ResolvedPrice = {
  final: number;
  finalLabel: string;
  compareAt: number | null;
  compareAtLabel: string | null;
  discountPercent: number | null;
};

/** Todo lo que necesita un <PriceTag/> en un solo objeto. */
export function resolvePrice(input: PriceInput): ResolvedPrice {
  const final = effectivePrice(input);
  const pct = discountPercent(input);
  const compareAt = pct === null ? null : (input.compareAtPrice ?? null);
  return {
    final,
    finalLabel: formatCOP(final),
    compareAt,
    compareAtLabel: compareAt === null ? null : formatCOP(compareAt),
    discountPercent: pct,
  };
}
