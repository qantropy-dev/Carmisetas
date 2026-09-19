/**
 * PALETA DE MARCA — fuente unica de verdad.
 *
 * Esto es lo unico que hay que tocar cuando la marca defina su paleta.
 * `app/layout.tsx` emite estos valores como custom properties en :root y
 * `app/globals.css` nunca escribe un color literal: solo consume var(--brand-*).
 * `lib/color.ts` los lee para calcular contraste sobre el color ambiental.
 *
 * Son neutros a proposito: el protagonista es la prenda, no la interfaz.
 */
export const BRAND = {
  /** Fondo por defecto fuera del escenario ambiental. */
  bg: '#FAF8F5',
  /** Tinta principal. */
  fg: '#14120F',
  /** Unico acento; se usa con cuentagotas (precio, subrayado de talla activa). */
  accent: '#8A6A4B',
  /** Texto secundario, bordes, metadatos. */
  muted: '#7A756D',
} as const;

export type BrandToken = keyof typeof BRAND;

/** Candidatos de texto sobre el color ambiental de una prenda. */
export const AMBIENT_FOREGROUNDS = [BRAND.fg, BRAND.bg] as const;
