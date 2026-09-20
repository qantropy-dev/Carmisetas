/**
 * Pruebas de la lógica pura: precios, contraste y armado del pedido.
 *
 *   npm test
 *
 * Son las piezas de las que depende todo lo demás, y no necesitan navegador ni
 * base de datos para comprobarse.
 */
import assert from 'node:assert/strict';
import { AA_TEXT, ambientTokens, contrastRatio, pickForeground, suggestAmbient } from '@/lib/color';
import { buildOrder, buildWhatsAppMessage, checkout, whatsappUrl } from '@/lib/checkout';
import { discountPercent, effectivePrice, formatCOP, resolvePrice } from '@/lib/pricing';
import { applyBulkPrice } from '@/lib/validators/product';
import { BRAND } from '@/lib/tokens';

let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log('  ok  ', name);
  } catch (error) {
    failed += 1;
    console.log('  FALLA', name, '→', error instanceof Error ? error.message : String(error));
  }
}

/* ------------------------------------------------------------- precios --- */

test('el precio de la talla gana al precio base', () => {
  assert.equal(effectivePrice({ basePrice: 89900, priceOverride: null }), 89900);
  assert.equal(effectivePrice({ basePrice: 89900, priceOverride: 99900 }), 99900);
  // Un override de 0 es un precio, no un "sin valor".
  assert.equal(effectivePrice({ basePrice: 89900, priceOverride: 0 }), 0);
});

test('solo hay descuento si el tachado supera al precio final', () => {
  assert.equal(discountPercent({ basePrice: 100000, compareAtPrice: 125000 }), 20);
  assert.equal(discountPercent({ basePrice: 100000, compareAtPrice: 100000 }), null);
  assert.equal(discountPercent({ basePrice: 100000, compareAtPrice: 90000 }), null);
  assert.equal(discountPercent({ basePrice: 100000, compareAtPrice: null }), null);
  // El tachado se compara contra el precio FINAL, no contra el base.
  assert.equal(
    discountPercent({ basePrice: 100000, priceOverride: 130000, compareAtPrice: 125000 }),
    null,
  );
});

test('los pesos se formatean en es-CO sin decimales', () => {
  const label = formatCOP(89900);
  assert.match(label, /89\.900/, `formateó "${label}"`);
  assert.ok(!label.includes(','), 'no debe llevar decimales');
  assert.equal(formatCOP(0).includes('0'), true);
});

test('resolvePrice arma todo lo que necesita la etiqueta', () => {
  const price = resolvePrice({ basePrice: 219900, compareAtPrice: 259900 });
  assert.equal(price.final, 219900);
  assert.equal(price.discountPercent, 15);
  assert.ok(price.compareAtLabel);
});

/* --------------------------------------------------------------- color --- */

test('la luminancia decide el color del texto', () => {
  assert.equal(pickForeground('#FFFFFF').hex, BRAND.fg);
  assert.equal(pickForeground('#000000').hex, BRAND.bg);
});

test('todo escenario propuesto alcanza AA', () => {
  for (const swatch of ['#F2ECE1', '#33363B', '#C06A4E', '#6B3742', '#B2C0A8', '#7F7F7F']) {
    const ambient = suggestAmbient(swatch);
    const { ratio } = pickForeground(ambient);
    assert.ok(ratio >= AA_TEXT, `${swatch} → ${ambient} solo llega a ${ratio.toFixed(2)}:1`);
  }
});

test('el escenario nunca se funde con la prenda', () => {
  for (const swatch of ['#F2ECE1', '#33363B', '#C06A4E', '#DBD8D3']) {
    const separation = contrastRatio(swatch, suggestAmbient(swatch));
    assert.ok(separation >= 1.1, `${swatch} se separa solo ${separation.toFixed(3)}:1`);
  }
});

test('los tokens del escenario salen completos', () => {
  const tokens = ambientTokens('#1C1E22');
  for (const key of ['--ambient', '--ambient-fg', '--ambient-muted', '--ambient-hairline',
                     '--ambient-veil', '--ambient-shadow']) {
    assert.match(tokens[key as keyof typeof tokens], /^#[0-9A-F]{6}$/, `${key} inválido`);
  }
  assert.equal(tokens['--ambient-fg'], BRAND.bg, 'sobre un escenario oscuro, texto claro');
});

/* ------------------------------------------------------------- pedidos --- */

const ITEM = {
  variantId: 'v1',
  productId: 'p1',
  slug: 'sueter-nocturno',
  name: 'Suéter Nocturno',
  colorId: 'c1',
  colorName: 'Carbón',
  swatchHex: '#33363B',
  size: 'M',
  unitPrice: 219900,
  cutoutUrl: null,
};

test('el pedido suma unidades y totales', () => {
  const order = buildOrder([
    { ...ITEM, quantity: 2 },
    { ...ITEM, variantId: 'v2', size: 'L', unitPrice: 89900, quantity: 1 },
  ]);
  assert.equal(order.units, 3);
  assert.equal(order.subtotal, 219900 * 2 + 89900);
  assert.equal(order.total, order.subtotal);
  assert.equal(order.lines[0]?.lineTotal, 439800);
});

test('el mensaje lleva prenda, color, talla, total y enlace', () => {
  const order = buildOrder([{ ...ITEM, quantity: 2 }]);
  const message = buildWhatsAppMessage(order, 'https://carmisetas.co/');
  assert.match(message, /2 × Suéter Nocturno/);
  assert.match(message, /Color Carbón · Talla M/);
  assert.match(message, /https:\/\/carmisetas\.co\/prenda\/sueter-nocturno/);
  assert.ok(!message.includes('carmisetas.co//'), 'la barra final no debe duplicarse');
  assert.match(message, /Total:/);
});

test('el enlace de WhatsApp limpia el número y escapa el texto', () => {
  const url = whatsappUrl('+57 300 123 4567', 'hola mundo');
  assert.ok(url.startsWith('https://wa.me/573001234567?text='), url);
  assert.ok(url.includes('hola%20mundo'));
});

test('el cierre se niega sin número o sin bolsa', () => {
  const config = { phone: '573001234567', siteUrl: 'https://carmisetas.co' };
  assert.deepEqual(checkout([], config), { ok: false, reason: 'bolsa-vacia' });
  assert.deepEqual(checkout([{ ...ITEM, quantity: 1 }], { ...config, phone: undefined }), {
    ok: false,
    reason: 'sin-numero',
  });
  assert.equal(checkout([{ ...ITEM, quantity: 1 }], config).ok, true);
});

/* ------------------------------------------------------- precios masivos -- */

test('la edición masiva redondea como se previsualiza', () => {
  const rule = {
    scope: 'todas' as const,
    category_id: null,
    product_ids: [],
    mode: 'porcentaje' as const,
    value: -10,
    round_to: 100 as const,
    keep_discount: true,
  };
  assert.equal(applyBulkPrice(89900, rule), 80900);
  assert.equal(applyBulkPrice(94900, rule), 85400);
  assert.equal(applyBulkPrice(100, { ...rule, mode: 'fijar', value: 12345 }), 12300);
  // Nunca por debajo de cero.
  assert.equal(applyBulkPrice(1000, { ...rule, mode: 'monto', value: -50000 }), 0);
});

console.log(failed === 0 ? '\nTodo en orden.' : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
