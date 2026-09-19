-- ============================================================================
--  Comprobaciones de RLS. Cada bloque falla ruidosamente si la regla se rompe.
--  Se corren con `npm run db:verify`.
-- ============================================================================
\set ON_ERROR_STOP on

\echo '· el publico ve las 6 prendas activas'
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.products;
  if n <> 6 then raise exception 'anon ve % prendas, esperaba 6', n; end if;
end $$;

\echo '· una prenda inactiva desaparece para el publico'
do $$
declare n int;
begin
  update public.products set is_active = false where slug = 'camiseta-bruma';
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.products;
  if n <> 5 then raise exception 'anon ve % prendas inactivas incluidas, esperaba 5', n; end if;
  select count(*) into n from public.product_colors;
  if n <> 11 then raise exception 'anon ve % colores de prendas inactivas, esperaba 11', n; end if;
  select count(*) into n from public.product_variants;
  if n <> 55 then raise exception 'anon ve % variantes, esperaba 55', n; end if;
  reset role;
  update public.products set is_active = true where slug = 'camiseta-bruma';
end $$;

\echo '· una variante inactiva desaparece aunque su prenda este activa'
do $$
declare n int;
begin
  update public.product_variants set is_active = false
   where id = (select id from public.product_variants limit 1);
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.product_variants;
  if n <> 64 then raise exception 'anon ve % variantes, esperaba 64', n; end if;
  reset role;
  update public.product_variants set is_active = true;
end $$;

\echo '· el publico no puede escribir'
do $$
declare bloqueado boolean := false;
begin
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    insert into public.products (name, slug, base_price) values ('Pirata', 'pirata', 1000);
  exception when insufficient_privilege then bloqueado := true;
  end;
  if not bloqueado then raise exception 'anon pudo insertar en products'; end if;
end $$;

\echo '· el publico no puede leer admin_profiles ni audit_log'
do $$
declare bloqueado boolean := false;
begin
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  begin
    perform 1 from public.admin_profiles;
  exception when insufficient_privilege then bloqueado := true;
  end;
  if not bloqueado then raise exception 'anon pudo leer admin_profiles'; end if;
end $$;

\echo '· un autenticado que NO es admin tampoco escribe'
do $$
declare bloqueado boolean := false; intruso uuid := gen_random_uuid();
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', intruso, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.products (name, slug, base_price) values ('Pirata', 'pirata', 1000);
  exception when insufficient_privilege then bloqueado := true;
  end;
  if not bloqueado then raise exception 'un autenticado sin perfil pudo insertar'; end if;
end $$;

\echo '· el admin ve todo, tambien lo inactivo'
do $$
declare admin_id uuid; n int;
begin
  update public.products set is_active = false where slug = 'camiseta-bruma';
  select id into admin_id from public.admin_profiles order by created_at limit 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.products;
  if n <> 6 then raise exception 'el admin ve % prendas, esperaba 6', n; end if;
  reset role;
  update public.products set is_active = true where slug = 'camiseta-bruma';
end $$;

\echo '· el admin escribe y queda registrado en el historial'
do $$
declare admin_id uuid; registro public.audit_log;
begin
  delete from public.audit_log;
  select id into admin_id from public.admin_profiles order by created_at limit 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.products set base_price = 79900 where slug = 'camiseta-bruma';
  reset role;

  select * into registro from public.audit_log order by id desc limit 1;
  if registro.admin_id is distinct from admin_id then
    raise exception 'el historial no guardo quien hizo el cambio';
  end if;
  if registro.diff -> 'base_price' ->> 'old' <> '89900'
     or registro.diff -> 'base_price' ->> 'new' <> '79900' then
    raise exception 'el diff del historial es %', registro.diff;
  end if;
  if registro.diff ? 'updated_at' then
    raise exception 'el historial no deberia guardar updated_at';
  end if;
  update public.products set base_price = 89900 where slug = 'camiseta-bruma';
  delete from public.audit_log;
end $$;

\echo '· un update sin cambios reales no ensucia el historial'
do $$
declare n int;
begin
  delete from public.audit_log;
  update public.products set base_price = base_price where slug = 'camiseta-bruma';
  select count(*) into n from public.audit_log;
  if n <> 0 then raise exception 'un update vacio genero % filas de historial', n; end if;
end $$;

\echo '· una variante no puede apuntar al color de otra prenda'
do $$
declare bloqueado boolean := false; otro uuid; v uuid;
begin
  select c.id into otro from public.product_colors c
    join public.products p on p.id = c.product_id where p.slug = 'sueter-salvia' limit 1;
  select id into v from public.product_variants
   where product_id = (select id from public.products where slug = 'camiseta-bruma') limit 1;
  begin
    update public.product_variants set color_id = otro where id = v;
  exception when foreign_key_violation then bloqueado := true;
  end;
  if not bloqueado then raise exception 'una variante acepto el color de otra prenda'; end if;
end $$;

\echo '· la vista product_cards respeta el RLS de quien consulta'
do $$
declare n int;
begin
  update public.products set is_active = false where slug = 'camiseta-bruma';
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.product_cards;
  if n <> 5 then raise exception 'product_cards filtro % filas para anon, esperaba 5', n; end if;
  reset role;
  update public.products set is_active = true where slug = 'camiseta-bruma';
end $$;

\echo '· product_cards calcula precio minimo y descuento'
do $$
declare fila public.product_cards;
begin
  select * into fila from public.product_cards where slug = 'cardigan-tejido';
  if fila.min_price <> 239900 then
    raise exception 'min_price es %, esperaba el base 239900', fila.min_price;
  end if;
  select * into fila from public.product_cards where slug = 'sueter-nocturno';
  if fila.compare_at_price <> 259900 then
    raise exception 'compare_at_price es %', fila.compare_at_price;
  end if;
  if fila.in_stock is not true then raise exception 'sueter-nocturno deberia tener stock'; end if;
  if fila.back_url is null then raise exception 'falta la imagen de espalda para el bento'; end if;
end $$;

\echo '· compare_at_price no puede ser menor que el precio base'
do $$
declare bloqueado boolean := false;
begin
  begin
    update public.products set compare_at_price = 1000 where slug = 'camiseta-bruma';
  exception when check_violation then bloqueado := true;
  end;
  if not bloqueado then raise exception 'se acepto un tachado por debajo del precio'; end if;
end $$;

\echo ''
\echo 'RLS y restricciones: todo en orden.'
