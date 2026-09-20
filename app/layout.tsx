import type { Metadata, Viewport } from 'next';
import { Archivo, Inter } from 'next/font/google';
import { tokensToCss } from '@/lib/color';
import { BRAND } from '@/lib/tokens';
import './globals.css';

// Tipografia provisional: se cambia junto con la paleta cuando la marca cierre
// su identidad. Igual que los colores, vive en un solo sitio.
const display = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

/** Los neutros de marca, servidos desde lib/tokens.ts. Sin parpadeo. */
const BRAND_CSS = tokensToCss({
  '--brand-bg': BRAND.bg,
  '--brand-fg': BRAND.fg,
  '--brand-accent': BRAND.accent,
  '--brand-muted': BRAND.muted,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Carmisetas', template: '%s · Carmisetas' },
  description: 'Camisetas y suéteres. La prenda, sin ruido alrededor.',
};

export const viewport: Viewport = {
  themeColor: BRAND.bg,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable}`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: BRAND_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
