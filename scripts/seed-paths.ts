/** Nombres de archivo de la semilla. Modulo aparte para poder importarlo
 *  sin disparar el render. */
import { slugify } from '@/lib/slug';

export { slugify };

export type SeedView = 'frente' | 'espalda' | 'detalle';

export function assetPath(productSlug: string, colorName: string, view: SeedView): string {
  return `/seed/${productSlug}-${slugify(colorName)}-${view}.png`;
}
