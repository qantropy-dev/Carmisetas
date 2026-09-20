/**
 * Genera supabase/seed.sql a partir de supabase/seed-data.ts.
 * Los UUID son UUIDv5 derivados del slug: regenerar el archivo no cambia los
 * ids, asi que el diff siempre es legible.
 */
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CATEGORIES, COLLECTIONS, PRODUCTS, SIZES, type Size } from '@/supabase/seed-data';
import { assetPath, slugify } from './seed-paths';

const NAMESPACE = 'c4f1e2a0-7b3d-4c5e-9a10-000000000001';
const DEV_PASSWORD = 'carmisetas-dev';

function uuidv5(name: string): string {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(Buffer.concat([ns, Buffer.from(name, 'utf8')])).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = ((bytes[6] as number) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Escapa a literal SQL. `null` incluido. */
function q(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(Math.round(value));
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${value.replace(/'/g, "''")}'`;
}

const rows = (values: string[][]) => values.map((v) => `  (${v.join(', ')})`).join(',\n');

function colorCode(name: string): string {
  return slugify(name).replace(/-/g, '').slice(0, 3).toUpperCase();
}

function build(): string {
  const out: string[] = [];
  out.push('-- ============================================================================');
  out.push('--  GENERADO por `npm run seed:sql` desde supabase/seed-data.ts — no editar.');
  out.push('-- ============================================================================');
  out.push('');
  out.push('begin;');
  out.push('');
  out.push('truncate table');
  out.push('  public.product_collections, public.product_images, public.product_variants,');
  out.push('  public.product_colors, public.products, public.collections, public.categories');
  out.push('restart identity cascade;');
  out.push('');

  // ------------------------------------------------------------ taxonomia --
  out.push('insert into public.categories (id, name, slug, sort_order) values');
  out.push(
    rows(
      CATEGORIES.map((c, i) => [q(uuidv5(`category:${c.slug}`)), q(c.name), q(c.slug), q(i)]),
    ) + ';',
  );
  out.push('');
  out.push('insert into public.collections (id, name, slug, sort_order) values');
  out.push(
    rows(
      COLLECTIONS.map((c, i) => [q(uuidv5(`collection:${c.slug}`)), q(c.name), q(c.slug), q(i)]),
    ) + ';',
  );
  out.push('');

  // ------------------------------------------------------------- productos --
  out.push(
    'insert into public.products (id, name, slug, headline, description, category_id,',
  );
  out.push(
    '  base_price, compare_at_price, fit, material, care, is_active, is_featured, sort_order) values',
  );
  out.push(
    rows(
      PRODUCTS.map((p, i) => [
        q(uuidv5(`product:${p.slug}`)),
        q(p.name),
        q(p.slug),
        q(p.headline),
        q(p.description),
        q(uuidv5(`category:${p.category}`)),
        q(p.basePrice),
        q(p.compareAtPrice ?? null),
        q(p.fit),
        q(p.material),
        q(p.care),
        'true',
        q(p.isFeatured),
        q(i),
      ]),
    ) + ';',
  );
  out.push('');

  out.push('insert into public.product_collections (product_id, collection_id, sort_order) values');
  out.push(
    rows(
      PRODUCTS.flatMap((p) =>
        p.collections.map((c, i) => [
          q(uuidv5(`product:${p.slug}`)),
          q(uuidv5(`collection:${c}`)),
          q(i),
        ]),
      ),
    ) + ';',
  );
  out.push('');

  // ---------------------------------------------------------------- color --
  out.push(
    'insert into public.product_colors (id, product_id, color_name, swatch_hex, ambient_hex, cutout_url, sort_order) values',
  );
  out.push(
    rows(
      PRODUCTS.flatMap((p) =>
        p.colors.map((c, i) => [
          q(uuidv5(`color:${p.slug}:${slugify(c.name)}`)),
          q(uuidv5(`product:${p.slug}`)),
          q(c.name),
          q(c.swatch),
          q(c.ambient),
          q(assetPath(p.slug, c.name, 'frente')),
          q(i),
        ]),
      ),
    ) + ';',
  );
  out.push('');

  // ------------------------------------------------------------ variantes --
  out.push(
    'insert into public.product_variants (id, product_id, color_id, size, sku, price_override, stock_status, is_active) values',
  );
  out.push(
    rows(
      PRODUCTS.flatMap((p) =>
        p.colors.flatMap((c) =>
          SIZES.map((size: Size) => [
            q(uuidv5(`variant:${p.slug}:${slugify(c.name)}:${size}`)),
            q(uuidv5(`product:${p.slug}`)),
            q(uuidv5(`color:${p.slug}:${slugify(c.name)}`)),
            q(size),
            q(`${slugify(p.slug).split('-').pop()?.toUpperCase()}-${colorCode(c.name)}-${size}`),
            q(c.priceOverride?.[size] ?? null),
            q(c.stock?.[size] ?? 'disponible'),
            'true',
          ]),
        ),
      ),
    ) + ';',
  );
  out.push('');

  // ------------------------------------------------------------- imagenes --
  const views = [
    { view: 'frente', label: 'de frente' },
    { view: 'espalda', label: 'por la espalda' },
    { view: 'detalle', label: 'detalle del cuello' },
  ] as const;
  out.push(
    'insert into public.product_images (id, product_id, color_id, url, view, sort_order, alt) values',
  );
  out.push(
    rows(
      PRODUCTS.flatMap((p) =>
        p.colors.flatMap((c) =>
          views.map((v, i) => [
            q(uuidv5(`image:${p.slug}:${slugify(c.name)}:${v.view}`)),
            q(uuidv5(`product:${p.slug}`)),
            q(uuidv5(`color:${p.slug}:${slugify(c.name)}`)),
            q(assetPath(p.slug, c.name, v.view)),
            q(v.view),
            q(i),
            q(`${p.name} en color ${c.name}, ${v.label}`),
          ]),
        ),
      ),
    ) + ';',
  );
  out.push('');

  // El seed dispara los triggers de auditoria; el historial arranca limpio.
  out.push('delete from public.audit_log;');
  out.push('');
  out.push('commit;');
  out.push('');
  out.push(adminBlock());
  return out.join('\n');
}

/**
 * Dos cuentas de admin SOLO para desarrollo local (`supabase db reset`).
 * En produccion se crean con `npm run admin:create` usando la service key;
 * este bloque no se ejecuta alli porque seed.sql no corre contra remoto.
 */
function adminBlock(): string {
  const accounts = [
    { email: 'admin@carmisetas.local', name: 'Admin Uno' },
    { email: 'taller@carmisetas.local', name: 'Admin Dos' },
  ];
  const lines = accounts
    .map(({ email, name }) => {
      const id = uuidv5(`admin:${email}`);
      return `
  -- ${email}  /  contrasena: ${DEV_PASSWORD}
  -- Los cuatro campos de token van en cadena vacia, NUNCA en null: GoTrue los
  -- lee como string de Go y un null revienta el login con
  -- "converting NULL to string is unsupported".
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', ${q(id)}, 'authenticated', 'authenticated',
    ${q(email)}, extensions.crypt(${q(DEV_PASSWORD)}, extensions.gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false,
    '', '', '', ''
  ) on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), ${q(id)}, ${q(id)},
    jsonb_build_object('sub', ${q(id)}, 'email', ${q(email)}, 'email_verified', true),
    'email', now(), now(), now()
  ) on conflict do nothing;

  insert into public.admin_profiles (id, full_name)
  values (${q(id)}, ${q(name)}) on conflict (id) do nothing;`;
    })
    .join('\n');

  return `-- ---------------------------------------------------------------------------
-- ADMINS DE DESARROLLO LOCAL. No se usan en produccion: alli las cuentas se
-- crean con \`npm run admin:create\`, que exige la service_role key.
-- ---------------------------------------------------------------------------
${lines}
`;
}

async function main() {
  const file = path.join(process.cwd(), 'supabase', 'seed.sql');
  await writeFile(file, build(), 'utf8');
  const variants = PRODUCTS.reduce((acc, p) => acc + p.colors.length * SIZES.length, 0);
  const colors = PRODUCTS.reduce((acc, p) => acc + p.colors.length, 0);
  console.log(
    `supabase/seed.sql · ${PRODUCTS.length} prendas · ${colors} colores · ${variants} variantes · ${colors * 3} imagenes`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
