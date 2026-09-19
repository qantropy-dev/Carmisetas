-- ============================================================================
--  CARMISETAS · esquema base
--  Precios en COP como enteros (sin decimales). Precio final = override ?? base.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- enums ----
create type public.stock_status as enum ('disponible', 'pocas', 'agotado');
create type public.product_view as enum ('frente', 'espalda', 'detalle', 'modelo');
-- El orden de declaracion del enum ES el orden de display de las tallas.
create type public.garment_size as enum ('S', 'M', 'L', 'XL', 'XXL');

-- ----------------------------------------------------------- taxonomia ----
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order int  not null default 0
);

-- Alimenta los tabs horizontales de Total Look.
create table public.collections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order int  not null default 0
);

-- ------------------------------------------------------------ productos ----
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  headline         text,                                  -- titular del hero
  description      text,
  category_id      uuid references public.categories (id) on delete set null,
  base_price       int  not null check (base_price >= 0),
  compare_at_price int  check (compare_at_price >= 0),
  fit              text,
  material         text,
  care             text,
  is_active        boolean not null default true,
  is_featured      boolean not null default false,
  sort_order       int     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint products_compare_gt_base check (
    compare_at_price is null or compare_at_price > base_price
  )
);

create table public.product_collections (
  product_id    uuid not null references public.products (id)    on delete cascade,
  collection_id uuid not null references public.collections (id) on delete cascade,
  sort_order    int  not null default 0,
  primary key (product_id, collection_id)
);

-- --------------------------------------------------------------- color ----
-- ambient_hex es la mecanica del sitio: el fondo entero adopta este color.
create table public.product_colors (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  color_name  text not null,
  swatch_hex  text not null check (swatch_hex  ~* '^#[0-9a-f]{6}$'),
  ambient_hex text not null check (ambient_hex ~* '^#[0-9a-f]{6}$'),
  cutout_url  text,                                       -- recorte que "flota"
  sort_order  int  not null default 0,
  unique (product_id, color_name),
  -- Habilita las FK compuestas de variantes e imagenes: garantiza en la base
  -- que un variant nunca apunte a un color de OTRO producto.
  unique (id, product_id)
);

-- ------------------------------------------------------------ variantes ----
create table public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null,
  color_id       uuid not null,
  size           public.garment_size not null,
  sku            text unique,
  price_override int check (price_override >= 0),
  stock_status   public.stock_status not null default 'disponible',
  is_active      boolean not null default true,
  unique (product_id, color_id, size),
  foreign key (product_id)           references public.products (id) on delete cascade,
  foreign key (color_id, product_id) references public.product_colors (id, product_id) on delete cascade
);

-- ------------------------------------------------------------- imagenes ----
create table public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  color_id   uuid,
  url        text not null,
  view       public.product_view not null,
  sort_order int  not null default 0,
  alt        text,
  foreign key (product_id)           references public.products (id) on delete cascade,
  foreign key (color_id, product_id) references public.product_colors (id, product_id) on delete cascade
);

-- ----------------------------------------------------------------- admin ----
create table public.admin_profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id         bigint generated always as identity primary key,
  admin_id   uuid references auth.users (id) on delete set null,
  action     text not null,          -- insert | update | delete | bulk_price
  entity     text not null,
  entity_id  uuid,
  diff       jsonb,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- indices ----
create index products_active_featured_idx on public.products (is_active, is_featured, sort_order);
create index products_category_idx        on public.products (category_id);
create index product_colors_product_idx   on public.product_colors (product_id, sort_order);
create index product_variants_product_idx on public.product_variants (product_id, color_id);
create index product_images_lookup_idx    on public.product_images (product_id, color_id, sort_order);
create index product_collections_col_idx  on public.product_collections (collection_id, sort_order);
create index audit_log_recent_idx         on public.audit_log (created_at desc);

-- -------------------------------------------------------------- pricing ----
-- Misma regla que lib/pricing.ts, para que la base y la UI no se separen.
create or replace function public.effective_price(base int, override int)
returns int language sql immutable parallel safe
as $$ select coalesce(override, base) $$;

-- ------------------------------------------------------------- vista UI ----
-- Una sola consulta alimenta la grilla, el perchero y el hero.
-- security_invoker: la vista respeta el RLS del que consulta, no el del owner.
create view public.product_cards with (security_invoker = on) as
select
  p.id,
  p.name,
  p.slug,
  p.headline,
  p.description,
  p.base_price,
  p.compare_at_price,
  p.is_featured,
  p.sort_order,
  p.category_id,
  c.slug as category_slug,
  c.name as category_name,
  pc.id          as primary_color_id,
  pc.color_name  as primary_color_name,
  pc.swatch_hex  as primary_swatch_hex,
  pc.ambient_hex as primary_ambient_hex,
  pc.cutout_url  as primary_cutout_url,
  (
    select min(public.effective_price(p.base_price, v.price_override))
      from public.product_variants v
     where v.product_id = p.id and v.is_active
  ) as min_price,
  coalesce((
    select bool_or(v.stock_status <> 'agotado')
      from public.product_variants v
     where v.product_id = p.id and v.is_active
  ), false) as in_stock,
  (
    select i.url
      from public.product_images i
     where i.product_id = p.id
       and i.view = 'espalda'
       and (i.color_id = pc.id or i.color_id is null)
     order by i.sort_order
     limit 1
  ) as back_url
from public.products p
left join public.categories c on c.id = p.category_id
left join lateral (
  select x.*
    from public.product_colors x
   where x.product_id = p.id
   order by x.sort_order, x.color_name
   limit 1
) pc on true;

comment on view public.product_cards is
  'Proyeccion de lectura para grilla/perchero/hero: producto + color primario + precio minimo efectivo.';
