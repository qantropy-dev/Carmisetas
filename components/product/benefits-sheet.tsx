'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { DURATION, EASE, useMotionPrefs } from '@/lib/motion';

const BENEFITS = [
  {
    title: 'Envío a todo el país',
    detail: 'Sale del taller en 1 o 2 días hábiles. Gratis desde $ 200.000.',
    icon: 'M2 12h12l3-4h3l2 4v4h-2M2 12v4h2m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m8 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0',
  },
  {
    title: 'Cambio de talla',
    detail: 'Treinta días para cambiarla, sin costo, si no la has usado.',
    icon: 'M3 10a7 7 0 0 1 12-4.9L18 8M18 3v5h-5M21 14a7 7 0 0 1-12 4.9L6 16M6 21v-5h5',
  },
  {
    title: 'Hecho para durar',
    detail: 'Algodón peinado, costuras reforzadas y teñido que no se va al lavar.',
    icon: 'M12 3 4 6v6c0 4.4 3.4 8.2 8 9 4.6-.8 8-4.6 8-9V6l-8-3Z',
  },
] as const;

/**
 * Los beneficios van en un panel que se despliega desde abajo: en la ficha
 * ocuparían espacio por encima del precio, y ahí lo que manda es la prenda.
 */
export function BenefitsSheet() {
  const [open, setOpen] = useState(false);
  const { reduced } = useMotionPrefs();

  return (
    <div className="border-t border-[var(--ambient-hairline)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="beneficios"
        className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm">Envío, cambios y calidad</span>
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : DURATION.tap, ease: EASE.stage }}
          className="text-[var(--ambient-muted)]"
        >
          ⌄
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.ul
            id="beneficios"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.32, ease: EASE.stage }}
            className="overflow-hidden"
          >
            {BENEFITS.map((benefit) => (
              <li key={benefit.title} className="flex gap-3 pb-4">
                <svg
                  aria-hidden
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 opacity-70"
                >
                  <path d={benefit.icon} />
                </svg>
                <div>
                  <p className="text-sm">{benefit.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--ambient-muted)]">
                    {benefit.detail}
                  </p>
                </div>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
