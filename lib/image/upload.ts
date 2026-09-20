'use client';

import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/slug';

export const BUCKET = 'products';

/**
 * Sube desde el navegador directamente a Storage. El archivo no pasa por
 * nuestro servidor: en una subida desde el celular eso es la diferencia entre
 * unos segundos y una eternidad. El RLS del bucket exige que sea admin.
 */
export async function uploadToStorage(
  blob: Blob,
  options: { productSlug: string; colorName: string | null; view: string; extension: string },
): Promise<string> {
  const supabase = createClient();
  const folder = [slugify(options.productSlug), slugify(options.colorName ?? 'general')].join('/');
  const name = `${options.view}-${Date.now().toString(36)}.${options.extension}`;
  const path = `${folder}/${name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    throw new Error(
      error.message.includes('row-level security')
        ? 'Tu cuenta no tiene permiso para subir imágenes.'
        : `No se pudo subir: ${error.message}`,
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Borra el archivo de Storage cuando se elimina la fila que lo apuntaba. */
export async function removeFromStorage(publicUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const at = publicUrl.indexOf(marker);
  if (at === -1) return; // No es nuestro (p. ej. una imagen de la semilla).
  const path = publicUrl.slice(at + marker.length);
  await createClient().storage.from(BUCKET).remove([path]);
}
