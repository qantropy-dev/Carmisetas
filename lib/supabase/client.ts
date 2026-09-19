'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';
import type { Database } from './database.types';

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Cliente de navegador. Una sola instancia por pestana. */
export function createClient() {
  if (!cached) {
    const env = publicEnv();
    cached = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return cached;
}
