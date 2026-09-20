'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';
import type { HeroGarment } from '@/lib/queries/products';

/**
 * Miniatura de la siguiente prenda, en la esquina.
 *
 * Su fondo ya es el color del escenario que viene: adelanta el cambio antes de
 * que ocurra, que es justo lo que hace que el sitio se sienta un showroom y no
 * un carrusel.
 */
export function NextThumb({
  garment,
  onSelect,
}: {
  garment: HeroGarment;
  onSelect: () => void;
}) {
  // El boton enseña el nombre corto; el nombre accesible tiene que contenerlo,
  // o un lector de pantalla y la voz del usuario dicen cosas distintas.
  const short = garment.name.replace(/^(Camiseta|Suéter|Cardigan)\s/i, '');

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DURATION.tap, ease: EASE.stage }}
      className="flex items-center gap-2.5 rounded-[var(--radius-pill)] border p-1 pr-3.5
                 border-[var(--ambient-hairline)] transition-colors"
    >
      <motion.span
        key={garment.colorId}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.swap, ease: EASE.stage }}
        className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full"
        style={{ backgroundColor: garment.ambientHex }}
      >
        {garment.cutoutUrl ? (
          <Image
            src={garment.cutoutUrl}
            alt=""
            width={96}
            height={123}
            sizes="44px"
            className="size-8 object-contain"
          />
        ) : null}
      </motion.span>

      <span className="text-left leading-tight">
        {/* El nombre accesible se compone del texto visible: un aria-label que
            no lo contenga rompe WCAG 2.5.3 y descoloca al control por voz. */}
        <span className="sr-only">Ver </span>
        <span className="block font-display text-[11px] font-bold uppercase tracking-tight">
          {short}
        </span>
        <span className="block text-[9px] uppercase tracking-[0.14em] text-[var(--ambient-muted)]">
          Siguiente
        </span>
      </span>
    </motion.button>
  );
}
