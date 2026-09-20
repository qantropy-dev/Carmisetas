'use client';

import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientBackdrop } from '@/components/hero-ambient/ambient-backdrop';
import { RackHanger } from '@/components/rack-slider/rack-hanger';
import { PriceTag } from '@/components/product/price-tag';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { useMotionPrefs } from '@/lib/motion';
import type { HeroGarment } from '@/lib/queries/products';
import { GARMENT_SIZES } from '@/lib/supabase/database.types';

/** Cuánta rotación produce la velocidad del arrastre. */
const VELOCITY_TO_DEG = 170;

export function Rack({ garments }: { garments: HeroGarment[] }) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    skipSnaps: false,
  });
  const [index, setIndex] = useState(0);
  const velocity = useMotionValue(0);
  const { reduced, textVariants } = useMotionPrefs();
  const last = useRef({ progress: 0, time: 0 });

  const current = garments[index] as HeroGarment;

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    onSelect();
    embla.on('select', onSelect).on('reInit', onSelect);
    return () => {
      embla.off('select', onSelect).off('reInit', onSelect);
    };
  }, [embla]);

  /*
   * La velocidad del carrusel alimenta el resorte de cada gancho. Se mide con
   * la derivada del progreso de Embla en lugar de con eventos de puntero: así
   * el balanceo también aparece al usar las flechas, el teclado o la inercia
   * después de soltar, no solo mientras se arrastra.
   */
  useEffect(() => {
    if (!embla || reduced) return;
    let frame = 0;

    const tick = (time: number) => {
      const progress = embla.scrollProgress();
      const previous = last.current;
      const dt = previous.time === 0 ? 0 : (time - previous.time) / 1000;

      if (dt > 0) {
        const raw = (progress - previous.progress) / dt;
        // Signo invertido: al arrastrar hacia la izquierda, la prenda se queda
        // atrás y se va hacia la derecha, como cualquier cosa que cuelga.
        velocity.set(-raw * VELOCITY_TO_DEG);
      }
      last.current = { progress, time };
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [embla, reduced, velocity]);

  const scrollTo = useCallback((to: number) => embla?.scrollTo(to), [embla]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!embla) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        embla.scrollNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        embla.scrollPrev();
      } else if (event.key === 'Home') {
        event.preventDefault();
        embla.scrollTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        embla.scrollTo(garments.length - 1);
      }
    },
    [embla, garments.length],
  );

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-h))] flex-col">
      <AmbientBackdrop tokens={current.ambient} />

      {/* ------------------------------------------------------- el perchero -- */}
      <div
        role="group"
        aria-roledescription="perchero"
        aria-label="Prendas colgadas. Usa las flechas para recorrerlas."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative flex min-h-0 flex-1 items-start rounded-b-3xl focus-visible:outline-offset-[-2px]"
      >
        {/* La barra de la que cuelgan los ganchos, de borde a borde. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-14 h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, var(--ambient-hairline) 6%,' +
              ' var(--ambient-hairline) 94%, transparent)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-14 h-[3px] opacity-40 blur-[2px]"
          style={{ background: 'var(--ambient-shadow)' }}
        />

        <div ref={emblaRef} className="h-full overflow-hidden pt-14">
          <div className="flex h-full touch-pan-y items-start">
            {garments.map((garment, i) => (
              <div
                key={garment.id}
                className="min-w-0 flex-[0_0_64%] px-2 sm:flex-[0_0_40%] lg:flex-[0_0_26%]"
              >
                <RackHanger
                  garment={garment}
                  index={i}
                  active={i === index}
                  velocity={velocity}
                  onSelect={() => scrollTo(i)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ bajo la barra -- */}
      <div className="px-5 pb-6 pt-2 sm:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current.id} className="flex flex-col items-center gap-3 text-center">
            <motion.div
              custom={0}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex gap-1.5"
              role="list"
              aria-label="Tallas"
            >
              {GARMENT_SIZES.map((size) => {
                const option = current.sizes.find((s) => s.size === size);
                const available = option?.available ?? false;
                // La talla activa va subrayada, como pide la referencia.
                const isActive = available && current.sizes.find((s) => s.available)?.size === size;
                return (
                  <span
                    key={size}
                    role="listitem"
                    className={`text-sm underline-offset-[5px]
                      ${isActive ? 'underline' : ''}
                      ${available ? '' : 'line-through opacity-35'}`}
                  >
                    {size}
                  </span>
                );
              })}
            </motion.div>

            <motion.h2
              custom={1}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-[clamp(1.6rem,7vw,2.6rem)] uppercase"
            >
              {current.name}
            </motion.h2>

            <motion.div
              custom={2}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <PriceTag price={current.price} size="lg" />
            </motion.div>

            <motion.div
              custom={3}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mt-1 flex items-center gap-3"
            >
              <FavoriteButton id={current.id} name={current.name} />
              <Link
                href={`/prenda/${current.slug}`}
                className="text-sm underline underline-offset-4 decoration-[var(--ambient-hairline)]
                           transition-colors hover:decoration-[var(--ambient-fg)]"
              >
                detalles
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* ------------------------------------------------------- controles -- */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => embla?.scrollPrev()}
            aria-label="Prenda anterior"
            className="grid size-11 place-items-center rounded-full border text-lg leading-none
                       border-[var(--ambient-hairline)] transition-colors
                       hover:border-[var(--ambient-fg)]"
          >
            <span aria-hidden>←</span>
          </button>

          <ol className="flex flex-1 justify-center gap-1" aria-label={`Prenda ${index + 1} de ${garments.length}`}>
            {garments.map((garment, i) => (
              <li key={garment.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={garment.name}
                  aria-current={i === index ? 'true' : undefined}
                  className="grid h-7 place-items-center px-0.5"
                >
                  <span
                    className={`block size-1.5 rounded-full transition-all
                      ${i === index ? 'scale-125 bg-[var(--ambient-fg)]' : 'bg-[var(--ambient-hairline)]'}`}
                  />
                </button>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => embla?.scrollNext()}
            aria-label="Prenda siguiente"
            className="grid size-11 place-items-center rounded-full border text-lg leading-none
                       border-[var(--ambient-hairline)] transition-colors
                       hover:border-[var(--ambient-fg)]"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
