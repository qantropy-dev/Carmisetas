-- ============================================================================
--  CARMISETAS · privilegios de tabla
--  El RLS decide QUE filas; el GRANT decide si el rol puede intentarlo.
--  Los dos hacen falta: sin grant, la policy ni se evalua.
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Lectura publica. Las policies ya limitan a lo activo.
grant select on
  public.categories,
  public.collections,
  public.products,
  public.product_collections,
  public.product_colors,
  public.product_variants,
  public.product_images,
  public.product_cards
to anon, authenticated;

-- Escritura: nunca para anon. Para authenticated, la policy exige is_admin().
grant insert, update, delete on
  public.categories,
  public.collections,
  public.products,
  public.product_collections,
  public.product_colors,
  public.product_variants,
  public.product_images
to authenticated;

grant select on public.admin_profiles to authenticated;
grant insert, update, delete on public.admin_profiles to authenticated;
grant select on public.audit_log to authenticated;

-- El publico no tiene nada que hacer en el panel ni en el historial.
revoke all on public.admin_profiles from anon;
revoke all on public.audit_log from anon;
