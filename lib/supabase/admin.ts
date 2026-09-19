import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';
import type { Database } from './database.types';

/**
 * Cliente con service_role: SALTA RLS.
 *
 * Solo para lo que no puede pasar por el usuario: crear cuentas de admin y
 * scripts de mantenimiento. Nunca se importa desde un componente de cliente
 * ('server-only' lo hace fallar en build si alguien lo intenta).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
