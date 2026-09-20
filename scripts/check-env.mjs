/**
 * Dice qué falta para desplegar, antes de descubrirlo en producción.
 *
 *   npm run check
 */
const REQUIRED = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'URL del proyecto de Supabase', true],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Clave pública (anon) de Supabase', true],
  ['SUPABASE_SERVICE_ROLE_KEY', 'Clave service_role — SOLO servidor', true],
  ['NEXT_PUBLIC_SITE_URL', 'URL pública del sitio, sin barra final', true],
  ['NEXT_PUBLIC_WHATSAPP_NUMBER', 'Número de WhatsApp: indicativo + número, sin +', false],
  ['NEXT_PUBLIC_IMGLY_PUBLIC_PATH', 'Espejo local del modelo de recorte (opcional)', false],
];

let missing = 0;
let warnings = 0;

console.log('\nVariables de entorno\n');

for (const [name, what, required] of REQUIRED) {
  const value = process.env[name];
  const set = Boolean(value && value.trim() !== '');
  const mark = set ? 'ok  ' : required ? 'FALTA' : '—   ';
  if (!set && required) missing += 1;
  if (!set && !required) warnings += 1;
  console.log(`  ${mark} ${name.padEnd(32)} ${what}`);
}

const site = process.env.NEXT_PUBLIC_SITE_URL;
if (site?.endsWith('/')) {
  console.log('\n  Aviso: NEXT_PUBLIC_SITE_URL no debe terminar en barra.');
  warnings += 1;
}

const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
if (phone && !/^\d{8,15}$/.test(phone)) {
  console.log('\n  Aviso: el número de WhatsApp debe ser solo dígitos, con indicativo y sin «+».');
  warnings += 1;
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ===
    process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n  ERROR: la clave pública y la service_role son la misma. Revísalas.');
  missing += 1;
}

console.log(
  missing > 0
    ? `\nFaltan ${missing} variables obligatorias.\n`
    : warnings > 0
      ? '\nListo para desplegar, con avisos.\n'
      : '\nTodo en orden.\n',
);
process.exit(missing > 0 ? 1 : 0);
