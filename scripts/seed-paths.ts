/** Nombres de archivo de la semilla. Modulo aparte para poder importarlo
 *  sin disparar el render. */
export type SeedView = 'frente' | 'espalda' | 'detalle';

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function assetPath(productSlug: string, colorName: string, view: SeedView): string {
  return `/seed/${productSlug}-${slugify(colorName)}-${view}.png`;
}
