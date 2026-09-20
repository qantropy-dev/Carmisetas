import type { ResolvedPrice } from '@/lib/pricing';

/**
 * Precio, tachado y porcentaje de descuento. Una sola pieza para el hero, el
 * perchero, la grilla y la ficha: el precio se ve igual en todo el sitio.
 */
export function PriceTag({
  price,
  size = 'md',
  align = 'start',
  className = '',
}: {
  price: ResolvedPrice;
  size?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'end';
  className?: string;
}) {
  const scale = {
    sm: 'text-base',
    md: 'text-2xl',
    // Escala con el ancho: a 390 px, un text-5xl fijo parte el número en dos.
    lg: 'text-[clamp(1.55rem,6.6vw,3rem)]',
  }[size];

  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-1 ${
        align === 'end' ? 'justify-end' : ''
      } ${className}`}
    >
      {price.compareAtLabel ? (
        <span className="text-sm tabular-nums opacity-55 line-through">
          <span className="sr-only">Antes </span>
          {price.compareAtLabel}
        </span>
      ) : null}

      {price.discountPercent !== null ? (
        <span className="text-sm font-medium">−{price.discountPercent}%</span>
      ) : null}

      <span
        className={`whitespace-nowrap font-display font-semibold tracking-tight tabular-nums ${scale}`}
      >
        {price.finalLabel}
      </span>
    </p>
  );
}
