/**
 * Renderiza los recortes PNG (fondo transparente) de la semilla a public/seed.
 * Tambien valida que TODOS los ambient_hex alcancen contraste AA con alguno de
 * los dos colores de texto de la marca: si uno falla, el build se cae aqui y no
 * en produccion.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { AA_TEXT, contrastRatio, pickForeground } from '@/lib/color';
import { PRODUCTS } from '@/supabase/seed-data';
import { CANVAS, garmentSvg } from './garment-svg';
import { assetPath, type SeedView as View } from './seed-paths';

const OUT = path.join(process.cwd(), 'public', 'seed');
const DENSITY = 144; // 2x sobre el viewBox de 640x820
const VIEWS: View[] = ['frente', 'espalda', 'detalle'];

async function render(svg: string, view: View): Promise<Buffer> {
  const img = sharp(Buffer.from(svg), { density: DENSITY });
  if (view !== 'detalle') return img.png({ compressionLevel: 9 }).toBuffer();

  // "detalle": acercamiento al cuello y al hombro.
  const w = CANVAS.width * 2;
  const h = CANVAS.height * 2;
  return img
    .extract({
      left: Math.round(w * 0.2),
      top: Math.round(h * 0.03),
      width: Math.round(w * 0.6),
      height: Math.round(h * 0.42),
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  const failures: string[] = [];
  for (const product of PRODUCTS) {
    for (const color of product.colors) {
      const { hex, ratio } = pickForeground(color.ambient);
      if (ratio < AA_TEXT) {
        failures.push(
          `${product.slug} / ${color.name}: ambient ${color.ambient} solo llega a ` +
            `${ratio.toFixed(2)}:1 (necesita ${AA_TEXT}:1)`,
        );
      } else {
        const label = hex.toLowerCase() === '#faf8f5' ? 'texto claro' : 'texto oscuro';
        process.stdout.write(
          `  ${product.slug.padEnd(18)} ${color.name.padEnd(10)} ${color.ambient} → ${label} (${ratio.toFixed(1)}:1)\n`,
        );
      }
    }
  }
  if (failures.length > 0) {
    console.error('\nContraste AA insuficiente:\n' + failures.map((f) => `  · ${f}`).join('\n'));
    process.exit(1);
  }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  let count = 0;
  for (const product of PRODUCTS) {
    for (const color of product.colors) {
      for (const view of VIEWS) {
        const svg = garmentSvg({ silhouette: product.silhouette, color: color.swatch, view });
        const png = await render(svg, view);
        const file = path.join(OUT, path.basename(assetPath(product.slug, color.name, view)));
        await writeFile(file, png);
        count += 1;
      }
    }
  }

  // Contraste prenda/escenario: si la prenda se funde con el fondo, no se ve.
  const lowSeparation = PRODUCTS.flatMap((p) =>
    p.colors
      .map((c) => ({ p: p.slug, c: c.name, r: contrastRatio(c.swatch, c.ambient) }))
      .filter((x) => x.r < 1.12),
  );
  if (lowSeparation.length > 0) {
    console.warn(
      '\nAviso · prenda casi del mismo tono que su escenario:\n' +
        lowSeparation.map((x) => `  · ${x.p} / ${x.c} (${x.r.toFixed(3)}:1)`).join('\n'),
    );
  }

  console.log(`\n${count} recortes escritos en public/seed`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
