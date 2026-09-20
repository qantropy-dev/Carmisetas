/**
 * PALETA DE MARCA — fuente unica de verdad.
 *
 * Los valores salen de la lamina de identidad (brand/carmisetas-identidad.jpg):
 * el crema del papel y el negro de la tinta, muestreados del original.
 *
 * Esto es lo unico que hay que tocar para cambiar la paleta.
 * `app/layout.tsx` emite estos valores como custom properties en :root y
 * `app/globals.css` nunca escribe un color literal: solo consume var(--brand-*).
 * `lib/color.ts` los lee para calcular contraste sobre el color ambiental.
 *
 * Son neutros a proposito: el protagonista es la prenda, no la interfaz.
 */
export const BRAND = {
  /** Crema de la lamina. Fondo por defecto fuera del escenario ambiental. */
  bg: '#F7F2EC',
  /** Negro de la tinta del logotipo. */
  fg: '#121011',
  /** Unico acento; se usa con cuentagotas (descuento, talla activa, avisos). */
  accent: '#8A6A4B',
  /** Texto secundario, bordes, metadatos. */
  muted: '#6E6A64',
} as const;

export type BrandToken = keyof typeof BRAND;

/** Candidatos de texto sobre el color ambiental de una prenda. */
export const AMBIENT_FOREGROUNDS = [BRAND.fg, BRAND.bg] as const;

/** Nombre y bajada, para metadatos y para el propio logotipo. */
export const BRAND_NAME = 'Carmisetas';
export const BRAND_TAGLINE = 'Automotive Artwear';
