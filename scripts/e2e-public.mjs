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

// ------------------------------------------------------------------ catálogo --
const cat = await browser.newPage({ viewport: { width: 390, height: 844 } });
watch(cat);

await step('el perchero carga y cuelga las prendas', async () => {
  await cat.goto(`${B}/catalogo`, { waitUntil: 'networkidle' });
  await cat.waitForSelector('[aria-roledescription="perchero"]', { timeout: 20000 });
  const hangers = await cat.locator('button[aria-label^="Ver "]').count();
  if (hangers < 2) throw new Error(`solo ${hangers} ganchos`);
});

await step('la flecha del perchero cambia la prenda', async () => {
  const before = await cat.locator('h2').innerText();
  await cat.getByRole('button', { name: 'Prenda siguiente' }).click();
  await cat.waitForTimeout(1200);
  if ((await cat.locator('h2').innerText()) === before) throw new Error('no cambió');
});

await step('el perchero se recorre con el teclado', async () => {
  const before = await cat.locator('h2').innerText();
  await cat.locator('[aria-roledescription="perchero"]').focus();
  await cat.keyboard.press('ArrowRight');
  await cat.waitForTimeout(1200);
  if ((await cat.locator('h2').innerText()) === before) throw new Error('ArrowRight no hizo nada');
});

await step('el favorito se guarda entre recargas', async () => {
  // En la lista están todas a la vista, así que tras recargar se puede
  // comprobar la misma prenda. En el perchero, recargar vuelve a la primera.
  await cat.goto(`${B}/catalogo?vista=lista`, { waitUntil: 'networkidle' });
  await cat.waitForSelector('article', { timeout: 20000 });

  const fav = cat.locator('button[aria-label^="Guardar "]').first();
  const label = (await fav.getAttribute('aria-label')) ?? '';
  const name = label.replace(/^Guardar | en favoritos$/g, '');
  await fav.click();
  await cat.waitForTimeout(400);

  await cat.reload({ waitUntil: 'networkidle' });
  await cat.waitForSelector('article', { timeout: 20000 });
  await cat.waitForTimeout(600);

  const marked = await cat.locator(`button[aria-label="Quitar ${name} de favoritos"]`).count();
  if (marked === 0) throw new Error(`${name} no quedó marcada`);

  // Y se deja como estaba, para que la prueba se pueda repetir.
  await cat.locator(`button[aria-label="Quitar ${name} de favoritos"]`).click();
});

await step('la lista filtra por búsqueda y categoría', async () => {
  await cat.goto(`${B}/catalogo?vista=lista`, { waitUntil: 'networkidle' });
  await cat.waitForSelector('article', { timeout: 20000 });
  if ((await cat.locator('article').count()) !== 6) throw new Error('no hay 6 tarjetas');

  await cat.fill('input[type=search]', 'salvia');
  await cat.waitForTimeout(400);
  if ((await cat.locator('article').count()) !== 1) throw new Error('la búsqueda no filtró');

  await cat.fill('input[type=search]', '');
  await cat.getByRole('button', { name: /Camisetas/ }).click();
  await cat.waitForTimeout(400);
  if ((await cat.locator('article').count()) !== 3) throw new Error('el chip no filtró a 3');
});

await step('la tarjeta enseña la espalda al pasar el cursor', async () => {
  await cat.goto(`${B}/catalogo?vista=lista`, { waitUntil: 'networkidle' });
  await cat.waitForTimeout(1200);
  const card = cat.locator('article').first();
  const backOpacity = () =>
    card.evaluate((el) => {
      const back = el.querySelector('[aria-hidden="true"].absolute');
      return back ? Number(getComputedStyle(back).opacity) : -1;
    });
  if ((await backOpacity()) !== 0) throw new Error('la espalda se ve sin pasar el cursor');
  await card.hover();
  await cat.waitForTimeout(700);
  if ((await backOpacity()) < 0.9) throw new Error('la espalda no apareció');
});

await cat.close();

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
