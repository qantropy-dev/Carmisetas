-- ============================================================================
--  CARMISETAS · updated_at + historial de cambios
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Guarda en audit_log SOLO las claves que realmente cambiaron, como
--   { "base_price": { "old": 89900, "new": 79900 } }
-- Asi el historial de precios se lee de un vistazo.
-- ---------------------------------------------------------------------------
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_row jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  changes jsonb := '{}'::jsonb;
  k       text;
begin
  for k in select jsonb_object_keys(old_row || new_row) loop
    if k not in ('updated_at', 'created_at')
       and (old_row -> k) is distinct from (new_row -> k) then
      changes := changes || jsonb_build_object(
        k, jsonb_build_object('old', old_row -> k, 'new', new_row -> k)
      );
    end if;
  end loop;

  if tg_op = 'UPDATE' and changes = '{}'::jsonb then
    return null;                       -- update sin cambios reales: no ensucia
  end if;

  insert into public.audit_log (admin_id, action, entity, entity_id, diff)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce((new_row ->> 'id')::uuid, (old_row ->> 'id')::uuid),
    changes
  );
  return null;
end;
$$;

create trigger products_audit
  after insert or update or delete on public.products
  for each row execute function public.log_audit();

create trigger product_variants_audit
  after insert or update or delete on public.product_variants
  for each row execute function public.log_audit();

create trigger product_colors_audit
  after insert or update or delete on public.product_colors
  for each row execute function public.log_audit();
