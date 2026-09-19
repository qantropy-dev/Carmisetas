import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todo menos estaticos e imagenes. El sitio publico tambien pasa por aqui
     * para que la sesion se refresque sola y no caduque a mitad de sesion.
     */
    '/((?!_next/static|_next/image|favicon.ico|seed/|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|woff2?)$).*)',
  ],
};
