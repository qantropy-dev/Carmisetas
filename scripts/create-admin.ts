/**
 * Crea (o promueve) una cuenta de admin en el proyecto configurado.
 *
 *   npm run admin:create -- correo@dominio.com "Nombre Apellido"
 *
 * Usa la service_role key, asi que solo se corre desde una maquina de
 * confianza. No hay registro publico: este script y el seed local son las dos
 * unicas formas de que exista un admin.
 */
import { randomBytes } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

function generatePassword(): string {
  return randomBytes(18).toString('base64url');
}

async function main() {
  const [email, fullName] = process.argv.slice(2);
  if (!email) {
    console.error('Uso: npm run admin:create -- correo@dominio.com "Nombre Apellido"');
    process.exit(1);
  }

  const supabase = createAdminClient();

  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  let userId = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  let password: string | null = null;

  if (!userId) {
    password = generatePassword();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error: profileError } = await supabase
    .from('admin_profiles')
    .upsert({ id: userId, full_name: fullName ?? null }, { onConflict: 'id' });
  if (profileError) throw profileError;

  const { count } = await supabase
    .from('admin_profiles')
    .select('id', { count: 'exact', head: true });

  console.log(`\n  ${email} tiene acceso al panel.`);
  if (password) console.log(`  Contraseña temporal: ${password}`);
  console.log(`  Admins en total: ${count ?? '?'}\n`);
  if ((count ?? 0) > 2) {
    console.warn('  Aviso: el acuerdo era exactamente 2 cuentas. Revisa admin_profiles.\n');
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
