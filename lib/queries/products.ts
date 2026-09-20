import 'server-only';

/**
 * Consultas del sitio público.
 *
 * TODAS usan el cliente sin cookies, y eso es deliberado. Leer cookies obliga a
 * Next a renderizar la página en cada petición: la vuelve dinámica, tira por
 * tierra el ISR y saca la metadata fuera de <head>, donde Lighthouse y los
 * rastreadores simples no la ven. Aquí no hay nada personal que leer: el RLS
 * de la clave pública ya limita lo que se puede ver.
 *
 * El panel usa `lib/queries/admin.ts`, que sí va con la sesión.
 */
import { cache } from 'react';
import { ambientTokens } from '@/lib/color';
import { hasSupabaseConfig } from '@/lib/env';
import { effectivePrice, resolvePrice, type ResolvedPrice } from '@/lib/pricing';
import { createStaticClient } from '@/lib/supabase/static';
import type {
  CollectionRow,
  GarmentSize,
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

/* ------------------------------------------------------------- mapeadores -- */

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
/**
 * Una prenda con todo lo que necesita cualquiera de las vistas: color primario,
 * precio, tallas con su id de variante (para poder meterla en la bolsa sin
 * entrar a la ficha) y la imagen de espalda que usa el volteo del bento.
 */
export type Garment = {
  id: string;
  slug: string;
  name: string;
  headline: string | null;
  description: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  /** Manda el tamaño de la tarjeta en la grilla bento. */
  isFeatured: boolean;
  colorId: string;
  colorName: string;
  swatchHex: string;
  ambientHex: string;
  ambient: ReturnType<typeof ambientTokens>;
  cutoutUrl: string | null;
  price: ResolvedPrice;
  /** Imagen de espalda del color primario; la usa el volteo de la tarjeta. */
  backUrl: string | null;
  sizes: {
    size: GarmentSize;
    available: boolean;
    /** Sin variante no se puede comprar esa talla. */
    variantId: string | null;
    price: number;
  }[];
};

/** Nombre antiguo, mientras queden importaciones. */
export type HeroGarment = Garment;

/**
 * Prendas con su color primario, precio y tallas.
 *
 * Trae colores y variantes en la misma consulta: tanto el hero como el perchero
 * necesitan las tallas, y una segunda ida a la base por prenda se notaría.
 */
export const getGarments = cache(
  async (
    options: { featured?: boolean; categorySlug?: string; search?: string } = {},
  ): Promise<Garment[]> => {
    if (!hasSupabaseConfig()) return [];
    const supabase = createStaticClient();

    let query = supabase
      .from('products')
      .select(
        `id, slug, name, headline, description, base_price, compare_at_price, sort_order, is_featured,
         categories!inner ( name, slug ),
         product_colors ( * ),
         product_variants ( * ),
         product_images ( url, view, color_id, sort_order )`,
      )
      .order('sort_order');

    if (options.featured) query = query.eq('is_featured', true);
    if (options.categorySlug) query = query.eq('categories.slug', options.categorySlug);
    if (options.search) query = query.ilike('name', `%${options.search}%`);

    const { data, error } = await query;
    if (error) throw new Error(`No se pudieron cargar las prendas: ${error.message}`);

    const rows = (data ?? []) as unknown as {
      id: string; slug: string; name: string;
      headline: string | null; description: string | null;
      base_price: number; compare_at_price: number | null; is_featured: boolean;
      categories: { name: string; slug: string } | null;
      product_colors: ProductColorRow[];
      product_variants: ProductVariantRow[];
      product_images: Pick<ProductImageRow, 'url' | 'view' | 'color_id' | 'sort_order'>[];
    }[];

    return rows.flatMap((row) => {
      const color = [...row.product_colors].sort((a, b) => a.sort_order - b.sort_order)[0];
      if (!color) return [];

      const mine = row.product_variants.filter((v) => v.color_id === color.id);
      const prices = mine.map((v) =>
        effectivePrice({ basePrice: row.base_price, priceOverride: v.price_override }),
      );

      return [
        {
          id: row.id,
          slug: row.slug,
          name: row.name,
          headline: row.headline,
          description: row.description,
          categoryName: row.categories?.name ?? null,
          categorySlug: row.categories?.slug ?? null,
          isFeatured: row.is_featured,
          colorId: color.id,
          colorName: color.color_name,
          swatchHex: color.swatch_hex,
          ambientHex: color.ambient_hex,
          ambient: ambientTokens(color.ambient_hex),
          cutoutUrl: color.cutout_url,
          price: resolvePrice({
            basePrice: prices.length > 0 ? Math.min(...prices) : row.base_price,
            compareAtPrice: row.compare_at_price,
          }),
          backUrl:
            [...row.product_images]
              .filter((i) => i.view === 'espalda' && (i.color_id === color.id || i.color_id === null))
              .sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
          sizes: SIZE_ORDER.map((size) => {
            const variant = mine.find((v) => v.size === size);
            return {
              size,
              available: Boolean(variant?.is_active) && variant?.stock_status !== 'agotado',
              variantId: variant?.id ?? null,
              price: effectivePrice({
                basePrice: row.base_price,
                priceOverride: variant?.price_override ?? null,
              }),
            };
          }),
        },
      ];
    });
  },
);

/** Las destacadas del carrusel del hero. */
export const getHeroGarments = cache(() => getGarments({ featured: true }));

export const getCategories = cache(async () => {
  if (!hasSupabaseConfig()) return [];
  const supabase = createStaticClient();
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return data ?? [];
});

/** Una colección con sus prendas, tal como la muestran los tabs de Total Look. */
export type CollectionLook = {
  id: string;
  name: string;
  slug: string;
  garments: Garment[];
};

/**
 * Colecciones con sus prendas, en una sola consulta.
 *
 * Total Look es una sección del home: si cada pestaña pidiera sus prendas al
 * abrirse, el cambio de pestaña tendría espera. Se traen todas de una y el
 * cambio es instantáneo.
 */
export const getCollectionLooks = cache(async (): Promise<CollectionLook[]> => {
  if (!hasSupabaseConfig()) return [];
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from('collections')
    .select(
      `id, name, slug, sort_order,
       product_collections (
         sort_order,
         products (
           id, slug, name, headline, description, base_price, compare_at_price, is_active,
           categories ( name ),
           product_colors ( * ),
           product_variants ( * )
         )
       )`,
    )
    .order('sort_order');

  if (error) throw new Error(`No se pudieron cargar las colecciones: ${error.message}`);

  type Row = {
    id: string; name: string; slug: string;
    product_collections: {
      sort_order: number;
      products: {
        id: string; slug: string; name: string;
        headline: string | null; description: string | null;
        base_price: number; compare_at_price: number | null; is_active: boolean;
        categories: { name: string } | null;
        product_colors: ProductColorRow[];
        product_variants: ProductVariantRow[];
      } | null;
    }[];
  };

  return ((data ?? []) as unknown as Row[])
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      garments: [...collection.product_collections]
        .sort((a, b) => a.sort_order - b.sort_order)
        .flatMap((entry) => {
          const row = entry.products;
          // El RLS ya filtra lo inactivo para el público, pero la consulta la
          // comparte el panel: mejor no fiarse del contexto.
          if (!row || !row.is_active) return [];

          const color = [...row.product_colors].sort((a, b) => a.sort_order - b.sort_order)[0];
          if (!color) return [];

          const mine = row.product_variants.filter((v) => v.color_id === color.id);
          const prices = mine.map((v) =>
            effectivePrice({ basePrice: row.base_price, priceOverride: v.price_override }),
          );

          return [
            {
              id: row.id,
              slug: row.slug,
              name: row.name,
              headline: row.headline,
              description: row.description,
              categoryName: row.categories?.name ?? null,
              categorySlug: null,
              isFeatured: false,
              colorId: color.id,
              colorName: color.color_name,
              swatchHex: color.swatch_hex,
              ambientHex: color.ambient_hex,
              ambient: ambientTokens(color.ambient_hex),
              cutoutUrl: color.cutout_url,
              price: resolvePrice({
                basePrice: prices.length > 0 ? Math.min(...prices) : row.base_price,
                compareAtPrice: row.compare_at_price,
              }),
              backUrl: null,
              sizes: SIZE_ORDER.map((size) => {
                const variant = mine.find((v) => v.size === size);
                return {
                  size,
                  available: Boolean(variant?.is_active) && variant?.stock_status !== 'agotado',
                  variantId: variant?.id ?? null,
                  price: effectivePrice({
                    basePrice: row.base_price,
                    priceOverride: variant?.price_override ?? null,
                  }),
                };
              }),
            },
          ];
        }),
    }))
    // Una pestaña vacía no tiene nada que enseñar.
    .filter((collection) => collection.garments.length > 0);
});

export const getCollections = cache(async (): Promise<CollectionRow[]> => {
  if (!hasSupabaseConfig()) return [];
  const supabase = createStaticClient();
  const { data, error } = await supabase.from('collections').select('*').order('sort_order');
  if (error) throw new Error(`No se pudieron cargar las colecciones: ${error.message}`);
  return data ?? [];
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!hasSupabaseConfig()) return null;
  const supabase = createStaticClient();
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

/**
 * Slugs activos, para generateStaticParams y el sitemap. Va con el cliente sin
 * cookies: los dos corren fuera de una petición.
 */
export const getActiveSlugs = cache(async (): Promise<string[]> => {
  if (!hasSupabaseConfig()) return [];
  const supabase = createStaticClient();
  const { data, error } = await supabase.from('products').select('slug').order('sort_order');
  if (error) return [];
  return (data ?? []).map((r) => r.slug);
});
