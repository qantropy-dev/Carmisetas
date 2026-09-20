import 'server-only';

import { cache } from 'react';
import { requireAdmin } from '@/lib/auth';
import { effectivePrice, resolvePrice, type ResolvedPrice } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import type {
  AuditLogRow,
  CategoryRow,
  CollectionRow,
  GarmentSize,
  ProductColorRow,
  ProductImageRow,
  ProductVariantRow,
  StockStatus,
} from '@/lib/supabase/database.types';

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  categoryId: string | null;
  categoryName: string | null;
  price: ResolvedPrice;
  colors: { id: string; name: string; swatchHex: string; ambientHex: string; cutoutUrl: string | null }[];
  /** Cuántas variantes activas quedan sin agotar. */
  inStock: number;
  totalVariants: number;
};

type ListRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  base_price: number;
  compare_at_price: number | null;
  category_id: string | null;
  categories: { name: string } | null;
  product_colors: Pick<
    ProductColorRow,
    'id' | 'color_name' | 'swatch_hex' | 'ambient_hex' | 'cutout_url' | 'sort_order'
  >[];
  product_variants: Pick<ProductVariantRow, 'id' | 'stock_status' | 'is_active'>[];
};

/** Listado del panel: el admin ve también lo inactivo. */
export const listProducts = cache(async (): Promise<AdminProductRow[]> => {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, name, slug, is_active, is_featured, sort_order, base_price, compare_at_price, category_id,
       categories ( name ),
       product_colors ( id, color_name, swatch_hex, ambient_hex, cutout_url, sort_order ),
       product_variants ( id, stock_status, is_active )`,
    )
    .order('sort_order');

  if (error) throw new Error(`No se pudo cargar el listado: ${error.message}`);

  return ((data ?? []) as unknown as ListRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    categoryId: row.category_id,
    categoryName: row.categories?.name ?? null,
    price: resolvePrice({ basePrice: row.base_price, compareAtPrice: row.compare_at_price }),
    colors: [...row.product_colors]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        id: c.id,
        name: c.color_name,
        swatchHex: c.swatch_hex,
        ambientHex: c.ambient_hex,
        cutoutUrl: c.cutout_url,
      })),
    inStock: row.product_variants.filter((v) => v.is_active && v.stock_status !== 'agotado').length,
    totalVariants: row.product_variants.length,
  }));
});

export type EditableProduct = {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  categoryId: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  fit: string;
  material: string;
  care: string;
  isActive: boolean;
  isFeatured: boolean;
  collectionIds: string[];
  colors: ProductColorRow[];
  variants: ProductVariantRow[];
  images: ProductImageRow[];
};

export const getProductForEdit = cache(async (id: string): Promise<EditableProduct | null> => {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `*,
       product_collections ( collection_id ),
       product_colors ( * ),
       product_variants ( * ),
       product_images ( * )`,
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la prenda: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as {
    id: string; name: string; slug: string;
    headline: string | null; description: string | null;
    category_id: string | null; base_price: number; compare_at_price: number | null;
    fit: string | null; material: string | null; care: string | null;
    is_active: boolean; is_featured: boolean;
    product_collections: { collection_id: string }[];
    product_colors: ProductColorRow[];
    product_variants: ProductVariantRow[];
    product_images: ProductImageRow[];
  };

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    headline: row.headline ?? '',
    description: row.description ?? '',
    categoryId: row.category_id,
    basePrice: row.base_price,
    compareAtPrice: row.compare_at_price,
    fit: row.fit ?? '',
    material: row.material ?? '',
    care: row.care ?? '',
    isActive: row.is_active,
    isFeatured: row.is_featured,
    collectionIds: row.product_collections.map((c) => c.collection_id),
    colors: [...row.product_colors].sort((a, b) => a.sort_order - b.sort_order),
    variants: row.product_variants,
    images: [...row.product_images].sort((a, b) => a.sort_order - b.sort_order),
  };
});

export const getTaxonomy = cache(
  async (): Promise<{ categories: CategoryRow[]; collections: CollectionRow[] }> => {
    await requireAdmin();
    const supabase = await createClient();
    const [cats, cols] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('collections').select('*').order('sort_order'),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    if (cols.error) throw new Error(cols.error.message);
    return { categories: cats.data ?? [], collections: cols.data ?? [] };
  },
);

export type AuditEntry = AuditLogRow & { adminName: string | null };

/** Historial: quién cambió qué y cuándo. */
export const getAuditLog = cache(async (limit = 120): Promise<AuditEntry[]> => {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudo cargar el historial: ${error.message}`);

  const rows = (data ?? []) as AuditLogRow[];
  const ids = [...new Set(rows.map((r) => r.admin_id).filter((v): v is string => v !== null))];
  const names = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: admins } = await supabase
      .from('admin_profiles')
      .select('id, full_name')
      .in('id', ids);
    for (const a of admins ?? []) names.set(a.id, a.full_name);
  }

  return rows.map((r) => ({ ...r, adminName: r.admin_id ? (names.get(r.admin_id) ?? null) : null }));
});

/** Precio efectivo de cada variante, para la matriz. */
export function variantPrice(basePrice: number, variant: ProductVariantRow): number {
  return effectivePrice({ basePrice, priceOverride: variant.price_override });
}

export type { GarmentSize, StockStatus };
