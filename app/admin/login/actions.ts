'use server';

import { redirect } from 'next/navigation';
import { hasSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { credentialsSchema } from '@/lib/validators/auth';

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!hasSupabaseConfig()) {
    return { error: 'Supabase no está configurado. Copia .env.example a .env.local.' };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  // Mensaje deliberadamente vago: no confirmamos si el correo existe.
  if (error || !data.user) return { error: 'Correo o contraseña incorrectos' };

  // Autenticarse no es ser admin. Sin fila en admin_profiles, no se entra.
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: 'Esta cuenta no tiene acceso al panel' };
  }

  const target = parsed.data.next && parsed.data.next !== '' ? parsed.data.next : '/admin/prendas';
  redirect(target);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
