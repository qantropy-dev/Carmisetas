import { z } from 'zod';

/**
 * Variables de entorno.
 *
 * La validacion es perezosa a proposito: `next build` tiene que poder correr en
 * CI sin credenciales, pero en cuanto algo pide la URL de Supabase en runtime
 * queremos un error claro y no un `undefined` viajando hacia dentro.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: 'NEXT_PUBLIC_SUPABASE_URL debe ser una URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  /** Solo digitos, con indicativo de pais y sin +. Ej: 573001234567 */
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().regex(/^\d{8,15}$/).optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// Next reemplaza los NEXT_PUBLIC_* en build time, asi que hay que nombrarlos.
const rawPublic = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
};

function parse<T extends z.ZodType>(schema: T, raw: unknown, scope: string): z.infer<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  · ${issue.path.join('.') || scope}: ${issue.message}`)
      .join('\n');
    throw new Error(`Faltan variables de entorno (${scope}):\n${detail}\n\nCopia .env.example a .env.local.`);
  }
  return result.data;
}

let publicCache: z.infer<typeof publicSchema> | null = null;
export function publicEnv() {
  publicCache ??= parse(publicSchema, rawPublic, 'cliente');
  return publicCache;
}

let serverCache: z.infer<typeof serverSchema> | null = null;
export function serverEnv() {
  serverCache ??= parse(
    serverSchema,
    { SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY },
    'servidor',
  );
  return serverCache;
}

/** true cuando hay credenciales; permite renderizar estados vacios en vez de reventar. */
export function hasSupabaseConfig(): boolean {
  return Boolean(rawPublic.NEXT_PUBLIC_SUPABASE_URL && rawPublic.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
