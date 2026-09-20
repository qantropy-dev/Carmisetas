/**
 * Humo del sitio público, de punta a punta, contra el Supabase local.
 *
 *   npx supabase start
 *   npm run dev
 *   npm run e2e
 *
 * Comprueba la mecánica del escenario ambiental, que es el corazón del sitio:
 * que el color llega ya resuelto desde el servidor, que cambia con la prenda,
 * que el texto se invierte para mantener contraste, y que todo sigue en pie con
 * `prefers-reduced-motion`.
 */
import { chromium } from 'playwright';

const B = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

let failed = 0;
const step = async (name, fn) => {
  try {
    await fn();
    console.log('  ok  ', name);
  } catch (e) {
    failed += 1;
    console.log('  FALLA', name, '→', String(e).split('\n')[0].slice(0, 200));
  }
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? undefined });
const errs = [];
const watch = (page) => {
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 300)));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300));
  });
};

const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
watch(p);
await p.goto(B, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

const token = (name) =>
  p.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name,
  );

await step('el servidor ya manda el escenario (sin JavaScript)', async () => {
  const html = await (await fetch(B)).text();
  if (!/--ambient:#[0-9A-F]{6}/.test(html)) throw new Error('el HTML no trae los tokens');
  if (!/--ambient-fg:#[0-9A-F]{6}/.test(html)) throw new Error('falta el color de texto');
});

await step('la flecha cambia el escenario', async () => {
  const before = await token('--ambient');
  await p.getByRole('button', { name: 'Prenda siguiente' }).click();
  await p.waitForTimeout(1100);
  if ((await token('--ambient')) === before) throw new Error(`no cambió: ${before}`);
});

await step('el texto se invierte sobre un escenario oscuro', async () => {
  for (let i = 0; i < 5; i += 1) {
    const [bg, fg] = [await token('--ambient'), await token('--ambient-fg')];
    // Un escenario oscuro exige texto claro; si no, no se lee.
    if (bg === '#1C1E22') {
      if (fg !== '#FAF8F5') throw new Error(`sobre ${bg} el texto quedó en ${fg}`);
      return;
    }
    await p.getByRole('button', { name: 'Prenda siguiente' }).click();
    await p.waitForTimeout(800);
  }
  throw new Error('no llegué a ninguna prenda oscura');
});

await step('el swipe avanza', async () => {
  const before = await token('--ambient');
  const box = await p.locator('main').boundingBox();
  await p.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.45);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.45, { steps: 12 });
  await p.mouse.up();
  await p.waitForTimeout(1100);
  if ((await token('--ambient')) === before) throw new Error('el swipe no hizo nada');
});

await step('las flechas del teclado funcionan', async () => {
  const before = await token('--ambient');
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(1000);
  if ((await token('--ambient')) === before) throw new Error('ArrowLeft no hizo nada');
});

await step('la miniatura muestra la prenda siguiente', async () => {
  const label = await p.locator('button[aria-label^="Ver "]').first().getAttribute('aria-label');
  await p.locator('button[aria-label^="Ver "]').first().click();
  await p.waitForTimeout(1100);
  const heading = await p.locator('h1').innerText();
  const name = (label ?? '').replace(/^Ver /, '');
  if (heading.toLowerCase() !== name.toLowerCase()) {
    throw new Error(`la miniatura decía "${name}" y llegó "${heading}"`);
  }
});

await p.close();

// ----------------------------------------------------------- reduced motion --
const reducedCtx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
});
const r = await reducedCtx.newPage();
watch(r);
await r.goto(B, { waitUntil: 'networkidle' });
await r.waitForTimeout(1500);

await step('con movimiento reducido el sitio sigue completo', async () => {
  const before = await r.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ambient').trim(),
  );
  await r.getByRole('button', { name: 'Prenda siguiente' }).click();
  await r.waitForTimeout(900);
  const after = await r.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ambient').trim(),
  );
  if (before === after) throw new Error('el escenario no cambió');
});

console.log(
  '\nerrores de consola:',
  errs.length ? '\n  ' + [...new Set(errs)].slice(0, 8).join('\n  ') : 'ninguno',
);
await browser.close();
process.exit(failed > 0 || errs.length > 0 ? 1 : 0);
