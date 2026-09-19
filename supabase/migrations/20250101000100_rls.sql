-- ============================================================================
--  CARMISETAS · Row Level Security
--  Regla: el publico SOLO lee registros activos. Solo admin_profiles escribe.
-- ============================================================================

-- security definer + search_path fijo: evita la recursion infinita que
-- provocaria consultar admin_profiles desde su propia policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admin_profiles ap where ap.id = auth.uid());
$$;

revoke execute on function public.is_admin() from public;
grant  execute on function public.is_admin() to authenticated, anon;

alter table public.categories          enable row level security;
alter table public.collections         enable row level security;
alter table public.products            enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_colors      enable row level security;
alter table public.product_variants    enable row level security;
alter table public.product_images      enable row level security;
alter table public.admin_profiles      enable row level security;
alter table public.audit_log           enable row level security;

-- ------------------------------------------------------------ taxonomia ----
create policy categories_public_read on public.categories
  for select to anon, authenticated using (true);
create policy categories_admin_all on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy collections_public_read on public.collections
  for select to anon, authenticated using (true);
create policy collections_admin_all on public.collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- productos ----
create policy products_public_read on public.products
  for select to anon, authenticated using (is_active);
create policy products_admin_all on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy product_collections_public_read on public.product_collections
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
     where p.id = product_collections.product_id and p.is_active
  ));
create policy product_collections_admin_all on public.product_collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- color ----
create policy product_colors_public_read on public.product_colors
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
     where p.id = product_colors.product_id and p.is_active
  ));
create policy product_colors_admin_all on public.product_colors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ variantes ----
create policy product_variants_public_read on public.product_variants
  for select to anon, authenticated
  using (is_active and exists (
    select 1 from public.products p
     where p.id = product_variants.product_id and p.is_active
  ));
create policy product_variants_admin_all on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- imagenes ----
create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
     where p.id = product_images.product_id and p.is_active
  ));
create policy product_images_admin_all on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------- admin ----
-- Nadie del publico ve la lista de admins. Cada admin se ve a si mismo.
create policy admin_profiles_self_read on public.admin_profiles
  for select to authenticated using (id = auth.uid());
create policy admin_profiles_admin_all on public.admin_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- El historial se lee desde el panel; se escribe SOLO por trigger.
create policy audit_log_admin_read on public.audit_log
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------- storage ----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products', 'products', true, 10485760,
  array['image/png', 'image/webp', 'image/avif', 'image/jpeg']
)
on conflict (id) do nothing;

create policy products_bucket_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'products');

create policy products_bucket_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_admin());

create policy products_bucket_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

create policy products_bucket_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_admin());
