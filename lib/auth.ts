import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AdminUser = { id: string; email: string; fullName: string | null };

/**
 * Defensa en profundidad. El middleware ya cierra /admin/*, pero una Server
 * Action se puede invocar directamente: cada mutacion vuelve a comprobar aqui.
 */
export const requireAdmin = cache(async (): Promise<AdminUser> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/admin/login?error=sin-acceso');

  return { id: user.id, email: user.email ?? '', fullName: profile.full_name };
});
