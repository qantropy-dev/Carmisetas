import { formatCOP } from '@/lib/pricing';

/**
 * Cierre del pedido.
 *
 * Todo lo que decide QUÉ se pide y CÓMO se comunica vive aquí, aparte de la
 * interfaz. Conectar una pasarela de pago o un agente de WhatsApp después es
 * escribir otra función `submit`, sin tocar un solo componente.
 */

export type BagItem = {
  /** La variante es la unidad de compra: prenda + color + talla. */
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  colorId: string;
  colorName: string;
  swatchHex: string;
  size: string;
  unitPrice: number;
  quantity: number;
  cutoutUrl: string | null;
};

export type OrderLine = BagItem & { lineTotal: number };

export type Order = {
  lines: OrderLine[];
  /** Unidades, no líneas: dos camisetas iguales cuentan dos. */
  units: number;
  subtotal: number;
  total: number;
};

export const MAX_PER_LINE = 20;

export function buildOrder(items: BagItem[]): Order {
  const lines = items.map((item) => ({
    ...item,
    lineTotal: item.unitPrice * item.quantity,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return {
    lines,
    units: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal,
    // Hoy el total es el subtotal. Envío e impuestos entran aquí cuando existan.
    total: subtotal,
  };
}

/**
 * El mensaje que llega al taller por WhatsApp.
 *
 * Lleva el link de cada prenda a propósito: quien atiende abre el enlace y ve
 * exactamente la misma pieza, sin adivinar por el nombre.
 */
export function buildWhatsAppMessage(order: Order, siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, '');

  const lines = order.lines.map((line) => {
    const parts = [
      `• ${line.quantity} × ${line.name}`,
      `   Color ${line.colorName} · Talla ${line.size}`,
      `   ${formatCOP(line.unitPrice)} c/u · ${formatCOP(line.lineTotal)}`,
      `   ${base}/prenda/${line.slug}`,
    ];
    return parts.join('\n');
  });

  return [
    'Hola, quiero hacer este pedido:',
    '',
    lines.join('\n\n'),
    '',
    `Total: ${formatCOP(order.total)}`,
    `(${order.units} ${order.units === 1 ? 'prenda' : 'prendas'})`,
  ].join('\n');
}

/** Enlace wa.me. El número va sin "+" ni espacios, con indicativo de país. */
export function whatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'sin-numero' | 'bolsa-vacia' };

/**
 * Punto único de salida del pedido. La interfaz llama esto y nada más; el día
 * que haya pasarela, cambia lo de dentro y la bolsa ni se entera.
 */
export function checkout(
  items: BagItem[],
  config: { phone: string | undefined; siteUrl: string },
): CheckoutResult {
  if (items.length === 0) return { ok: false, reason: 'bolsa-vacia' };
  if (!config.phone) return { ok: false, reason: 'sin-numero' };

  const order = buildOrder(items);
  return { ok: true, url: whatsappUrl(config.phone, buildWhatsAppMessage(order, config.siteUrl)) };
}
