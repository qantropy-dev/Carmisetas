'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ZoomViewer } from '@/components/product/zoom-viewer';
import { DURATION, EASE, useMotionPrefs } from '@/lib/motion';
import type { ProductImage } from '@/lib/queries/products';

const VIEW_LABEL: Record<string, string> = {
  frente: 'Frente',
  espalda: 'Espalda',
  detalle: 'Detalle',
  modelo: 'En modelo',
};

/**
 * La prenda sobre su color ambiental, con una miniatura por vista.
 *
 * El recorte principal lleva el `layoutId` del catálogo: al entrar desde la
 * grilla o el perchero, la prenda vuela hasta aquí en lugar de parpadear.
 */
export function Gallery({
  images,
  colorId,
  productName,
}: {
  images: ProductImage[];
  colorId: string;
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const { reduced } = useMotionPrefs();

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-3xl border border-dashed
                      border-[var(--ambient-hairline)] text-sm text-[var(--ambient-muted)]">
        Sin imágenes todavía
      </div>
    );
  }

  const current = (images[index] ?? images[0]) as ProductImage;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={current.id}
            type="button"
            onClick={() => setZoomOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : DURATION.swap, ease: EASE.stage }}
            aria-label={`Ampliar ${productName}`}
            className="group grid aspect-square w-full cursor-zoom-in place-items-center
                       overflow-hidden rounded-3xl p-6 sm:aspect-[4/5]"
          >
            {index === 0 ? (
              <motion.div layoutId={`garment-${colorId}`} className="grid h-full w-full place-items-center">
                <Image
                  src={current.url}
                  alt={current.alt || productName}
                  width={640}
                  height={820}
                  sizes="(max-width: 1024px) 92vw, 46vw"
                  priority
                  className="max-h-full w-auto object-contain
                             drop-shadow-[0_18px_28px_color-mix(in_srgb,var(--ambient-shadow)_40%,transparent)]"
                />
              </motion.div>
            ) : (
              <Image
                src={current.url}
                alt={current.alt || productName}
                width={640}
                height={820}
                sizes="(max-width: 1024px) 92vw, 46vw"
                className="max-h-full w-auto object-contain
                           drop-shadow-[0_18px_28px_color-mix(in_srgb,var(--ambient-shadow)_40%,transparent)]"
              />
            )}
          </motion.button>
        </AnimatePresence>

        <span
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-4 grid size-9 place-items-center
                     rounded-full border border-[var(--ambient-hairline)] text-sm
                     opacity-70 backdrop-blur-sm"
          title="Toca para ampliar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4.2" />
            <path d="m9.2 9.2 3.2 3.2" strokeLinecap="round" />
            <path d="M6 4.2v3.6M4.2 6h3.6" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      {images.length > 1 ? (
        <div role="tablist" aria-label="Vistas de la prenda" className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border
                          transition-colors
                          ${i === index
                            ? 'border-[var(--ambient-fg)]'
                            : 'border-[var(--ambient-hairline)] opacity-70 hover:opacity-100'}`}
              title={VIEW_LABEL[image.view] ?? image.view}
            >
              <Image
                src={image.url}
                alt=""
                width={128}
                height={164}
                sizes="64px"
                className="size-14 object-contain"
              />
              <span className="sr-only">{VIEW_LABEL[image.view] ?? image.view}</span>
            </button>
          ))}
        </div>
      ) : null}

      <AnimatePresence>
        {zoomOpen ? (
          <ZoomViewer
            images={images}
            index={index}
            onIndexChange={setIndex}
            onClose={() => setZoomOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
