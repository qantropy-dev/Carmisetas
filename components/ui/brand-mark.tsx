import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/tokens';

/** Proporciones reales de cada máscara (las calcula `npm run brand`). */
const RATIO = {
  wordmark: 16.2241,
  isotipo: 0.4346,
  monograma: 1.3488,
} as const;

type Piece = keyof typeof RATIO;

/**
 * El logotipo, pintado como máscara.
 *
 * El archivo no lleva color: lleva la forma en el canal alfa. Se pinta con
 * `currentColor`, así que el logo adopta el color del escenario en el que esté
 * —y en este sitio ese color cambia con cada prenda—. Con un PNG de color fijo
 * harían falta dos versiones y acertar cuál toca en cada fondo.
 */
function Mask({ piece, height, className = '' }: { piece: Piece; height: number; className?: string }) {
  const url = `url(/brand/${piece}.png)`;
  return (
    <span
      aria-hidden
      className={`block shrink-0 ${className}`}
      style={{
        height,
        width: height * RATIO[piece],
        backgroundColor: 'currentColor',
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}

/** Lockup horizontal: el piloto y el logotipo. */
export function BrandMark({
  height = 14,
  withIsotipo = true,
  className = '',
}: {
  height?: number;
  withIsotipo?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {withIsotipo ? <Mask piece="isotipo" height={height * 2.4} /> : null}
      <Mask piece="wordmark" height={height} />
      <span className="sr-only">
        {BRAND_NAME} · {BRAND_TAGLINE}
      </span>
    </span>
  );
}

export function BrandMonogram({ height = 22, className = '' }: { height?: number; className?: string }) {
  return (
    <span className={`inline-flex ${className}`}>
      <Mask piece="monograma" height={height} />
      <span className="sr-only">{BRAND_NAME}</span>
    </span>
  );
}

export { RATIO as BRAND_RATIO };
