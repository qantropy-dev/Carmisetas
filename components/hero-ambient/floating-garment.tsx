'use client';

import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { useMotionPrefs } from '@/lib/motion';

/**
 * La prenda que flota, con su sombra de piso.
 *
 * Reparto deliberado del trabajo:
 *
 * - La flotación y el respirar de la sombra son bucles decorativos: van en CSS
 *   (`float-idle` / `shade-idle`). Así no aparecen en el HTML servido y
 *   `prefers-reduced-motion` los apaga sin ninguna rama de JavaScript. Hacerlo
 *   con `animate` de Framer desajusta la hidratación, porque el servidor nunca
 *   ve la preferencia del visitante y serializa el otro estado.
 *
 * - El parallax del cursor sí va en JS, porque depende del puntero. Los valores
 *   arrancan en cero, así que servidor y cliente pintan el mismo transform.
 *
 * `layoutId` la comparte con el catálogo y la ficha: al navegar, la prenda
 * vuela a su nueva posición en vez de desaparecer y reaparecer.
 */
export function FloatingGarment({
  src,
  alt,
  layoutId,
  priority = false,
  sizes = '(max-width: 1024px) 78vw, 42vw',
  className = '',
}: {
  src: string;
  alt: string;
  layoutId?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const { reduced } = useMotionPrefs();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.6 });
  const y = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.6 });
  // La sombra se mueve menos que la prenda: eso es lo que da la sensación de
  // que la prenda está por encima del suelo y no pegada a él.
  const shadowX = useTransform(x, (v) => v * 0.35);

  useEffect(() => {
    if (reduced || !window.matchMedia('(pointer: fine)').matches) return;

    function onMove(event: PointerEvent) {
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 18);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 11);
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced, pointerX, pointerY]);

  return (
    <motion.div
      style={{ x, y }}
      className={`pointer-events-none flex h-full w-full flex-col items-center justify-end ${className}`}
    >
      {/* La prenda flota; la sombra se queda en el suelo. Por eso la sombra
          vive fuera del contenedor que se mueve. */}
      <div className="float-idle grid min-h-0 w-full flex-1 place-items-end">
        <motion.div
          {...(layoutId ? { layoutId } : {})}
          className="grid h-full w-full place-items-center"
        >
          <Image
            src={src}
            alt={alt}
            width={640}
            height={820}
            sizes={sizes}
            priority={priority}
            className="max-h-full w-auto object-contain"
          />
        </motion.div>
      </div>

      {/* El degradado sale del propio color ambiental, nunca de un gris neutro:
          un gris sobre un escenario cálido se ve sucio. */}
      <motion.span
        aria-hidden
        style={{
          x: shadowX,
          background:
            'radial-gradient(ellipse at center,' +
            ' color-mix(in srgb, var(--ambient-shadow) 58%, transparent) 0%,' +
            ' transparent 72%)',
        }}
        className="shade-idle mt-2.5 h-4 w-[38%] shrink-0 rounded-[50%] blur-[4px]"
      />
    </motion.div>
  );
}
