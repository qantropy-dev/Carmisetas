/**
 * Espeja en public/imgly los recursos que necesita el recorte automático, para
 * servirlos desde nuestro propio dominio en vez de un CDN de terceros.
 *
 *   npm run imgly:mirror
 *
 * Es OPCIONAL. Por defecto la librería baja todo de staticimgly.com; solo se
 * usa el espejo si NEXT_PUBLIC_IMGLY_PUBLIC_PATH apunta a él.
 *
 * Merece la pena porque el admin se usa desde el celular: el modelo son ~44 MB
 * y depender de un CDN ajeno significa que si ese CDN va lento o cae, la
 * función deja de existir.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const VERSION = '1.7.0';
const CDN = `https://staticimgly.com/@imgly/background-removal-data/${VERSION}/dist`;
const OUT = path.join(process.cwd(), 'public', 'imgly');

/** Solo lo que usa la configuración de lib/image/remove-background.ts. */
const WANTED = [
  '/models/isnet_quint8',
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
];

type Chunk = { hash: string; name: string; offsets: number[] };
type Entry = { chunks: Chunk[]; size: number; mime: string };

async function get(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} en ${url}`);
  return response.arrayBuffer();
}

const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;

async function main() {
  await mkdir(OUT, { recursive: true });

  const manifestRaw = await get(`${CDN}/resources.json`);
  await writeFile(path.join(OUT, 'resources.json'), Buffer.from(manifestRaw));
  const manifest = JSON.parse(Buffer.from(manifestRaw).toString('utf8')) as Record<string, Entry>;

  const chunks = new Map<string, number>();
  let total = 0;
  for (const key of WANTED) {
    const entry = manifest[key];
    if (!entry) throw new Error(`El manifiesto no trae ${key}`);
    total += entry.size;
    for (const chunk of entry.chunks) {
      const [from = 0, to = 0] = chunk.offsets;
      chunks.set(chunk.name, to - from);
    }
  }

  console.log(`${chunks.size} trozos · ${mb(total)}`);

  let done = 0;
  for (const [name, size] of chunks) {
    const file = path.join(OUT, name);
    if (existsSync(file)) {
      done += 1;
      continue;
    }
    await writeFile(file, Buffer.from(await get(`${CDN}/${name}`)));
    done += 1;
    process.stdout.write(`\r  ${done}/${chunks.size} · ${mb(size)}        `);
  }

  console.log(`\n\nListo. Añade a .env.local:\n  NEXT_PUBLIC_IMGLY_PUBLIC_PATH=/imgly/\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
