import type { NextConfig } from 'next';

/**
 * Storage sirve las imagenes desde el propio proyecto de Supabase, asi que el
 * host permitido sale de la URL configurada: en produccion es *.supabase.co y
 * en local, 127.0.0.1:54321. Fijar solo el dominio de produccion rompe el
 * admin en cuanto alguien sube una foto trabajando en local.
 */
function supabaseImagePatterns(): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> {
  const patterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
  ];

  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (configured) {
    try {
      const url = new URL(configured);
      patterns.push({
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: '/storage/v1/object/public/**',
      });
    } catch {
      // Una URL mal escrita ya la reporta lib/env.ts con un mensaje claro.
    }
  }

  return patterns;
}

/**
 * `@imgly/background-removal` corre WASM multi-hilo en el navegador y sólo
 * habilita los hilos cuando la página está cross-origin isolated. Los headers
 * COOP/COEP se aplican SÓLO bajo /admin para no romper nada del sitio público.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // El indicador de desarrollo se planta justo encima de las flechas del hero.
  // Los problemas siguen saliendo por build, lint y typecheck.
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabaseImagePatterns(),
  },
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
