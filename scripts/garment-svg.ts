/**
 * Siluetas de prenda parametricas para la semilla.
 *
 * Son PLACEHOLDERS: el admin las reemplaza por fotos recortadas reales. Pero
 * tienen que verse bien, porque en este sitio la prenda es la protagonista.
 * Todo se dibuja recortado (fondo transparente) y con volumen: degradado
 * vertical, sombra lateral, pliegues y canales de tejido.
 */
import { mix } from '@/lib/color';
import type { Silhouette } from '@/supabase/seed-data';

import type { SeedView as View } from './seed-paths';
export type { SeedView as View } from './seed-paths';

const W = 640;
const H = 820;
const CX = W / 2;

type Spec = {
  neckHalf: number;
  neckDepth: number;
  shoulderY: number;
  shoulderHalf: number;
  sleeveOuterHalf: number;
  sleeveCapY: number;
  cuffY: number;
  cuffOuterHalf: number;
  cuffInnerHalf: number;
  armpitY: number;
  bodyTopHalf: number;
  bodyHemHalf: number;
  hemY: number;
  hemSag: number;
  /** Alto de los acanalados de puno y bajo. 0 = sin rib. */
  ribHeight: number;
};

const SPECS: Record<Silhouette, Spec> = {
  tee: {
    neckHalf: 86, neckDepth: 34, shoulderY: 92, shoulderHalf: 196,
    sleeveOuterHalf: 292, sleeveCapY: 178, cuffY: 296, cuffOuterHalf: 276,
    cuffInnerHalf: 214, armpitY: 318, bodyTopHalf: 206, bodyHemHalf: 226,
    hemY: 700, hemSag: 16, ribHeight: 0,
  },
  crewneck: {
    neckHalf: 82, neckDepth: 30, shoulderY: 100, shoulderHalf: 206,
    sleeveOuterHalf: 268, sleeveCapY: 206, cuffY: 636, cuffOuterHalf: 258,
    cuffInnerHalf: 198, armpitY: 322, bodyTopHalf: 210, bodyHemHalf: 222,
    hemY: 694, hemSag: 12, ribHeight: 40,
  },
  hoodie: {
    neckHalf: 92, neckDepth: 22, shoulderY: 168, shoulderHalf: 224,
    sleeveOuterHalf: 288, sleeveCapY: 260, cuffY: 664, cuffOuterHalf: 278,
    cuffInnerHalf: 214, armpitY: 372, bodyTopHalf: 226, bodyHemHalf: 238,
    hemY: 720, hemSag: 10, ribHeight: 44,
  },
  cardigan: {
    neckHalf: 90, neckDepth: 46, shoulderY: 104, shoulderHalf: 204,
    sleeveOuterHalf: 264, sleeveCapY: 208, cuffY: 644, cuffOuterHalf: 254,
    cuffInnerHalf: 194, armpitY: 326, bodyTopHalf: 208, bodyHemHalf: 230,
    hemY: 708, hemSag: 8, ribHeight: 38,
  },
};

const n = (v: number) => Math.round(v * 10) / 10;

/** Contorno cerrado y simetrico de la prenda. */
function outline(s: Spec, view: View): string {
  // De espaldas el escote es casi recto.
  const depth = view === 'espalda' ? Math.max(10, s.neckDepth * 0.34) : s.neckDepth;
  const shoulderDrop = s.shoulderY + 20;

  const p: string[] = [];
  p.push(`M ${n(CX - s.neckHalf)} ${n(s.shoulderY)}`);
  // escote
  p.push(
    `C ${n(CX - s.neckHalf * 0.42)} ${n(s.shoulderY + depth * 1.4)}` +
      ` ${n(CX + s.neckHalf * 0.42)} ${n(s.shoulderY + depth * 1.4)}` +
      ` ${n(CX + s.neckHalf)} ${n(s.shoulderY)}`,
  );
  // hombro derecho
  p.push(`L ${n(CX + s.shoulderHalf)} ${n(shoulderDrop)}`);
  // copa de manga
  p.push(
    `C ${n(CX + s.shoulderHalf + 52)} ${n(shoulderDrop + 8)}` +
      ` ${n(CX + s.sleeveOuterHalf)} ${n(s.sleeveCapY - 34)}` +
      ` ${n(CX + s.sleeveOuterHalf)} ${n(s.sleeveCapY)}`,
  );
  // canto exterior de la manga hasta el puno
  p.push(
    `C ${n(CX + s.sleeveOuterHalf)} ${n(s.sleeveCapY + (s.cuffY - s.sleeveCapY) * 0.55)}` +
      ` ${n(CX + s.cuffOuterHalf + 10)} ${n(s.cuffY - 40)}` +
      ` ${n(CX + s.cuffOuterHalf)} ${n(s.cuffY)}`,
  );
  // boca del puno
  p.push(`L ${n(CX + s.cuffInnerHalf)} ${n(s.cuffY - 12)}`);
  // canto interior de la manga hasta la axila
  p.push(
    `C ${n(CX + s.cuffInnerHalf - 14)} ${n(s.cuffY - (s.cuffY - s.armpitY) * 0.5)}` +
      ` ${n(CX + s.bodyTopHalf + 26)} ${n(s.armpitY + 26)}` +
      ` ${n(CX + s.bodyTopHalf)} ${n(s.armpitY)}`,
  );
  // costado derecho (ligera linea A)
  p.push(
    `C ${n(CX + s.bodyTopHalf + 4)} ${n(s.armpitY + (s.hemY - s.armpitY) * 0.45)}` +
      ` ${n(CX + s.bodyHemHalf)} ${n(s.hemY - 90)}` +
      ` ${n(CX + s.bodyHemHalf)} ${n(s.hemY)}`,
  );
  // bajo
  p.push(
    `C ${n(CX + s.bodyHemHalf * 0.45)} ${n(s.hemY + s.hemSag)}` +
      ` ${n(CX - s.bodyHemHalf * 0.45)} ${n(s.hemY + s.hemSag)}` +
      ` ${n(CX - s.bodyHemHalf)} ${n(s.hemY)}`,
  );
  // espejo del costado izquierdo hacia arriba
  p.push(
    `C ${n(CX - s.bodyHemHalf)} ${n(s.hemY - 90)}` +
      ` ${n(CX - s.bodyTopHalf - 4)} ${n(s.armpitY + (s.hemY - s.armpitY) * 0.45)}` +
      ` ${n(CX - s.bodyTopHalf)} ${n(s.armpitY)}`,
  );
  p.push(
    `C ${n(CX - s.bodyTopHalf - 26)} ${n(s.armpitY + 26)}` +
      ` ${n(CX - s.cuffInnerHalf + 14)} ${n(s.cuffY - (s.cuffY - s.armpitY) * 0.5)}` +
      ` ${n(CX - s.cuffInnerHalf)} ${n(s.cuffY - 12)}`,
  );
  p.push(`L ${n(CX - s.cuffOuterHalf)} ${n(s.cuffY)}`);
  p.push(
    `C ${n(CX - s.cuffOuterHalf - 10)} ${n(s.cuffY - 40)}` +
      ` ${n(CX - s.sleeveOuterHalf)} ${n(s.sleeveCapY + (s.cuffY - s.sleeveCapY) * 0.55)}` +
      ` ${n(CX - s.sleeveOuterHalf)} ${n(s.sleeveCapY)}`,
  );
  p.push(
    `C ${n(CX - s.sleeveOuterHalf)} ${n(s.sleeveCapY - 34)}` +
      ` ${n(CX - s.shoulderHalf - 52)} ${n(shoulderDrop + 8)}` +
      ` ${n(CX - s.shoulderHalf)} ${n(shoulderDrop)}`,
  );
  p.push('Z');
  return p.join(' ');
}

/**
 * Capucha: cofia maciza DETRAS del cuerpo (por eso se pinta primero).
 * El hueco interior solo se insinua en la parte baja, donde asoma el forro.
 */
function hood(s: Spec, deep: string, base: string, light: string): string {
  const topY = 40;
  const half = 186;
  const baseY = s.shoulderY + 26;
  return `
    <path d="M ${CX - half} ${baseY}
             C ${CX - half - 6} ${topY + 88} ${CX - 116} ${topY} ${CX} ${topY}
             C ${CX + 116} ${topY} ${CX + half + 6} ${topY + 88} ${CX + half} ${baseY}
             C ${CX + 130} ${baseY + 40} ${CX - 130} ${baseY + 40} ${CX - half} ${baseY} Z"
          fill="${base}"/>
    <path d="M ${CX - half} ${baseY}
             C ${CX - half - 6} ${topY + 88} ${CX - 116} ${topY} ${CX} ${topY}
             C ${CX + 116} ${topY} ${CX + half + 6} ${topY + 88} ${CX + half} ${baseY}"
          fill="none" stroke="${light}" stroke-width="6" opacity="0.35"/>
    <path d="M ${CX - 116} ${baseY + 4}
             C ${CX - 104} ${baseY + 46} ${CX + 104} ${baseY + 46} ${CX + 116} ${baseY + 4}
             C ${CX + 60} ${baseY + 22} ${CX - 60} ${baseY + 22} ${CX - 116} ${baseY + 4} Z"
          fill="${deep}" opacity="0.7"/>`;
}

/** Pliegues: arcos suaves, nunca simetricos, para que el tejido no se vea plano. */
function folds(s: Spec, shade: string, view: View): string {
  const seed = view === 'espalda' ? 1 : 0;
  const lines = [
    [CX - 120, s.armpitY + 40, CX - 70, s.hemY - 120, CX - 96, s.hemY - 30],
    [CX + 108, s.armpitY + 70, CX + 74, s.hemY - 150, CX + 112, s.hemY - 40],
    [CX - 36, s.armpitY + 150, CX - 10, s.hemY - 180, CX - 44, s.hemY - 60],
    [CX + 42, s.armpitY + 210, CX + 20, s.hemY - 140, CX + 54, s.hemY - 50],
  ];
  return lines
    .map(([x1, y1, cx, cy, x2, y2], i) => {
      if (i % 2 === seed) return '';
      return `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" fill="none"
                stroke="${shade}" stroke-width="${10 + i * 3}" stroke-linecap="round"
                opacity="${0.08 + i * 0.015}"/>`;
    })
    .join('');
}

/**
 * Acanalado de puno / bajo. El paso es fino y la banda se calcula al ancho real
 * de la pieza: si sobresale, el clip la corta en dientes y parece un fleco.
 */
function ribBand(x: number, y: number, w: number, h: number, shade: string, light: string): string {
  const stripes: string[] = [];
  for (let i = 2; i < w; i += 7) {
    stripes.push(
      `<rect x="${n(x + i)}" y="${n(y)}" width="2.4" height="${n(h)}" fill="${shade}" opacity="0.24"/>` +
        `<rect x="${n(x + i + 3.4)}" y="${n(y)}" width="1.6" height="${n(h)}" fill="${light}" opacity="0.2"/>`,
    );
  }
  // Costura donde arranca el acanalado.
  stripes.push(
    `<path d="M ${n(x - 6)} ${n(y)} L ${n(x + w + 6)} ${n(y)}" stroke="${shade}" stroke-width="3" opacity="0.32"/>`,
  );
  return `<g clip-path="url(#clipBody)">${stripes.join('')}</g>`;
}

export function garmentSvg(opts: {
  silhouette: Silhouette;
  color: string;
  view: View;
}): string {
  const s = SPECS[opts.silhouette];
  const base = opts.color;
  const light = mix(base, '#FFFFFF', 0.16);
  const mid = mix(base, '#000000', 0.08);
  const dark = mix(base, '#000000', 0.26);
  const deep = mix(base, '#000000', 0.44);
  const body = outline(s, opts.view);
  const isFront = opts.view !== 'espalda';

  const cuffs =
    s.ribHeight > 0
      ? `
    ${ribBand(CX + s.cuffInnerHalf - 4, s.cuffY - s.ribHeight - 10, s.cuffOuterHalf - s.cuffInnerHalf + 8, s.ribHeight + 18, deep, light)}
    ${ribBand(CX - s.cuffOuterHalf - 4, s.cuffY - s.ribHeight - 10, s.cuffOuterHalf - s.cuffInnerHalf + 8, s.ribHeight + 18, deep, light)}
    ${ribBand(CX - s.bodyHemHalf - 4, s.hemY - s.ribHeight, s.bodyHemHalf * 2 + 8, s.ribHeight + s.hemSag + 6, deep, light)}`
      : '';

  const collar = `
    <path d="M ${CX - s.neckHalf - 8} ${s.shoulderY - 2}
             C ${CX - s.neckHalf * 0.42} ${s.shoulderY + (isFront ? s.neckDepth : s.neckDepth * 0.34) * 1.4 + 20}
               ${CX + s.neckHalf * 0.42} ${s.shoulderY + (isFront ? s.neckDepth : s.neckDepth * 0.34) * 1.4 + 20}
               ${CX + s.neckHalf + 8} ${s.shoulderY - 2}"
          fill="none" stroke="${dark}" stroke-width="17" stroke-linecap="round" opacity="0.72"/>`;

  const pocket =
    opts.silhouette === 'hoodie' && isFront
      ? `<path d="M ${CX - 150} ${s.hemY - 250} L ${CX - 132} ${s.hemY - 118}
                  L ${CX + 132} ${s.hemY - 118} L ${CX + 150} ${s.hemY - 250}"
             fill="none" stroke="${deep}" stroke-width="5" opacity="0.4"/>`
      : '';

  const strings =
    opts.silhouette === 'hoodie' && isFront
      ? `<g stroke="${light}" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.95">
           <path d="M ${CX - 44} ${s.shoulderY + 44} C ${CX - 52} ${s.shoulderY + 140} ${CX - 38} ${s.shoulderY + 190} ${CX - 46} ${s.shoulderY + 236}"/>
           <path d="M ${CX + 40} ${s.shoulderY + 46} C ${CX + 50} ${s.shoulderY + 130} ${CX + 34} ${s.shoulderY + 176} ${CX + 44} ${s.shoulderY + 214}"/>
         </g>`
      : '';

  const cardiganFront = (() => {
    if (opts.silhouette !== 'cardigan' || !isFront) return '';
    const buttons = [0, 1, 2, 3, 4]
      .map((i) => {
        const y = s.shoulderY + 150 + i * 104;
        return `<circle cx="${CX}" cy="${y}" r="12" fill="${deep}" opacity="0.6"/>` +
               `<circle cx="${CX}" cy="${y - 2}" r="12" fill="none" stroke="${light}" stroke-width="2" opacity="0.35"/>`;
      })
      .join('');
    // Ochos trenzados a cada lado de la abertura.
    const cables = [-1, 1]
      .map((side) => {
        const x = CX + side * 118;
        const segs = [0, 1, 2, 3, 4, 5]
          .map((i) => {
            const y = s.shoulderY + 120 + i * 96;
            return `<path d="M ${x - 26} ${y} C ${x + 26} ${y + 32} ${x - 26} ${y + 64} ${x + 26} ${y + 96}"
                       fill="none" stroke="${deep}" stroke-width="9" opacity="0.26" stroke-linecap="round"/>
                    <path d="M ${x + 26} ${y} C ${x - 26} ${y + 32} ${x + 26} ${y + 64} ${x - 26} ${y + 96}"
                       fill="none" stroke="${light}" stroke-width="9" opacity="0.3" stroke-linecap="round"/>`;
          })
          .join('');
        return segs;
      })
      .join('');
    return `<g clip-path="url(#clipBody)">${cables}</g>
            <path d="M ${CX} ${s.shoulderY + 30} L ${CX} ${s.hemY + 6}" stroke="${deep}"
                  stroke-width="5" opacity="0.5"/>${buttons}`;
  })();

  const backSeam = !isFront
    ? `<path d="M ${CX} ${s.shoulderY + 24} L ${CX} ${s.hemY}" stroke="${deep}" stroke-width="4" opacity="0.22"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"    stop-color="${light}"/>
      <stop offset="0.42" stop-color="${base}"/>
      <stop offset="1"    stop-color="${mid}"/>
    </linearGradient>
    <linearGradient id="sides" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="${deep}" stop-opacity="0.42"/>
      <stop offset="0.22" stop-color="${deep}" stop-opacity="0"/>
      <stop offset="0.78" stop-color="${deep}" stop-opacity="0"/>
      <stop offset="1"    stop-color="${deep}" stop-opacity="0.34"/>
    </linearGradient>
    <clipPath id="clipBody"><path d="${body}"/></clipPath>
  </defs>

  ${opts.silhouette === 'hoodie' ? hood(s, deep, dark, light) : ''}

  <path d="${body}" fill="url(#vol)"/>
  <g clip-path="url(#clipBody)">
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#sides)"/>
    ${folds(s, deep, opts.view)}
    ${cuffs}
  </g>
  ${collar}
  ${backSeam}
  ${pocket}
  ${cardiganFront}
  ${strings}
  <path d="${body}" fill="none" stroke="${deep}" stroke-width="2.5" opacity="0.3"/>
</svg>`;
}

export const CANVAS = { width: W, height: H };
