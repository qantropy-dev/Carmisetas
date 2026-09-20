import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import type { Database } from './database.types';

/**
 * Cliente anónimo sin cookies.
 *
 * `generateStaticParams` y el sitemap corren fuera de una petición, así que no
 * pueden leer cookies. Usan la misma clave pública que el navegador, con lo
 * cual siguen viendo solo lo que el RLS deja ver al público.
 */
export function createStaticClient() {
  const env = publicEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
