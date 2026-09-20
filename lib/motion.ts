'use client';

import { useReducedMotion, type Transition, type Variants } from 'framer-motion';

/**
 * Una sola escala de movimiento para todo el sitio. Si algo se siente distinto
 * al resto, es que no está usando esto.
 */
export const EASE = {
  /** Entrada larga y limpia: el escenario, las prendas que llegan. */
  stage: [0.22, 1, 0.36, 1],
  /** Salida rápida: lo que se va no debe entretener. */
  exit: [0.4, 0, 1, 1],
} as const;

export const DURATION = {
  /** Transición del color ambiental. El documento pide 500–700 ms. */
  ambient: 0.6,
  /** Cambio de prenda. */
  swap: 0.42,
  /** Microinteracciones. */
  tap: 0.18,
} as const;

/** Oscilación en reposo: entre 4 y 6 px, nunca más. */
export const FLOAT_PX = 5;
export const FLOAT_SECONDS = 3.4;

export const springSoft: Transition = { type: 'spring', stiffness: 220, damping: 30, mass: 0.9 };
/** Resorte del perchero: rebota y se asienta, como un gancho de verdad. */
export const springSwing: Transition = { type: 'spring', stiffness: 130, damping: 11, mass: 0.7 };

/**
 * Con `prefers-reduced-motion` todo se sustituye por fundidos simples: sin
 * desplazamiento, sin escala, sin flotación ni parallax.
 */
export function useMotionPrefs() {
  const reduced = useReducedMotion() ?? false;

  /*
   * Las dos ramas producen EXACTAMENTE las mismas propiedades; solo cambian
   * los valores y la transición.
   *
   * Es deliberado: `useReducedMotion()` devuelve false en el servidor y puede
   * devolver true al hidratar. Si una rama tuviera `x` y la otra no, el estilo
   * del HTML servido no coincidiría con el del cliente y React abandonaría el
   * parcheo de ese árbol.
   */
  const garmentVariants: Variants = {
    enter: (direction: number) =>
      reduced
        ? { opacity: 0, x: 0, y: 0, scale: 1 }
        : { opacity: 0, x: direction * 44, y: 18, scale: 0.94 },
    center: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: reduced
        ? { duration: 0.28, ease: 'linear' }
        : { duration: DURATION.swap, ease: EASE.stage },
    },
    exit: (direction: number) =>
      reduced
        ? { opacity: 0, x: 0, y: 0, scale: 1, transition: { duration: 0.2, ease: 'linear' } }
        : {
            opacity: 0,
            x: direction * -38,
            y: -14,
            scale: 0.96,
            transition: { duration: DURATION.swap * 0.62, ease: EASE.exit },
          },
  };

  const textVariants: Variants = {
    enter: reduced ? { opacity: 0, y: 0 } : { opacity: 0, y: 14 },
    center: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0.25 }
        : { duration: 0.44, delay: index * 0.045, ease: EASE.stage },
    }),
    exit: reduced
      ? { opacity: 0, y: 0, transition: { duration: 0.15 } }
      : { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE.exit } },
  };

  return { reduced, garmentVariants, textVariants };
}
