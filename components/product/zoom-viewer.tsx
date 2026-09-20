'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DURATION, EASE, useMotionPrefs } from '@/lib/motion';
import type { ProductImage } from '@/lib/queries/products';

const VIEW_LABEL: Record<string, string> = {
  frente: 'De frente',
  espalda: 'Por la espalda',
  detalle: 'Detalle',
  modelo: 'En modelo',
};

/**
 * Visor a pantalla completa.
 *
 * El zoom usa el gesto nativo de cada plataforma: `touch-action: pinch-zoom`
 * deja que el navegador haga el pinch del teléfono, y en escritorio se acerca
 * siguiendo el cursor. No se reimplementa la gravedad.
 */
export function ZoomViewer({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: ProductImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const closeRef = useRef<HTMLButtonElement>(null);
  const { reduced } = useMotionPrefs();

  const current = images[index] as ProductImage;

  const go = useCallback(
    (step: number) => {
      setZoomed(false);
      onIndexChange((index + step + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, go]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${VIEW_LABEL[current.view] ?? current.view}. ${index + 1} de ${images.length}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.15 : DURATION.tap }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'var(--ambient)' }}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--ambient-muted)]">
          {VIEW_LABEL[current.view] ?? current.view}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar el visor"
          className="grid size-11 place-items-center rounded-full border text-lg
                     border-[var(--ambient-hairline)]"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>

      <motion.div
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4"
        style={{ touchAction: zoomed ? 'pinch-zoom' : 'pan-y pinch-zoom' }}
        drag={zoomed ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) go(1);
          else if (info.offset.x > 60) go(-1);
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={current.id}
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : DURATION.swap, ease: EASE.stage }}
            onClick={(event) => {
              // Escritorio: acercar hacia donde se hizo clic.
              const box = event.currentTarget.getBoundingClientRect();
              setOrigin({
                x: ((event.clientX - box.left) / box.width) * 100,
                y: ((event.clientY - box.top) / box.height) * 100,
              });
              setZoomed((z) => !z);
            }}
            aria-label={zoomed ? 'Alejar' : 'Acercar'}
            className="grid h-full max-h-full w-full place-items-center overflow-hidden"
          >
            <Image
              src={current.url}
              alt={current.alt || ''}
              width={1280}
              height={1640}
              sizes="100vw"
              priority
              className="max-h-full w-auto object-contain transition-transform duration-500"
              style={{
                transform: zoomed ? 'scale(2.2)' : 'scale(1)',
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }}
            />
          </motion.button>
        </AnimatePresence>
      </motion.div>

      <div className="flex items-center justify-center gap-2 px-5 pb-6 pt-3">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => {
              setZoomed(false);
              onIndexChange(i);
            }}
            aria-label={VIEW_LABEL[image.view] ?? image.view}
            aria-current={i === index ? 'true' : undefined}
            className="grid h-8 place-items-center px-1"
          >
            <span
              className={`block h-0.5 rounded-full transition-all
                ${i === index ? 'w-6 bg-[var(--ambient-fg)]' : 'w-3 bg-[var(--ambient-hairline)]'}`}
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
