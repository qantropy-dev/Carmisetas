'use server';

import { redirect } from 'next/navigation';
import { hasSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { credentialsSchema } from '@/lib/validators/auth';

export type LoginState = {
  error: string | null;
  /**
   * El correo vuelve al formulario a propósito. React 19 resetea el formulario
   * al terminar la acción y el campo queda vacío; devolverlo desde el servidor
   * lo repone, y además hace que el formulario funcione sin JavaScript.
   */
  email: string;
};

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!hasSupabaseConfig()) {
    return { error: 'Supabase no está configurado. Copia .env.example a .env.local.', email };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Revisa los datos', email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  // Mensaje deliberadamente vago: no confirmamos si el correo existe.
  if (error || !data.user) return { error: 'Correo o contraseña incorrectos', email };

  // Autenticarse no es ser admin. Sin fila en admin_profiles, no se entra.
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: 'Esta cuenta no tiene acceso al panel', email };
  }

  const target = parsed.data.next && parsed.data.next !== '' ? parsed.data.next : '/admin/prendas';
  redirect(target);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
