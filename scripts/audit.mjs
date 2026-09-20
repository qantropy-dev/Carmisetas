/**
 * Lighthouse sobre el build de producción, emulando un teléfono.
 *
 *   npm run build && npx next start &
 *   npm run audit
 *
 * El listón del proyecto es 90 en las cuatro categorías. El script sale con
 * error si alguna página baja de ahí, y ademas imprime las auditorías que
 * fallan, que es lo que de verdad dice qué arreglar: un 96 de accesibilidad
 * puede esconder un contraste que no cumple.
 */
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const FLOOR = Number(process.env.FLOOR ?? 90);
const PAGES = ['/', '/catalogo', '/catalogo?vista=lista', '/prenda/camiseta-sereno'];

const chrome = await launch({
  ...(process.env.CHROMIUM ? { chromePath: process.env.CHROMIUM } : {}),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

let below = 0;

for (const path of PAGES) {
  const result = await lighthouse(BASE + path, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
  });

  const c = result.lhr.categories;
  const scores = {
    perf: Math.round(c.performance.score * 100),
    a11y: Math.round(c.accessibility.score * 100),
    bp: Math.round(c['best-practices'].score * 100),
    seo: Math.round(c.seo.score * 100),
  };
  const low = Object.entries(scores).filter(([, v]) => v < FLOOR);
  if (low.length > 0) below += 1;

  const audits = result.lhr.audits;
  const line =
    `${path.padEnd(26)} perf ${String(scores.perf).padStart(3)} · ` +
    `a11y ${String(scores.a11y).padStart(3)} · bp ${String(scores.bp).padStart(3)} · ` +
    `seo ${String(scores.seo).padStart(3)}  | LCP ${audits['largest-contentful-paint']?.displayValue}` +
    ` CLS ${audits['cumulative-layout-shift']?.displayValue}` +
    ` TBT ${audits['total-blocking-time']?.displayValue}`;
  console.log(low.length > 0 ? `${line}   ← por debajo de ${FLOOR}` : line);

  // Lo que no cumple, aunque la nota media lo tape.
  const broken = ['color-contrast', 'target-size', 'heading-order', 'label-content-name-mismatch',
                  'meta-description', 'errors-in-console', 'lcp-lazy-loaded', 'image-alt', 'link-name']
    .filter((id) => audits[id]?.score !== null && (audits[id]?.score ?? 1) < 0.9);
  if (broken.length > 0) console.log('   ↳ revisar:', broken.join(', '));
}

await chrome.kill();

if (below > 0) {
  console.log(`\n${below} página(s) por debajo de ${FLOOR}.`);
  process.exit(1);
}
console.log('\nTodas las páginas por encima de ' + FLOOR + '.');
