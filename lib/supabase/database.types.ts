/**
 * Tipos de la base. Escritos a mano para espejar supabase/migrations/*.
 * Cuando haya un proyecto conectado se regeneran con `npm run db:types`
 * (`supabase gen types typescript`), que produce exactamente esta forma.
 */

export type StockStatus = 'disponible' | 'pocas' | 'agotado';
export type ProductView = 'frente' | 'espalda' | 'detalle' | 'modelo';
export type GarmentSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export const GARMENT_SIZES: readonly GarmentSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
export const PRODUCT_VIEWS: readonly ProductView[] = ['frente', 'espalda', 'detalle', 'modelo'];
export const STOCK_STATUSES: readonly StockStatus[] = ['disponible', 'pocas', 'agotado'];

type Timestamped = { created_at: string };

export type CategoryRow = { id: string; name: string; slug: string; sort_order: number };
export type CollectionRow = CategoryRow;

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  headline: string | null;
  description: string | null;
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  fit: string | null;
  material: string | null;
  care: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductColorRow = {
  id: string;
  product_id: string;
  color_name: string;
  swatch_hex: string;
  ambient_hex: string;
  cutout_url: string | null;
  sort_order: number;
};

export type ProductVariantRow = {
  id: string;
  product_id: string;
  color_id: string;
  size: GarmentSize;
  sku: string | null;
  price_override: number | null;
  stock_status: StockStatus;
  is_active: boolean;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  color_id: string | null;
  url: string;
  view: ProductView;
  sort_order: number;
  alt: string | null;
};

export type AdminProfileRow = { id: string; full_name: string | null } & Timestamped;

export type AuditLogRow = {
  id: number;
  admin_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
};

/** Proyeccion de lectura: producto + color primario + precio minimo. */
export type ProductCardRow = {
  id: string;
  name: string;
  slug: string;
  headline: string | null;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  sort_order: number;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  primary_color_id: string | null;
  primary_color_name: string | null;
  primary_swatch_hex: string | null;
  primary_ambient_hex: string | null;
  primary_cutout_url: string | null;
  min_price: number | null;
  in_stock: boolean;
  back_url: string | null;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      categories: Table<CategoryRow>;
      collections: Table<CollectionRow>;
      products: Table<ProductRow>;
      product_collections: Table<{
        product_id: string;
        collection_id: string;
        sort_order: number;
      }>;
      product_colors: Table<ProductColorRow>;
      product_variants: Table<ProductVariantRow>;
      product_images: Table<ProductImageRow>;
      admin_profiles: Table<AdminProfileRow>;
      audit_log: Table<AuditLogRow>;
    };
    Views: {
      product_cards: { Row: ProductCardRow; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      effective_price: { Args: { base: number; override: number | null }; Returns: number };
    };
    Enums: {
      stock_status: StockStatus;
      product_view: ProductView;
      garment_size: GarmentSize;
    };
    CompositeTypes: Record<string, never>;
  };
};
