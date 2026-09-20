/**
 * Matematica de color: luminancia WCAG, contraste y derivacion de los tokens
 * ambientales de una prenda. Puro y sin dependencias — corre igual en el
 * servidor (para que el HTML llegue ya con el color correcto y no haya
 * parpadeo) y en los scripts de build/seed.
 */
import { AMBIENT_FOREGROUNDS, BRAND } from './tokens';

export type Rgb = { r: number; g: number; b: number };

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

export function hexToRgb(hex: string): Rgb {
  const raw = hex.trim().replace('#', '');
  if (!HEX_RE.test(`#${raw}`)) throw new Error(`Hex invalido: ${hex}`);
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Canal sRGB -> lineal, segun WCAG 2.x. */
function linearize(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa WCAG, en [0, 1]. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Razon de contraste WCAG entre dos colores opacos, en [1, 21]. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export const AA_TEXT = 4.5;
export const AA_LARGE = 3;

/**
 * Elige el color de texto con mas contraste sobre `ambient`.
 * Devuelve tambien la razon, para poder fallar el seed si una prenda
 * trae un ambient que no llega a AA con ninguno de los dos.
 */
export function pickForeground(ambient: string): { hex: string; ratio: number } {
  let best: { hex: string; ratio: number } = { hex: BRAND.fg, ratio: 0 };
  for (const candidate of AMBIENT_FOREGROUNDS) {
    const ratio = contrastRatio(ambient, candidate);
    if (ratio > best.ratio) best = { hex: candidate, ratio };
  }
  return best;
}

/** Mezcla lineal en sRGB. `t = 0` devuelve `a`, `t = 1` devuelve `b`. */
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const k = Math.min(1, Math.max(0, t));
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * k,
    g: ca.g + (cb.g - ca.g) * k,
    b: ca.b + (cb.b - ca.b) * k,
  });
}

export type AmbientTokens = {
  /** El color del escenario. */
  '--ambient': string;
  /** Texto principal sobre el escenario, ya verificado AA. */
  '--ambient-fg': string;
  /** Texto secundario: mismo tono, menos presencia. */
  '--ambient-muted': string;
  /** Lineas de 1px y separadores. */
  '--ambient-hairline': string;
  /** Superficie apenas levantada (chips, tarjetas sobre el escenario). */
  '--ambient-veil': string;
  /** Sombra de piso bajo la prenda flotante. */
  '--ambient-shadow': string;
};

/**
 * Deriva todos los tokens de un escenario a partir de un solo `ambient_hex`.
 *
 * Se calcula en el servidor y se serializa como `style` en el contenedor del
 * escenario: el primer paint ya sale con el color correcto, sin JS.
 */
export function ambientTokens(ambientHex: string): AmbientTokens {
  const ambient = ambientHex.trim().toUpperCase();
  const { hex: fg } = pickForeground(ambient);

  return {
    '--ambient': ambient,
    '--ambient-fg': fg,
    // Mezclas hacia el ambiente en vez de alpha: evita que el texto se vea
    // "sucio" cuando hay una imagen detras.
    '--ambient-muted': mix(fg, ambient, 0.38),
    '--ambient-hairline': mix(fg, ambient, 0.86),
    '--ambient-veil': mix(ambient, fg, 0.05),
    // La sombra nunca es gris neutro: es el propio ambiente, mas denso.
    '--ambient-shadow': mix(ambient, BRAND.fg, 0.55),
  };
}

/** Serializa tokens a un bloque CSS (para inyectar en <style> desde el server). */
export function tokensToCss(tokens: Record<string, string>, selector = ':root'): string {
  const body = Object.entries(tokens)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
  return `${selector}{${body}}`;
}

/** Ordena claro -> oscuro; util para que una fila de swatches no salte. */
export function sortByLuminance<T>(items: T[], getHex: (item: T) => string): T[] {
  return [...items].sort((a, b) => relativeLuminance(getHex(b)) - relativeLuminance(getHex(a)));
}

/**
 * Propone el color del escenario a partir del color de la prenda.
 *
 * Regla: el escenario nunca es el mismo tono que la prenda, o la prenda
 * desaparece. Una prenda clara pide un escenario algo mas denso; una oscura,
 * uno mas profundo todavia. Se empuja hasta separar lo suficiente y se
 * comprueba que el texto siga llegando a AA.
 */
export function suggestAmbient(swatchHex: string): string {
  const swatch = swatchHex.trim().toUpperCase();
  const light = relativeLuminance(swatch) > 0.42;
  const target = light ? BRAND.fg : BRAND.bg;

  // Separacion minima prenda/escenario: por debajo de esto se funden.
  const MIN_SEPARATION = 1.14;
  let ambient = swatch;
  for (let t = 0.08; t <= 0.5; t += 0.02) {
    ambient = mix(swatch, target, t);
    if (contrastRatio(swatch, ambient) >= MIN_SEPARATION) break;
  }

  // Si al separarlo el texto se queda sin contraste, se cede en la separacion.
  if (pickForeground(ambient).ratio < AA_TEXT) {
    for (let t = 0.5; t >= 0; t -= 0.02) {
      const candidate = mix(swatch, target, t);
      if (pickForeground(candidate).ratio >= AA_TEXT) return candidate;
    }
  }
  return ambient;
}

