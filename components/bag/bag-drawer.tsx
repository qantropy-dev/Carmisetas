'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useBag } from '@/lib/bag';
import { checkout, MAX_PER_LINE } from '@/lib/checkout';
import { publicEnvClient } from '@/lib/env-client';
import { DURATION, EASE, useMotionPrefs } from '@/lib/motion';
import { formatCOP } from '@/lib/pricing';

/**
 * La bolsa, en panel lateral.
 *
 * El botón de cierre no sabe nada de WhatsApp: llama a `checkout()` de
 * lib/checkout.ts y abre lo que le devuelva. Cambiar a una pasarela de pago es
 * cambiar esa función, no este componente.
 */
export function BagDrawer() {
  const { items, order, open, setOpen, setQuantity, remove, clear } = useBag();
  const { reduced } = useMotionPrefs();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, setOpen]);

  function finish() {
    const env = publicEnvClient();
    const result = checkout(items, { phone: env.whatsapp, siteUrl: env.siteUrl });

    if (!result.ok) {
      setProblem(
        result.reason === 'bolsa-vacia'
          ? 'La bolsa está vacía.'
          : 'Todavía no hay número de WhatsApp configurado. Avísale al taller.',
      );
      return;
    }
    setProblem(null);
    window.open(result.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : DURATION.tap }}
            onClick={() => setOpen(false)}
            aria-hidden
            className="fixed inset-0 z-40 bg-[var(--color-fg)]/30 backdrop-blur-[2px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Tu bolsa"
            initial={reduced ? { opacity: 0 } : { x: '100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: '100%' }}
            transition={{ duration: reduced ? 0.15 : 0.38, ease: EASE.stage }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col
                       border-l border-[var(--ambient-hairline)]"
            style={{ backgroundColor: 'var(--ambient)', color: 'var(--ambient-fg)' }}
          >
            <header className="flex items-center justify-between gap-3 border-b px-5 py-4
                               border-[var(--ambient-hairline)]">
              <h2 className="text-xl uppercase">
                Tu bolsa
                {order.units > 0 ? (
                  <span className="ml-2 text-sm text-[var(--ambient-muted)]">
                    {order.units} {order.units === 1 ? 'prenda' : 'prendas'}
                  </span>
                ) : null}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar la bolsa"
                className="-mr-2 grid size-11 place-items-center rounded-full text-lg"
              >
                <span aria-hidden>✕</span>
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <p className="text-lg">Todavía no has guardado nada</p>
                <p className="text-sm text-[var(--ambient-muted)]">
                  Las prendas que elijas quedan aquí, incluso si cierras la página.
                </p>
                <Link
                  href="/catalogo"
                  onClick={() => setOpen(false)}
                  className="mt-2 min-h-12 rounded-[var(--radius-pill)] px-6 py-3 text-sm font-medium
                             bg-[var(--ambient-fg)] text-[var(--ambient)]"
                >
                  Ver el catálogo
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y overflow-y-auto overscroll-contain px-5
                               divide-[var(--ambient-hairline)]">
                  {order.lines.map((line) => (
                    <li key={line.variantId} className="flex gap-3 py-4">
                      <Link
                        href={`/prenda/${line.slug}`}
                        onClick={() => setOpen(false)}
                        // El fondo va del escenario, no del color de la prenda:
                        // una prenda oscura sobre su propio tono desaparece.
                        className="grid size-20 shrink-0 place-items-center rounded-2xl"
                        style={{ backgroundColor: 'var(--ambient-veil)' }}
                      >
                        {line.cutoutUrl ? (
                          <Image
                            src={line.cutoutUrl}
                            alt=""
                            width={128}
                            height={164}
                            sizes="80px"
                            className="size-16 object-contain"
                          />
                        ) : null}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm uppercase">{line.name}</p>
                            <p className="flex items-center gap-1.5 text-xs text-[var(--ambient-muted)]">
                              <span
                                aria-hidden
                                className="size-2.5 shrink-0 rounded-full border border-[var(--ambient-hairline)]"
                                style={{ backgroundColor: line.swatchHex }}
                              />
                              {line.colorName} · Talla {line.size}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(line.variantId)}
                            aria-label={`Quitar ${line.name} talla ${line.size}`}
                            className="-mr-1 -mt-1 grid size-9 place-items-center rounded-full text-sm
                                       text-[var(--ambient-muted)] hover:text-[var(--ambient-fg)]"
                          >
                            <span aria-hidden>✕</span>
                          </button>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 rounded-[var(--radius-pill)] border
                                          border-[var(--ambient-hairline)]">
                            <button
                              type="button"
                              onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                              aria-label="Una menos"
                              className="grid size-9 place-items-center rounded-full"
                            >
                              <span aria-hidden>−</span>
                            </button>
                            <span className="min-w-6 text-center text-sm tabular-nums" aria-live="polite">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                              disabled={line.quantity >= MAX_PER_LINE}
                              aria-label="Una más"
                              className="grid size-9 place-items-center rounded-full disabled:opacity-35"
                            >
                              <span aria-hidden>+</span>
                            </button>
                          </div>
                          <p className="text-sm tabular-nums">{formatCOP(line.lineTotal)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer
                  className="border-t px-5 pt-4 border-[var(--ambient-hairline)]"
                  style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-[var(--ambient-muted)]">Total</span>
                    <span className="font-display text-2xl font-semibold tabular-nums">
                      {formatCOP(order.total)}
                    </span>
                  </div>

                  {problem ? (
                    <p role="alert" className="mt-2 text-sm">
                      {problem}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={finish}
                    className="mt-3 min-h-13 w-full rounded-[var(--radius-pill)] py-3.5 text-sm font-medium
                               bg-[var(--ambient-fg)] text-[var(--ambient)]"
                  >
                    Finalizar por WhatsApp
                  </button>

                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={clear}
                      className="min-h-10 text-xs text-[var(--ambient-muted)] underline-offset-4 hover:underline"
                    >
                      Vaciar la bolsa
                    </button>
                    <p className="text-xs text-[var(--ambient-muted)]">
                      Se abre el chat con el pedido escrito.
                    </p>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
