import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import sharp from 'sharp';
import { ambientTokens } from '@/lib/color';
import { publicEnv } from '@/lib/env';
import { getProductBySlug } from '@/lib/queries/products';
import { BRAND_TAGLINE } from '@/lib/tokens';

export const alt = 'Carmisetas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * La tarjeta que se ve cuando alguien comparte una prenda: la prenda recortada
 * sobre su propio color ambiental, igual que en el sitio. Los colores salen de
 * `ambientTokens`, así que el contraste del texto también está resuelto aquí.
 */

/**
 * El recorte tiene que ir embebido.
 *
 * `ImageResponse` no resuelve rutas relativas, y una URL absoluta a nuestro
 * propio sitio obliga al servidor a llamarse a sí mismo: en desarrollo eso
 * falla, y en producción es una ida y vuelta de más. Los archivos de `public`
 * se leen del disco; los de Storage se traen una vez.
 */
async function inlineImage(url: string, siteUrl: string): Promise<string | null> {
  try {
    if (url.startsWith('/')) {
      const file = await readFile(path.join(process.cwd(), 'public', url.replace(/^\//, '')));
      return `data:image/png;base64,${file.toString('base64')}`;
    }
    const response = await fetch(new URL(url, siteUrl), { cache: 'force-cache' });
    if (!response.ok) return null;
    const type = response.headers.get('content-type') ?? 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${type};base64,${buffer.toString('base64')}`;
  } catch {
    // Una tarjeta sin prenda es peor que una tarjeta sin tarjeta, pero fallar
    // la petición entera es peor todavía.
    return null;
  }
}

/**
 * El logotipo, teñido del color que toque.
 *
 * Los archivos de marca son máscaras sin color: aquí hay que pintarlas, porque
 * `ImageResponse` no entiende `mask-image`. Se cachea por color, que en una
 * tarjeta solo hay uno.
 */
const markCache = new Map<string, string | null>();
async function brandMark(ink: string): Promise<string | null> {
  const cached = markCache.get(ink);
  if (cached !== undefined) return cached;
  try {
    const file = path.join(process.cwd(), 'public', 'brand', 'wordmark.png');
    const shape = await sharp(file).resize({ height: 44 }).png().toBuffer();
    const meta = await sharp(shape).metadata();
    const colored = await sharp({
      create: { width: meta.width ?? 1, height: meta.height ?? 1, channels: 4, background: ink },
    })
      .composite([{ input: shape, blend: 'dest-in' }])
      .png()
      .toBuffer();
    const uri = `data:image/png;base64,${colored.toString('base64')}`;
    markCache.set(ink, uri);
    return uri;
  } catch {
    markCache.set(ink, null);
    return null;
  }
}

/** Archivo, la tipografía de la marca. Si no se puede traer, se cae al sistema. */
let fontCache: ArrayBuffer | null | undefined;
async function brandFont(): Promise<ArrayBuffer | null> {
  if (fontCache !== undefined) return fontCache;
  try {
    const css = await fetch('https://fonts.googleapis.com/css2?family=Archivo:wght@800', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'force-cache',
    }).then((r) => r.text());
    const href = /src:\s*url\((https:[^)]+)\)/.exec(css)?.[1];
    fontCache = href ? await fetch(href, { cache: 'force-cache' }).then((r) => r.arrayBuffer()) : null;
  } catch {
    fontCache = null;
  }
  return fontCache ?? null;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const color = product?.colors[0];
  const site = publicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  const font = await brandFont();

  const fonts = font
    ? ([{ name: 'Archivo', data: font, weight: 800 as const, style: 'normal' as const }])
    : undefined;
  const display = font ? 'Archivo' : 'sans-serif';

  if (!product || !color) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FAF8F5',
            color: '#14120F',
            fontFamily: display,
            fontSize: 72,
            letterSpacing: '-0.045em',
          }}
        >
          CARMISETAS
        </div>
      ),
      { ...size, ...(fonts ? { fonts } : {}) },
    );
  }

  const tokens = ambientTokens(color.ambientHex);
  const [cutout, mark] = await Promise.all([
    color.cutoutUrl ? inlineImage(color.cutoutUrl, site) : Promise.resolve(null),
    brandMark(tokens['--ambient-fg']),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: tokens['--ambient'],
          color: tokens['--ambient-fg'],
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 580 }}>
          {mark ? (
            <img src={mark} alt="" width={340} height={21} />
          ) : (
            <div
              style={{
                fontSize: 22,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: tokens['--ambient-muted'],
              }}
            >
              Carmisetas
            </div>
          )}
          <div
            style={{
              marginTop: 10,
              fontSize: 16,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: tokens['--ambient-muted'],
            }}
          >
            {BRAND_TAGLINE}
          </div>
          <div
            style={{
              marginTop: 26,
              fontFamily: display,
              fontSize: 78,
              lineHeight: 0.92,
              letterSpacing: '-0.05em',
              textTransform: 'uppercase',
              fontWeight: 800,
            }}
          >
            {product.name}
          </div>
          <div style={{ marginTop: 24, fontSize: 30, color: tokens['--ambient-muted'] }}>
            {product.headline ?? color.name}
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: display,
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: '-0.04em',
            }}
          >
            {color.price.finalLabel}
          </div>
        </div>

        {cutout ? (
          <img src={cutout} alt="" width={420} height={538} style={{ objectFit: 'contain' }} />
        ) : null}
      </div>
    ),
    { ...size, ...(fonts ? { fonts } : {}) },
  );
}
