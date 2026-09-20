'use client';

import Image from 'next/image';
import { motion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { springSwing } from '@/lib/motion';
import type { HeroGarment } from '@/lib/queries/products';

const MAX_DEG = 7;

/**
 * Una prenda colgada de su gancho.
 *
 * El balanceo es un péndulo de verdad, no una rotación decorativa: el origen de
 * la transformación está EN el gancho (`origin-top`), así que la prenda gira
 * desde donde cuelga. La velocidad del arrastre alimenta un resorte; al soltar,
 * el resorte se pasa de largo y se asienta solo. Eso es el balanceo.
 *
 * Cada gancho lleva su propio resorte con una rigidez ligeramente distinta
 * según su posición, para que la fila no se mueva en bloque.
 */
export function RackHanger({
  garment,
  index,
  active,
  velocity,
  onSelect,
}: {
  garment: HeroGarment;
  index: number;
  active: boolean;
  /** Velocidad del carrusel, compartida por toda la barra. */
  velocity: MotionValue<number>;
  onSelect: () => void;
}) {
  // Desfase determinista: los ganchos vecinos responden con distinta inercia.
  const stiffness = (springSwing.stiffness as number) + ((index % 4) - 1.5) * 16;
  const swing = useSpring(velocity, { ...springSwing, stiffness });
  const rotate = useTransform(swing, (v) => Math.max(-MAX_DEG, Math.min(MAX_DEG, v)));

  return (
    <div className="relative flex min-w-0 flex-col items-center">
      {/* El gancho. Cuelga de la barra y no se mueve con la prenda. */}
      <svg
        aria-hidden
        width="26"
        height="30"
        viewBox="0 0 26 30"
        className="relative z-10 -mt-[15px] shrink-0"
        fill="none"
        stroke="var(--ambient-fg)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      >
        <path d="M13 2.5c-2.4 0-3.6 1.6-3.6 3.2 0 1.5 1 2.6 2.4 3l1.2.4" />
        <path d="M13 9.1 3.2 16.8c-.9.7-.5 2.1.7 2.1h18.2c1.2 0 1.6-1.4.7-2.1L13 9.1Z" />
      </svg>

      <motion.button
        type="button"
        onClick={onSelect}
        style={{ rotate }}
        className="group relative -mt-[19px] grid w-full origin-top place-items-center pt-2"
        aria-label={`Ver ${garment.name}`}
        aria-current={active ? 'true' : undefined}
      >
        {/* La oscilacion en reposo va en CSS, en una capa aparte del balanceo:
            asi no pelean por el mismo transform. */}
        <span className={`block w-full ${active ? 'sway-idle' : ''}`}>
          {garment.cutoutUrl ? (
            <Image
              src={garment.cutoutUrl}
              alt=""
              width={640}
              height={820}
              sizes="(max-width: 640px) 62vw, 30vw"
              priority={index === 0}
              className={`mx-auto h-auto max-h-[46dvh] w-full max-w-[min(58vw,320px)] object-contain
                          transition-opacity duration-500
                          ${active ? 'opacity-100' : 'opacity-45'}`}
            />
          ) : null}
        </span>
      </motion.button>
    </div>
  );
}
