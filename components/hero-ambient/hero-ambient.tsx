'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { AmbientBackdrop } from '@/components/hero-ambient/ambient-backdrop';
import { FloatingGarment } from '@/components/hero-ambient/floating-garment';
import { NextThumb } from '@/components/hero-ambient/next-thumb';
import { PriceTag } from '@/components/product/price-tag';
import { SizeCircles } from '@/components/product/size-circles';
import { useMotionPrefs } from '@/lib/motion';
import type { HeroGarment } from '@/lib/queries/products';

const SWIPE_PX = 56;

export function HeroAmbient({ garments }: { garments: HeroGarment[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const { garmentVariants, textVariants } = useMotionPrefs();

  const total = garments.length;
  const current = garments[index] as HeroGarment;
  const next = garments[(index + 1) % total] as HeroGarment;

  const go = useCallback(
    (step: number) => {
      setDirection(step >= 0 ? 1 : -1);
      setIndex((i) => (i + step + total) % total);
    },
    [total],
  );

  /*
   * Las flechas se escuchan en el propio hero, no en `window`. Con Total Look
   * debajo, un listener global secuestraría las flechas de toda la página:
   * estarías leyendo otra sección y el hero cambiaría de prenda a tu espalda.
   */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      }
    },
    [go],
  );

  // Precargar la siguiente: el cambio tiene que sentirse instantáneo.
  useEffect(() => {
    if (!next.cutoutUrl) return;
    const img = new window.Image();
    img.src = next.cutoutUrl;
  }, [next.cutoutUrl]);

  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label="Prendas destacadas. Usa las flechas para recorrerlas."
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-hero
      className="flex min-h-[calc(100dvh-var(--nav-h))] flex-col px-5 focus-visible:outline-offset-[-2px] sm:px-8"
    >
      <AmbientBackdrop tokens={current.ambient} />
      <div
        className="grid flex-1 grid-rows-[auto_minmax(0,1fr)_auto] items-center gap-3 py-4
                   lg:grid-cols-[minmax(240px,1fr)_minmax(0,1.45fr)_minmax(210px,1fr)]
                   lg:grid-rows-[minmax(0,1fr)] lg:gap-8"
      >
        {/* ------------------------------------------------- zona izquierda -- */}
        <div className="lg:self-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={current.id} className="flex flex-col items-start">
              {current.categoryName ? (
                <motion.p
                  custom={0}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="text-[10px] uppercase tracking-[0.2em] text-[var(--ambient-muted)]"
                >
                  {current.categoryName}
                </motion.p>
              ) : null}

              <motion.h1
                custom={1}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="mt-1.5 text-[clamp(2rem,8.5vw,2.9rem)] uppercase lg:text-[clamp(2.8rem,4.4vw,4.3rem)]"
              >
                {current.name}
              </motion.h1>

              {current.headline ? (
                <motion.p
                  custom={2}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="mt-2 max-w-[34ch] text-sm leading-relaxed text-[var(--ambient-muted)] lg:text-base"
                >
                  {current.headline}
                </motion.p>
              ) : null}

              {current.description ? (
                <motion.p
                  custom={3}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="mt-3.5 hidden max-w-[38ch] text-[13px] leading-relaxed text-[var(--ambient-muted)] lg:block"
                >
                  {current.description}
                </motion.p>
              ) : null}

              <motion.div custom={4} variants={textVariants} initial="enter" animate="center" exit="exit">
                <Link
                  href={`/prenda/${current.slug}`}
                  className="mt-5 hidden min-h-12 items-center rounded-[var(--radius-pill)] px-6
                             text-sm font-medium transition-opacity hover:opacity-90
                             bg-[var(--ambient-fg)] text-[var(--ambient)] lg:inline-flex"
                >
                  Ver la prenda
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ---------------------------------------------------- zona centro -- */}
        <motion.div
          className="relative min-h-0 touch-pan-y self-stretch"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.14}
          onDragEnd={(_, info) => {
            if (info.offset.x < -SWIPE_PX) go(1);
            else if (info.offset.x > SWIPE_PX) go(-1);
          }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={current.colorId}
              custom={direction}
              variants={garmentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              {current.cutoutUrl ? (
                <FloatingGarment
                  src={current.cutoutUrl}
                  alt={`${current.name} en color ${current.colorName}`}
                  layoutId={`garment-${current.colorId}`}
                  priority={index === 0}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ------------------------------------------------- zona derecha --- */}
        <div className="flex items-end justify-between gap-4 lg:flex-col lg:items-end lg:justify-center lg:gap-7">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`meta-${current.id}`}
              variants={textVariants}
              custom={0}
              initial="enter"
              animate="center"
              exit="exit"
              className="min-w-0 lg:order-2 lg:text-right"
            >
              <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--ambient-muted)]">
                {current.colorName}
              </p>
              <SizeCircles sizes={current.sizes} className="lg:justify-end" />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`price-${current.id}`}
              variants={textVariants}
              custom={1}
              initial="enter"
              animate="center"
              exit="exit"
              className="shrink-0 lg:order-1"
            >
              <PriceTag price={current.price} size="lg" align="end" className="justify-end" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* --------------------------------------------------------- controles -- */}
      <div className="flex items-center justify-between gap-3 pb-5 pt-1">
        <div className="flex gap-1.5">
          <Arrow label="Prenda anterior" onClick={() => go(-1)} glyph="‹" />
          <Arrow label="Prenda siguiente" onClick={() => go(1)} glyph="›" />
        </div>

        <ol
          className="flex flex-1 justify-center gap-1"
          aria-label={`Prenda ${index + 1} de ${total}`}
        >
          {garments.map((garment, i) => (
            <li key={garment.id}>
              <button
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                aria-label={garment.name}
                aria-current={i === index ? 'true' : undefined}
                className="grid size-7 place-items-center"
              >
                <span
                  className={`block h-0.5 rounded-full transition-all
                    ${i === index ? 'w-5 bg-[var(--ambient-fg)]' : 'w-3 bg-[var(--ambient-hairline)]'}`}
                />
              </button>
            </li>
          ))}
        </ol>

        <NextThumb garment={next} onSelect={() => go(1)} />
      </div>
    </div>
  );
}

function Arrow({
  label,
  onClick,
  glyph,
}: {
  label: string;
  onClick: () => void;
  glyph: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full border text-lg leading-none
                 border-[var(--ambient-hairline)] transition-colors
                 hover:border-[var(--ambient-fg)]"
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}
