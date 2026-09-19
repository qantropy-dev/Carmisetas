import 'server-only';

import { cache } from 'react';
import { ambientTokens } from '@/lib/color';
import { hasSupabaseConfig } from '@/lib/env';
import { effectivePrice, resolvePrice, type ResolvedPrice } from '@/lib/pricing';
import { createClient } from '@/lib/supabase/server';
import type {
  CollectionRow,
  GarmentSize,
  ProductCardRow,
  ProductColorRow,
  ProductImageRow,
  ProductVariantRow,
  ProductView,
  StockStatus,
} from '@/lib/supabase/database.types';

/* -------------------------------------------------------------- dominio -- */

export type Variant = {
  id: string;
  size: GarmentSize;
  sku: string | null;
  price: number;
  stockStatus: StockStatus;
  available: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  view: ProductView;
  alt: string;
};

export type ProductColor = {
  id: string;
  name: string;
  swatchHex: string;
  ambientHex: string;
  /** Tokens ya calculados: el servidor los serializa y no hay parpadeo. */
  ambient: ReturnType<typeof ambientTokens>;
  cutoutUrl: string | null;
  images: ProductImage[];
  variants: Variant[];
  price: ResolvedPrice;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  description: string | null;
  fit: string | null;
  material: string | null;
  care: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  isFeatured: boolean;
  categoryName: string | null;
  categorySlug: string | null;
  colors: ProductColor[];
};

/** Lo que necesitan la grilla, el perchero y el hero, sin traer todo. */
export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  description: string | null;
  isFeatured: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  colorId: string | null;
  colorName: string | null;
  swatchHex: string | null;
  ambientHex: string;
  ambient: ReturnType<typeof ambientTokens>;
  cutoutUrl: string | null;
  backUrl: string | null;
  inStock: boolean;
  price: ResolvedPrice;
};

/* ------------------------------------------------------------- mapeadores -- */

const AMBIENT_FALLBACK = '#E8E3DA';

function toCard(row: ProductCardRow): ProductCard {
  const ambientHex = row.primary_ambient_hex ?? AMBIENT_FALLBACK;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    headline: row.headline,
    description: row.description,
    isFeatured: row.is_featured,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    colorId: row.primary_color_id,
    colorName: row.primary_color_name,
    swatchHex: row.primary_swatch_hex,
    ambientHex,
    ambient: ambientTokens(ambientHex),
    cutoutUrl: row.primary_cutout_url,
    backUrl: row.back_url,
    inStock: row.in_stock,
    price: resolvePrice({
      basePrice: row.min_price ?? row.base_price,
      compareAtPrice: row.compare_at_price,
    }),
  };
}

function toColor(
  color: ProductColorRow,
  basePrice: number,
  compareAtPrice: number | null,
  variants: ProductVariantRow[],
  images: ProductImageRow[],
): ProductColor {
  const mine = variants
    .filter((v) => v.color_id === color.id)
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

  const prices = mine.map((v) => effectivePrice({ basePrice, priceOverride: v.price_override }));
  const from = prices.length > 0 ? Math.min(...prices) : basePrice;

  return {
    id: color.id,
    name: color.color_name,
    swatchHex: color.swatch_hex,
    ambientHex: color.ambient_hex,
    ambient: ambientTokens(color.ambient_hex),
    cutoutUrl: color.cutout_url,
    images: images
      .filter((i) => i.color_id === color.id || i.color_id === null)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ id: i.id, url: i.url, view: i.view, alt: i.alt ?? '' })),
    variants: mine.map((v) => ({
      id: v.id,
      size: v.size,
      sku: v.sku,
      price: effectivePrice({ basePrice, priceOverride: v.price_override }),
      stockStatus: v.stock_status,
      available: v.stock_status !== 'agotado',
    })),
    price: resolvePrice({ basePrice: from, compareAtPrice }),
  };
}

const SIZE_ORDER: readonly GarmentSize[] = ['S', 'M', 'L', 'XL', 'XXL'];

/* -------------------------------------------------------------- consultas -- */

/** `cache` de React: varias secciones de la misma pagina comparten la consulta. */
export const getFeaturedProducts = cache(async (): Promise<ProductCard[]> => {
  if (!hasSupabaseConfig()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_cards')
    .select('*')
    .eq('is_featured', true)
    .order('sort_order');

  if (error) throw new Error(`No se pudieron cargar las prendas destacadas: ${error.message}`);
  return (data ?? []).map(toCard);
});

export const getCatalog = cache(
  async (options: { categorySlug?: string; search?: string } = {}): Promise<ProductCard[]> => {
    if (!hasSupabaseConfig()) return [];
    const supabase = await createClient();
    let query = supabase.from('product_cards').select('*').order('sort_order');

    if (options.categorySlug) query = query.eq('category_slug', options.categorySlug);
    if (options.search) query = query.ilike('name', `%${options.search}%`);

    const { data, error } = await query;
    if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
    return (data ?? []).map(toCard);
  },
);

export const getCategories = cache(async () => {
  if (!hasSupabaseConfig()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return data ?? [];
});

export const getCollections = cache(async (): Promise<CollectionRow[]> => {
  if (!hasSupabaseConfig()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('collections').select('*').order('sort_order');
  if (error) throw new Error(`No se pudieron cargar las colecciones: ${error.message}`);
  return data ?? [];
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!hasSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `*,
       categories ( name, slug ),
       product_colors ( * ),
       product_variants ( * ),
       product_images ( * )`,
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la prenda ${slug}: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    slug: string;
    name: string;
    headline: string | null;
    description: string | null;
    fit: string | null;
    material: string | null;
    care: string | null;
    base_price: number;
    compare_at_price: number | null;
    is_featured: boolean;
    categories: { name: string; slug: string } | null;
    product_colors: ProductColorRow[];
    product_variants: ProductVariantRow[];
    product_images: ProductImageRow[];
  };

  const colors = [...row.product_colors]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) =>
      toColor(c, row.base_price, row.compare_at_price, row.product_variants, row.product_images),
    );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    headline: row.headline,
    description: row.description,
    fit: row.fit,
    material: row.material,
    care: row.care,
    basePrice: row.base_price,
    compareAtPrice: row.compare_at_price,
    isFeatured: row.is_featured,
    categoryName: row.categories?.name ?? null,
    categorySlug: row.categories?.slug ?? null,
    colors,
  };
});

/** Slugs activos, para generateStaticParams y el sitemap. */
export const getActiveSlugs = cache(async (): Promise<string[]> => {
  if (!hasSupabaseConfig()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select('slug').order('sort_order');
  if (error) return [];
  return (data ?? []).map((r) => r.slug);
});
