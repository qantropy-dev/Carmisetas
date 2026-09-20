'use client';

/**
 * Variables públicas para el cliente.
 *
 * Next sustituye los `process.env.NEXT_PUBLIC_*` en tiempo de build, así que
 * hay que nombrarlos literalmente: una lectura dinámica se queda en undefined.
 */
export function publicEnvClient(): { whatsapp: string | undefined; siteUrl: string } {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return {
    whatsapp: whatsapp && whatsapp.trim() !== '' ? whatsapp : undefined,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  };
}
