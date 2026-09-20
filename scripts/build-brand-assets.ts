/**
 * Extrae los assets del logo de la lámina de identidad.
 *
 *   npm run brand
 *
 * Salen como MÁSCARAS ALFA: los píxeles llevan el color en negro y la forma en
 * el canal alfa. En CSS se usan con `mask-image` y `background-color:
 * currentColor`, así el logo adopta el color del escenario en el que esté, que
 * en este sitio cambia con cada prenda. Un PNG de color fijo obligaría a tener
 * dos versiones y a acertar cuál toca en cada fondo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { BRAND } from '@/lib/tokens';

const SRC = path.join(process.cwd(), 'brand', 'carmisetas-identidad.jpg');
const OUT = path.join(process.cwd(), 'public', 'brand');

/** Recortes medidos sobre la lámina original (1536 × 1024). */
const PIECES = {
  wordmark: { left: 316, top: 311, width: 945, height: 60 },
  isotipo: { left: 719, top: 70, width: 98, height: 220 },
  monograma: { left: 1190, top: 600, width: 121, height: 89 },
} as const;

/**
 * El fondo crema del JPEG no es blanco puro y deja una bruma sobre toda la
 * caja. La curva lleva ese gris a cero y deja la tinta en opaco.
 */
const BLACK_POINT = 30;
const INK_POINT = 240;

async function mask(name: string, box: { left: number; top: number; width: number; height: number }) {
  const { data, info } = await sharp(SRC)
    .extract(box)
    .greyscale()
    .negate()
    .linear(255 / (INK_POINT - BLACK_POINT), (-255 * BLACK_POINT) / (INK_POINT - BLACK_POINT))
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i += 1) {
    rgba[i * 4 + 3] = data[i] as number; // negro con la forma en el alfa
  }

  const file = path.join(OUT, `${name}.png`);
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 2 })
    .png({ compressionLevel: 9 })
    .toFile(file);

  const meta = await sharp(file).metadata();
  console.log(`  ${name.padEnd(12)} ${meta.width}×${meta.height}`);
  return { name, width: meta.width ?? 0, height: meta.height ?? 0 };
}

/**
 * Iconos de pestaña y de pantalla de inicio, a partir del monograma.
 * Van con color fijo porque el sistema operativo no les da contexto: sobre
 * papel y con la tinta de la marca.
 */
async function icons(paper: string, ink: string) {
  const mono = path.join(OUT, 'monograma.png');

  for (const [file, size, pad] of [
    [path.join(process.cwd(), 'app', 'icon.png'), 512, 0.2],
    [path.join(process.cwd(), 'app', 'apple-icon.png'), 180, 0.22],
  ] as const) {
    const inner = Math.round(size * (1 - pad * 2));
    const shape = await sharp(mono).resize({ width: inner, fit: 'contain' }).png().toBuffer();
    const meta = await sharp(shape).metadata();
    const colored = await sharp({
      create: { width: meta.width ?? inner, height: meta.height ?? inner, channels: 4, background: ink },
    })
      .composite([{ input: shape, blend: 'dest-in' }])
      .png()
      .toBuffer();

    await sharp({ create: { width: size, height: size, channels: 4, background: paper } })
      .composite([{ input: colored, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toFile(file);
    console.log(`  ${path.basename(file).padEnd(12)} ${size}×${size}`);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Máscaras del logo:');

  const pieces = [];
  for (const [name, box] of Object.entries(PIECES)) pieces.push(await mask(name, box));

  // Las proporciones se guardan para que el CSS reserve el espacio exacto y no
  // haya salto de layout mientras carga la máscara.
  const ratios = Object.fromEntries(
    pieces.map((p) => [p.name, Number((p.width / p.height).toFixed(4))]),
  );
  await writeFile(path.join(OUT, 'ratios.json'), `${JSON.stringify(ratios, null, 2)}\n`, 'utf8');

  console.log('\nIconos:');
  await icons(BRAND.bg, BRAND.fg);

  console.log('\nProporciones:', ratios);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
