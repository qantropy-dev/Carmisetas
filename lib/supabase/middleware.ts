import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseConfig, publicEnv } from '@/lib/env';
import type { Database } from './database.types';

export const ADMIN_LOGIN_PATH = '/admin/login';

/**
 * Refresca la sesion en cada navegacion y cierra /admin/* a quien no sea admin.
 *
 * Importante: se usa `getUser()` (valida el JWT contra el servidor de auth) y
 * no `getSession()`, que solo lee la cookie y es falsificable.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  if (!hasSupabaseConfig()) {
    // Sin credenciales el admin no puede autenticar a nadie: mejor cerrarlo.
    if (isAdminRoute && request.nextUrl.pathname !== ADMIN_LOGIN_PATH) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const env = publicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminRoute) return response;

  const onLoginPage = request.nextUrl.pathname === ADMIN_LOGIN_PATH;

  if (!user) {
    if (onLoginPage) return response;
    const url = new URL(ADMIN_LOGIN_PATH, request.url);
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Estar autenticado no basta: hay que figurar en admin_profiles.
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    const url = new URL(ADMIN_LOGIN_PATH, request.url);
    url.searchParams.set('error', 'sin-acceso');
    return NextResponse.redirect(url);
  }

  if (onLoginPage) {
    return NextResponse.redirect(new URL('/admin/prendas', request.url));
  }

  return response;
}
