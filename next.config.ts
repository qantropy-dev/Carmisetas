import type { NextConfig } from 'next';

/**
 * `@imgly/background-removal` corre WASM multi-hilo en el navegador y sólo
 * habilita los hilos cuando la página está cross-origin isolated. Los headers
 * COOP/COEP se aplican SÓLO bajo /admin para no romper nada del sitio público.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
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
