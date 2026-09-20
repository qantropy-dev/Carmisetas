import { z } from 'zod';
import { isUsableAmbient } from '@/lib/color';
import { GARMENT_SIZES, PRODUCT_VIEWS, STOCK_STATUSES } from '@/lib/supabase/database.types';

/* Los mismos esquemas corren en el formulario y en la Server Action: lo que el
   navegador deja pasar, el servidor lo vuelve a comprobar. */

const HEX = /^#[0-9a-fA-F]{6}$/;

export const hexField = z
  .string()
  .trim()
  .regex(HEX, 'Usa un color en formato #RRGGBB');

/**
 * El color del escenario tiene un requisito extra: encima va texto. Si ni el
 * claro ni el oscuro de la marca llegan a AA sobre él, no sirve por bonito que
 * sea, y hay que decirlo al escribirlo y no en una auditoría meses después.
 */
export const ambientHexField = hexField.refine(isUsableAmbient, {
  error: 'Sobre ese color el texto no se lee. Acláralo u oscurécelo un poco.',
});

/** COP entero. Sin decimales, sin separadores. */
export const copField = z
  .number({ error: 'Escribe un precio' })
  .int('El precio no lleva decimales')
  .min(0, 'El precio no puede ser negativo')
  .max(100_000_000, 'Ese precio parece un error');

export const slugField = z
  .string()
  .trim()
  .min(2, 'El enlace es muy corto')
  .max(80, 'El enlace es muy largo')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones');

export const uuidField = z.uuid({ error: 'Identificador inválido' });

/* ------------------------------------------------------------- producto -- */

export const productSchema = z
  .object({
    id: uuidField.optional(),
    name: z.string().trim().min(2, 'Ponle nombre a la prenda').max(120),
    slug: slugField,
    headline: z.string().trim().max(120, 'El titular del hero debe ser corto').or(z.literal('')),
    description: z.string().trim().max(2000).or(z.literal('')),
    category_id: uuidField.nullable(),
    base_price: copField,
    compare_at_price: copField.nullable(),
    fit: z.string().trim().max(160).or(z.literal('')),
    material: z.string().trim().max(300).or(z.literal('')),
    care: z.string().trim().max(600).or(z.literal('')),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    collection_ids: z.array(uuidField).max(12),
  })
  .refine(
    (v) => v.compare_at_price === null || v.compare_at_price > v.base_price,
    { path: ['compare_at_price'], error: 'El precio tachado tiene que ser mayor que el precio actual' },
  );

export type ProductInput = z.infer<typeof productSchema>;

/* ---------------------------------------------------------------- color -- */

export const colorSchema = z.object({
  id: uuidField.optional(),
  product_id: uuidField,
  color_name: z.string().trim().min(2, 'Ponle nombre al color').max(60),
  swatch_hex: hexField,
  ambient_hex: ambientHexField,
  cutout_url: z.string().trim().min(1).nullable(),
  sort_order: z.number().int().min(0).default(0),
});

export type ColorInput = z.infer<typeof colorSchema>;

/* ------------------------------------------------------------- variante -- */

export const variantSchema = z.object({
  id: uuidField.optional(),
  product_id: uuidField,
  color_id: uuidField,
  size: z.enum(GARMENT_SIZES),
  sku: z.string().trim().max(60).nullable(),
  price_override: copField.nullable(),
  stock_status: z.enum(STOCK_STATUSES),
  is_active: z.boolean(),
});

export type VariantInput = z.infer<typeof variantSchema>;

/* -------------------------------------------------------------- imagen -- */

export const imageSchema = z.object({
  id: uuidField.optional(),
  product_id: uuidField,
  color_id: uuidField.nullable(),
  url: z.string().trim().min(1, 'Falta la imagen'),
  view: z.enum(PRODUCT_VIEWS),
  sort_order: z.number().int().min(0).default(0),
  alt: z.string().trim().max(200).or(z.literal('')),
});

export type ImageInput = z.infer<typeof imageSchema>;

/* ------------------------------------------------------- orden y toggles -- */

export const reorderSchema = z.object({
  entity: z.enum(['products', 'product_colors', 'product_images', 'categories', 'collections']),
  ids: z.array(uuidField).min(1).max(500),
});

export const toggleSchema = z.object({
  id: uuidField,
  field: z.enum(['is_active', 'is_featured']),
  value: z.boolean(),
});

/* ------------------------------------------------- taxonomia y precios ---- */

export const taxonomySchema = z.object({
  id: uuidField.optional(),
  entity: z.enum(['categories', 'collections']),
  name: z.string().trim().min(2, 'Ponle nombre').max(80),
  slug: slugField,
});

/**
 * Edición masiva de precios. Siempre se previsualiza antes de aplicar, así que
 * el mismo esquema sirve para calcular la vista previa y para confirmarla.
 */
export const bulkPriceSchema = z
  .object({
    scope: z.enum(['todas', 'categoria', 'seleccion']),
    category_id: uuidField.nullable(),
    product_ids: z.array(uuidField).max(500),
    mode: z.enum(['porcentaje', 'monto', 'fijar']),
    /** % (puede ser negativo), monto en COP (puede ser negativo) o precio fijo. */
    value: z.number({ error: 'Escribe un valor' }).int('Sin decimales'),
    /** Redondeo al múltiplo más cercano. 100 deja precios como $ 79.900. */
    round_to: z.union([z.literal(0), z.literal(100), z.literal(1000)]),
    /** Mueve también el precio tachado para conservar el % de descuento. */
    keep_discount: z.boolean(),
  })
  .refine((v) => v.scope !== 'categoria' || v.category_id !== null, {
    path: ['category_id'],
    error: 'Elige una categoría',
  })
  .refine((v) => v.scope !== 'seleccion' || v.product_ids.length > 0, {
    path: ['product_ids'],
    error: 'Marca al menos una prenda',
  })
  .refine((v) => v.mode !== 'porcentaje' || (v.value >= -90 && v.value <= 500), {
    path: ['value'],
    error: 'El porcentaje debe estar entre −90 y 500',
  })
  .refine((v) => v.mode !== 'fijar' || v.value > 0, {
    path: ['value'],
    error: 'El precio fijo tiene que ser mayor que cero',
  });

export type BulkPriceInput = z.infer<typeof bulkPriceSchema>;

/**
 * Aplica la regla a un precio. Puro: la vista previa y la confirmación usan
 * exactamente esta función, así que lo que se ve es lo que se guarda.
 */
export function applyBulkPrice(current: number, rule: BulkPriceInput): number {
  let next: number;
  if (rule.mode === 'porcentaje') next = current * (1 + rule.value / 100);
  else if (rule.mode === 'monto') next = current + rule.value;
  else next = rule.value;

  next = Math.max(0, Math.round(next));
  if (rule.round_to > 0) next = Math.round(next / rule.round_to) * rule.round_to;
  return next;
}
