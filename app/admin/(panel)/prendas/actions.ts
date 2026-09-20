'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fail, ok, zodErrors, type ActionState } from '@/lib/actions';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { GARMENT_SIZES } from '@/lib/supabase/database.types';
import {
  colorSchema,
  imageSchema,
  productSchema,
  reorderSchema,
  toggleSchema,
  variantSchema,
} from '@/lib/validators/product';

/** Refresca panel y sitio público: un cambio de precio se ve en los dos. */
function refresh(productId?: string) {
  revalidatePath('/admin/prendas');
  if (productId) revalidatePath(`/admin/prendas/${productId}`);
  revalidatePath('/', 'layout');
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();
const bool = (fd: FormData, key: string) => fd.get(key) === 'true' || fd.get(key) === 'on';
const nullableUuid = (fd: FormData, key: string) => {
  const v = str(fd, key);
  return v === '' ? null : v;
};
/** Los precios llegan como texto del formulario; aquí se vuelven enteros COP. */
const money = (fd: FormData, key: string): number | null => {
  const raw = str(fd, key).replace(/[^\d-]/g, '');
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/* ------------------------------------------------------------- producto -- */

export async function saveProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = str(fd, 'id') || undefined;
  const basePrice = money(fd, 'base_price');
  const parsed = productSchema.safeParse({
    ...(id ? { id } : {}),
    name: str(fd, 'name'),
    slug: str(fd, 'slug'),
    headline: str(fd, 'headline'),
    description: str(fd, 'description'),
    category_id: nullableUuid(fd, 'category_id'),
    base_price: basePrice ?? Number.NaN,
    compare_at_price: money(fd, 'compare_at_price'),
    fit: str(fd, 'fit'),
    material: str(fd, 'material'),
    care: str(fd, 'care'),
    is_active: bool(fd, 'is_active'),
    is_featured: bool(fd, 'is_featured'),
    collection_ids: fd.getAll('collection_ids').map(String).filter(Boolean),
  });

  if (!parsed.success) return fail('Revisa los campos marcados', zodErrors(parsed.error.issues));

  const { collection_ids: collectionIds, ...values } = parsed.data;
  const supabase = await createClient();

  const row = {
    name: values.name,
    slug: values.slug,
    headline: values.headline || null,
    description: values.description || null,
    category_id: values.category_id,
    base_price: values.base_price,
    compare_at_price: values.compare_at_price,
    fit: values.fit || null,
    material: values.material || null,
    care: values.care || null,
    is_active: values.is_active,
    is_featured: values.is_featured,
  };

  let productId = id;

  if (productId) {
    const { error } = await supabase.from('products').update(row).eq('id', productId);
    if (error) return fail(friendly(error.message, error.code));
  } else {
    const { data: last } = await supabase
      .from('products')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from('products')
      .insert({ ...row, sort_order: (last?.sort_order ?? -1) + 1 })
      .select('id')
      .single();
    if (error || !data) return fail(friendly(error?.message ?? 'Error al crear', error?.code));
    productId = data.id;
  }

  // Colecciones: se reemplaza el conjunto completo.
  await supabase.from('product_collections').delete().eq('product_id', productId);
  if (collectionIds.length > 0) {
    await supabase.from('product_collections').insert(
      collectionIds.map((collection_id, i) => ({
        product_id: productId as string,
        collection_id,
        sort_order: i,
      })),
    );
  }

  refresh(productId);
  if (!id) redirect(`/admin/prendas/${productId}`);
  return ok('Guardado');
}

export async function removeProduct(id: string): Promise<void> {
  await requireAdmin();
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('products').delete().eq('id', id);
  refresh();
  redirect('/admin/prendas');
}

/** Interruptores de activo / destacado, desde el listado. */
export async function setFlag(
  id: string,
  field: 'is_active' | 'is_featured',
  value: boolean,
): Promise<void> {
  await requireAdmin();
  const parsed = toggleSchema.safeParse({ id, field, value });
  if (!parsed.success) return;

  const patch =
    parsed.data.field === 'is_active'
      ? { is_active: parsed.data.value }
      : { is_featured: parsed.data.value };

  const supabase = await createClient();
  await supabase.from('products').update(patch).eq('id', parsed.data.id);
  refresh(parsed.data.id);
}

/** Reordenar por arrastre: llega el orden completo y se escribe de una. */
export async function reorder(entity: string, ids: string[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ entity, ids });
  if (!parsed.success) return fail('Orden inválido');

  const supabase = await createClient();
  const table = parsed.data.entity;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase.from(table).update({ sort_order: index }).eq('id', id),
    ),
  );
  const broken = results.find((r) => r.error);
  if (broken?.error) return fail(`No se pudo guardar el orden: ${broken.error.message}`);

  refresh();
  return ok('Orden guardado');
}

/* ---------------------------------------------------------------- color -- */

/**
 * Crear un color genera sus 5 variantes. Un color sin tallas no sirve de nada
 * y obligar al admin a crearlas a mano es trabajo inventado.
 */
export async function saveColor(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = str(fd, 'id') || undefined;
  const parsed = colorSchema.safeParse({
    ...(id ? { id } : {}),
    product_id: str(fd, 'product_id'),
    color_name: str(fd, 'color_name'),
    swatch_hex: str(fd, 'swatch_hex').toUpperCase(),
    ambient_hex: str(fd, 'ambient_hex').toUpperCase(),
    cutout_url: str(fd, 'cutout_url') || null,
    sort_order: Number(str(fd, 'sort_order') || '0'),
  });
  if (!parsed.success) return fail('Revisa el color', zodErrors(parsed.error.issues));

  const supabase = await createClient();
  const values = parsed.data;

  if (id) {
    const { error } = await supabase
      .from('product_colors')
      .update({
        color_name: values.color_name,
        swatch_hex: values.swatch_hex,
        ambient_hex: values.ambient_hex,
        cutout_url: values.cutout_url,
      })
      .eq('id', id);
    if (error) return fail(friendly(error.message, error.code));
  } else {
    const { data, error } = await supabase
      .from('product_colors')
      .insert({
        product_id: values.product_id,
        color_name: values.color_name,
        swatch_hex: values.swatch_hex,
        ambient_hex: values.ambient_hex,
        cutout_url: values.cutout_url,
        sort_order: values.sort_order,
      })
      .select('id')
      .single();
    if (error || !data) return fail(friendly(error?.message ?? 'Error', error?.code));

    const { error: variantError } = await supabase.from('product_variants').insert(
      GARMENT_SIZES.map((size) => ({
        product_id: values.product_id,
        color_id: data.id,
        size,
        stock_status: 'disponible' as const,
        is_active: true,
      })),
    );
    if (variantError) return fail(`Color creado, pero faltaron las tallas: ${variantError.message}`);
  }

  refresh(values.product_id);
  return ok(id ? 'Color actualizado' : 'Color creado con sus 5 tallas');
}

export async function removeColor(id: string, productId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('product_colors').delete().eq('id', id);
  if (error) return fail(friendly(error.message, error.code));
  refresh(productId);
  return ok('Color eliminado con sus tallas e imágenes');
}

/** Aplica al color la sugerencia de color dominante que salió del recorte. */
export async function applyColorSuggestion(
  colorId: string,
  productId: string,
  swatchHex: string,
  ambientHex: string,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = colorSchema
    .pick({ swatch_hex: true, ambient_hex: true })
    .safeParse({ swatch_hex: swatchHex.toUpperCase(), ambient_hex: ambientHex.toUpperCase() });
  if (!parsed.success) return fail('Color inválido');

  const supabase = await createClient();
  const { error } = await supabase
    .from('product_colors')
    .update({ swatch_hex: parsed.data.swatch_hex, ambient_hex: parsed.data.ambient_hex })
    .eq('id', colorId);
  if (error) return fail(friendly(error.message, error.code));
  refresh(productId);
  return ok('Colores actualizados');
}

/** Marca un recorte como el que flota en el hero. */
export async function setCutout(
  colorId: string,
  productId: string,
  url: string,
): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('product_colors')
    .update({ cutout_url: url })
    .eq('id', colorId);
  if (error) return fail(friendly(error.message, error.code));
  refresh(productId);
  return ok('Recorte asignado');
}

/* ------------------------------------------------------------ variantes -- */

/** La matriz color × talla guarda todas las celdas tocadas de una sola vez. */
export async function saveVariants(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();

  const productId = str(fd, 'product_id');
  const payload = str(fd, 'variants');
  if (!productId || !payload) return fail('Nada que guardar');

  let rows: unknown;
  try {
    rows = JSON.parse(payload);
  } catch {
    return fail('No se entendieron los cambios de la matriz');
  }
  if (!Array.isArray(rows)) return fail('No se entendieron los cambios de la matriz');

  const parsed = rows.map((r) => variantSchema.safeParse(r));
  const broken = parsed.find((p) => !p.success);
  if (broken && !broken.success) {
    return fail('Hay una celda con datos inválidos', zodErrors(broken.error.issues));
  }

  const supabase = await createClient();
  const results = await Promise.all(
    parsed.map((p) => {
      const v = p.success ? p.data : null;
      if (!v?.id) return Promise.resolve({ error: null });
      return supabase
        .from('product_variants')
        .update({
          sku: v.sku,
          price_override: v.price_override,
          stock_status: v.stock_status,
          is_active: v.is_active,
        })
        .eq('id', v.id);
    }),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(`No se guardó todo: ${failed.error.message}`);

  refresh(productId);
  return ok(`${parsed.length} ${parsed.length === 1 ? 'talla guardada' : 'tallas guardadas'}`);
}

/* -------------------------------------------------------------- imagenes -- */

export async function removeImage(id: string, productId: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('product_images').delete().eq('id', id);
  if (error) return fail(friendly(error.message, error.code));
  refresh(productId);
  return ok('Imagen eliminada');
}

/** Alta de imagen tras subirla a Storage desde el navegador. */
export async function addImage(input: {
  product_id: string;
  color_id: string | null;
  url: string;
  view: string;
  alt: string;
  sort_order: number;
}): Promise<ActionState> {
  await requireAdmin();
  const parsed = imageSchema.safeParse(input);
  if (!parsed.success) return fail('Imagen inválida', zodErrors(parsed.error.issues));

  const supabase = await createClient();
  const v = parsed.data;
  const { error } = await supabase.from('product_images').insert({
    product_id: v.product_id,
    color_id: v.color_id,
    url: v.url,
    view: v.view,
    sort_order: v.sort_order,
    alt: v.alt || null,
  });
  if (error) return fail(friendly(error.message, error.code));
  refresh(v.product_id);
  return ok('Imagen agregada');
}

export async function updateImageMeta(
  id: string,
  productId: string,
  patch: { view: string; alt: string },
): Promise<ActionState> {
  await requireAdmin();
  const parsed = imageSchema
    .pick({ view: true, alt: true })
    .safeParse({ view: patch.view, alt: patch.alt });
  if (!parsed.success) return fail('Datos inválidos', zodErrors(parsed.error.issues));

  const supabase = await createClient();
  const { error } = await supabase
    .from('product_images')
    .update({ view: parsed.data.view, alt: parsed.data.alt || null })
    .eq('id', id);
  if (error) return fail(friendly(error.message, error.code));
  refresh(productId);
  return ok('Imagen actualizada');
}

/* ------------------------------------------------------------------------ */

/** Traduce los errores de Postgres a algo que se pueda leer sin ser DBA. */
function friendly(message: string, code?: string): string {
  if (code === '23505' || message.includes('duplicate key')) {
    if (message.includes('slug')) return 'Ya hay una prenda con ese enlace. Cámbialo.';
    if (message.includes('color_name')) return 'Esta prenda ya tiene un color con ese nombre.';
    if (message.includes('sku')) return 'Ese SKU ya existe en otra variante.';
    return 'Ese valor ya está en uso.';
  }
  if (code === '23514' || message.includes('violates check constraint')) {
    if (message.includes('compare')) return 'El precio tachado tiene que ser mayor que el actual.';
    if (message.includes('hex')) return 'El color debe ir en formato #RRGGBB.';
    return 'Hay un valor fuera de rango.';
  }
  if (code === '42501') return 'Tu cuenta no tiene permiso para este cambio.';
  return message;
}
