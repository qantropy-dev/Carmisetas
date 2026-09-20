/**
 * Humo del panel, de punta a punta, contra el Supabase local.
 *
 *   npx supabase start
 *   npm run dev
 *   npm run e2e
 *
 * Emula un teléfono (390 px) porque ese es el escenario que importa: el admin
 * tiene que poder usarse desde el celular.
 *
 * El recorte automático solo se prueba si existe el espejo local del modelo
 * (`npm run imgly:mirror`); si no, se salta con aviso.
 */
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const B = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const S = process.env.SHOTS ?? null;
const HAS_MIRROR = existsSync('public/imgly/resources.json');

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
const shot = async (page, name) => {
  if (S) await page.screenshot({ path: `${S}/${name}.png` });
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message.slice(0, 300)));
p.on('console', (m) => {
  if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300));
});



await step('redirige a login sin sesion', async () => {
  await p.goto(`${B}/admin/prendas`, { waitUntil: 'networkidle' });
  if (!p.url().includes('/admin/login')) throw new Error('no redirigio: ' + p.url());
});

await step('rechaza credenciales malas', async () => {
  await p.fill('input[name=email]', 'admin@carmisetas.local');
  await p.fill('input[name=password]', 'contrasena-mala');
  await p.click('button[type=submit]');
  // Texto exacto: en dev, Next inyecta elementos con role=alert propios.
  await p.waitForSelector('text=Correo o contraseña incorrectos', { timeout: 20000 });
});

await step('entra con credenciales buenas', async () => {
  await p.fill('input[name=password]', 'carmisetas-dev');
  await p.click('button[type=submit]');
  await p.waitForURL('**/admin/prendas', { timeout: 30000 });
  await p.waitForSelector('article', { timeout: 20000 });
});

await step('lista las 6 prendas', async () => {
  const n = await p.locator('article').count();
  if (n !== 6) throw new Error(`hay ${n} tarjetas`);
});

await step('busca por nombre', async () => {
  await p.fill('input[type=search]', 'salvia');
  await p.waitForTimeout(400);
  const n = await p.locator('article').count();
  if (n !== 1) throw new Error(`la busqueda dejo ${n}`);
  await p.fill('input[type=search]', '');
  await p.waitForTimeout(300);
});

await step('filtra por destacadas', async () => {
  await p.getByRole('button', { name: 'Destacadas', exact: true }).click();
  await p.waitForTimeout(400);
  const n = await p.locator('article').count();
  if (n !== 5) throw new Error(`destacadas: ${n}, esperaba 5`);
  await p.getByRole('button', { name: 'Todas', exact: true }).click();
  await p.waitForTimeout(300);
});

await step('el interruptor de visible persiste', async () => {
  const sw = p.getByRole('switch', { name: /Camiseta Bruma: visible/ });
  await sw.click();
  await p.waitForTimeout(2500);
  await p.reload({ waitUntil: 'networkidle' });
  const after = await p.getByRole('switch', { name: /Camiseta Bruma: visible/ }).getAttribute('aria-checked');
  if (after !== 'false') throw new Error('no persistio, quedo ' + after);
  await p.getByRole('switch', { name: /Camiseta Bruma: visible/ }).click();
  await p.waitForTimeout(2000);
});

await shot(p, 'adm-lista');

await step('abre la ficha de una prenda', async () => {
  await p.getByRole('link', { name: /Suéter Nocturno/ }).first().click();
  await p.waitForSelector('text=Colores', { timeout: 20000 });
});

await shot(p, 'adm-form');

await step('guarda un cambio de titular', async () => {
  const field = p.locator('input[name=headline]');
  await field.fill('Para cuando cae la noche');
  await p.getByRole('button', { name: 'Guardar cambios' }).click();
  await p.waitForSelector('text=Guardado', { timeout: 20000 });
});

await step('rechaza tachado menor que el precio', async () => {
  await p.locator('input[name=compare_at_price]').fill('1000');
  await p.getByRole('button', { name: 'Guardar cambios' }).click();
  await p.waitForSelector('text=/tachado tiene que ser mayor/', { timeout: 20000 });
  await p.locator('input[name=compare_at_price]').fill('259900');
  await p.getByRole('button', { name: 'Guardar cambios' }).click();
  await p.waitForSelector('text=Guardado', { timeout: 20000 });
});

await step('la matriz guarda una talla', async () => {
  const cell = p.getByRole('button', { name: /Carbón talla L/ });
  const label = (await cell.getAttribute('aria-label')) ?? '';
  const target = label.includes('Agotado') ? 'Disponible' : 'Agotado';
  await cell.click();
  await p.getByRole('button', { name: target, exact: true }).click();
  await p.getByRole('button', { name: /Guardar 1 talla/ }).click();
  await p.waitForSelector('text=1 talla guardada', { timeout: 20000 });
});

await shot(p, 'adm-matriz');

await step('vista previa de precios masivos', async () => {
  await p.goto(`${B}/admin/precios`, { waitUntil: 'networkidle' });
  // La previa va con rebote de 250 ms: hay que esperar a que traiga filas.
  await p.waitForFunction(
    () => /[1-9]\d* de [1-9]\d* prendas? cambian?/.test(document.body.innerText),
    null,
    { timeout: 25000 },
  );
  const text = await p.locator('body').innerText();
  if (!text.includes('→')) throw new Error('no hay filas de previa');
});

await shot(p, 'adm-precios');

await step('el historial muestra el cambio de precio', async () => {
  await p.goto(`${B}/admin/historial`, { waitUntil: 'networkidle' });
  const text = await p.locator('body').innerText();
  if (!text.includes('Admin Uno')) throw new Error('no aparece el autor');
  if (!/titular|precio|disponibilidad/i.test(text)) throw new Error('no aparece el campo cambiado');
});

await shot(p, 'adm-historial');

await step('colecciones carga', async () => {
  await p.goto(`${B}/admin/colecciones`, { waitUntil: 'networkidle' });
  await p.waitForSelector('text=Categorías', { timeout: 15000 });
});

// ---------------------------------------------------------------- imagenes --
await step('vuelve a una prenda para las imagenes', async () => {
  await p.goto(`${B}/admin/prendas`, { waitUntil: 'networkidle' });
  await p.getByRole('link', { name: /Camiseta Bruma/ }).first().click();
  await p.waitForSelector('text=Colores', { timeout: 20000 });
});

const before = await p.locator('li > button').count();




await step('abre el cargador de imagenes', async () => {
  await p.getByRole('button', { name: '+ Imagen' }).first().click();
  await p.waitForSelector('text=Tomar o elegir una foto', { timeout: 15000 });
});

await step('acepta un archivo', async () => {
  await p.setInputFiles('#uploader-file', 'public/seed/camiseta-bruma-hueso-frente.png');
  await p.waitForSelector('text=Quitar el fondo', { timeout: 15000 });
});

await step('sube el recorte tal cual y sugiere colores', async () => {
  await p.getByRole('button', { name: /Ya viene recortada/ }).click();
  await p.waitForSelector('text=Así se verá en la tienda', { timeout: 40000 });
  const text = await p.locator('body').innerText();
  if (!/Usar el color que detecté/.test(text)) throw new Error('no propuso color dominante');
  const hex = text.match(/#[0-9A-F]{6}/g);
  console.log('        colores propuestos:', hex ? hex.slice(0, 2).join(' / ') : 'ninguno');
});

await step('etiqueta la vista y sube', async () => {
  await p.getByRole('button', { name: 'detalle', exact: true }).click();
  await p.locator('input[placeholder*="detalle"], input[placeholder*="Hueso"]').first().fill('Prueba automática');
  await p.getByRole('button', { name: 'Subir', exact: true }).click();
  await p.waitForSelector('text=Imagen agregada', { timeout: 60000 });
});

await step('la imagen queda en la ficha', async () => {
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForSelector('text=Colores', { timeout: 20000 });
  const after = await p.locator('li > button').count();
  if (after <= before) throw new Error(`antes ${before}, despues ${after}`);
});

await shot(p, 'adm-imagen');

await step(HAS_MIRROR ? 'recorte automatico con el modelo' : 'recorte automatico (saltado: sin espejo local)', async () => {
  if (!HAS_MIRROR) return;
  await p.getByRole('button', { name: '+ Imagen' }).first().click();
  await p.setInputFiles('#uploader-file', 'public/seed/camiseta-bruma-arena-frente.png');
  await p.getByRole('button', { name: 'Quitar el fondo', exact: true }).click();
  await p.waitForSelector('text=Así se verá en la tienda', { timeout: 240000 });
});

console.log(
  '\nerrores de consola:',
  errs.length ? '\n  ' + [...new Set(errs)].slice(0, 8).join('\n  ') : 'ninguno',
);
await browser.close();
process.exit(failed > 0 || errs.length > 0 ? 1 : 0);
