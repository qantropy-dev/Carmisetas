import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '@/lib/env';
import type { Database } from './database.types';

/**
 * Cliente de servidor ligado a las cookies de la peticion. Respeta RLS: lo que
 * no puede ver el usuario, no llega.
 */
export async function createClient() {
  const store = await cookies();
  const env = publicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) store.set(name, value, options);
          } catch {
            // Un Server Component no puede escribir cookies: el refresco de
            // sesion lo hace middleware.ts, asi que aqui se puede ignorar.
          }
        },
      },
    },
  );
}
