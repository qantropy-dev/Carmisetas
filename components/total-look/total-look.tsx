'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { PriceTag } from '@/components/product/price-tag';
import { SizeCircles } from '@/components/product/size-circles';
import { DURATION, EASE, useMotionPrefs } from '@/lib/motion';
import type { CollectionLook } from '@/lib/queries/products';

/**
 * Total Look: la sección editorial del home.
 *
 * Aquí el escenario es de la sección, no de la página: el hero de arriba manda
 * en `:root` y esta sección aplica los suyos en su propio contenedor, así que
 * los hereda solo lo que vive dentro.
 */
export function TotalLook({ looks }: { looks: CollectionLook[] }) {
  const [tab, setTab] = useState(0);
  const [index, setIndex] = useState(0);
  const { reduced, textVariants } = useMotionPrefs();

  const collection = looks[tab] as CollectionLook;
  const garment = collection.garments[Math.min(index, collection.garments.length - 1)];
  if (!garment) return null;

  function pickTab(next: number) {
    setTab(next);
    setIndex(0);
  }

  return (
    <section
      aria-label="Total Look"
      className="stage relative overflow-hidden px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-14"
      style={garment.ambient as React.CSSProperties}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--ambient-muted)]">
            Total Look
          </h2>

          <div
            role="tablist"
            aria-label="Colecciones"
            className="-mx-5 flex gap-4 overflow-x-auto px-5 sm:mx-0 sm:px-0"
          >
            {looks.map((look, i) => (
              <button
                key={look.id}
                type="button"
                role="tab"
                aria-selected={i === tab}
                onClick={() => pickTab(i)}
                className={`shrink-0 py-1 text-sm underline-offset-[6px] transition-colors
                  ${i === tab
                    ? 'underline decoration-2'
                    : 'text-[var(--ambient-muted)] hover:text-[var(--ambient-fg)]'}`}
              >
                {look.name}
              </button>
            ))}
          </div>
        </header>

        <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-10">
          {/* ------------------------------------------- tipografía gigante -- */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${collection.id}-${garment.id}`} className="relative z-10 min-w-0">
              <motion.p
                custom={0}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="font-display text-[clamp(2.6rem,13vw,7rem)] font-extrabold uppercase
                           leading-[0.84] tracking-[-0.05em]"
              >
                {collection.name}
              </motion.p>

              <motion.p
                custom={1}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="mt-4 max-w-[38ch] text-sm leading-relaxed text-[var(--ambient-muted)]"
              >
                {garment.description ?? garment.headline}
              </motion.p>

              <motion.div
                custom={2}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4"
              >
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ambient-muted)]">
                    {garment.name}
                  </p>
                  <SizeCircles sizes={garment.sizes} />
                </div>
                <PriceTag price={garment.price} size="lg" />
              </motion.div>

              <motion.div custom={3} variants={textVariants} initial="enter" animate="center" exit="exit">
                <Link
                  href={`/prenda/${garment.slug}`}
                  className="mt-6 inline-flex min-h-12 items-center rounded-[var(--radius-pill)] px-6
                             text-sm font-medium bg-[var(--ambient-fg)] text-[var(--ambient)]"
                >
                  Ver la prenda
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* ------------------------------------------------ prenda + índice -- */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative grid h-[42vh] min-h-56 flex-1 place-items-center sm:h-[56vh] sm:w-[34vw]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={garment.colorId}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: DURATION.swap, ease: EASE.stage },
                  }}
                  exit={{
                    opacity: 0,
                    y: reduced ? 0 : -18,
                    scale: reduced ? 1 : 0.97,
                    transition: { duration: DURATION.swap * 0.6, ease: EASE.exit },
                  }}
                  className="absolute inset-0 grid place-items-center"
                >
                  {garment.cutoutUrl ? (
                    <Image
                      src={garment.cutoutUrl}
                      alt={`${garment.name} en color ${garment.colorName}`}
                      width={640}
                      height={820}
                      sizes="(max-width: 640px) 60vw, 34vw"
                      className="float-idle max-h-full w-auto object-contain
                                 drop-shadow-[0_20px_30px_color-mix(in_srgb,var(--ambient-shadow)_38%,transparent)]"
                    />
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Indicador vertical de posición. */}
            {collection.garments.length > 1 ? (
              <ol
                className="flex shrink-0 flex-col items-center gap-2"
                aria-label={`Prenda ${index + 1} de ${collection.garments.length}`}
              >
                {collection.garments.map((item, i) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={item.name}
                      aria-current={i === index ? 'true' : undefined}
                      className="grid size-7 place-items-center"
                    >
                      <span
                        className={`block w-0.5 rounded-full transition-all
                          ${i === index
                            ? 'h-6 bg-[var(--ambient-fg)]'
                            : 'h-3 bg-[var(--ambient-hairline)]'}`}
                      />
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
