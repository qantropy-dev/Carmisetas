'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { PriceTag } from '@/components/product/price-tag';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { DURATION, EASE } from '@/lib/motion';
import { QuickAdd } from '@/components/bag/quick-add';
import type { Garment } from '@/lib/queries/products';

/**
 * Tarjeta del bento.
 *
 * Al pasar el cursor —o al tocar, en un teléfono— la prenda gira: se ve la
 * espalda. En móvil el primer toque voltea y el segundo entra a la ficha, que
 * es la convención que la gente ya conoce de las galerías táctiles.
 */
export function BentoCard({
  product,
  large = false,
  priority = false,
}: {
  product: Garment;
  large?: boolean;
  /** Las primeras tarjetas son el LCP de la lista: no pueden ir diferidas. */
  priority?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [adding, setAdding] = useState(false);
  const hasBack = Boolean(product.backUrl);
  const showBack = flipped && hasBack;
  const fade = `opacity ${DURATION.swap}s cubic-bezier(${EASE.stage.join(',')})`;
  const inStock = product.sizes.some((s) => s.available);
  const sizes = large
    ? '(max-width: 640px) 88vw, 44vw'
    : '(max-width: 640px) 44vw, 23vw';

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl ${large ? 'sm:col-span-2 sm:row-span-2' : ''}`}
      // Los tokens completos, no solo el fondo: si solo se pusiera el color de
      // fondo, un hijo que use --ambient-muted leería el de la página y el
      // contraste calculado no correspondería a esta tarjeta.
      style={
        {
          ...product.ambient,
          backgroundColor: 'var(--ambient)',
          color: 'var(--ambient-fg)',
        } as React.CSSProperties
      }
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <Link
        href={`/prenda/${product.slug}`}
        onClick={(event) => {
          // Táctil: el primer toque enseña la espalda, el segundo entra.
          if (hasBack && !flipped && window.matchMedia('(hover: none)').matches) {
            event.preventDefault();
            setFlipped(true);
          }
        }}
        className="flex h-full flex-col"
      >
        <div
          className={`relative grid w-full place-items-center p-4 sm:p-5
                      ${large ? 'aspect-square' : 'aspect-[4/5]'}`}
        >
          {/* El cruce frente/espalda va en CSS puro: es un fundido entre dos
              imágenes, y así el estado es el mismo en el HTML servido y en el
              hidratado, sin depender de que una animación llegue a correr. */}
          {product.cutoutUrl ? (
            <motion.div
              layoutId={`garment-${product.colorId}`}
              className="grid h-full w-full place-items-center"
              style={{ opacity: showBack ? 0 : 1, transition: fade }}
            >
              <Image
                src={product.cutoutUrl}
                alt={product.name}
                width={640}
                height={820}
                sizes={sizes}
                priority={priority}
                className="max-h-full w-auto object-contain"
              />
            </motion.div>
          ) : null}

          {hasBack ? (
            <div
              aria-hidden
              className="absolute inset-0 grid place-items-center p-4 sm:p-5"
              style={{ opacity: showBack ? 1 : 0, transition: fade }}
            >
              <Image
                src={product.backUrl as string}
                alt=""
                width={640}
                height={820}
                sizes={sizes}
                className="max-h-full w-auto object-contain"
              />
            </div>
          ) : null}

          {!inStock ? (
            <span
              className="absolute left-4 top-4 rounded-[var(--radius-pill)] px-2.5 py-1 text-[10px]
                         uppercase tracking-[0.12em]"
              style={{ backgroundColor: 'var(--ambient-veil)' }}
            >
              Agotada
            </span>
          ) : null}
        </div>

        {/* Nombre y precio apilados: en una tarjeta de media pantalla no caben
            en la misma línea sin recortar uno de los dos. */}
        <div className="mt-auto flex flex-col gap-1 p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="min-w-0">
            <h2 className={`truncate uppercase ${large ? 'text-xl' : 'text-[15px]'}`}>
              {product.name}
            </h2>
            {product.colorName ? (
              <p
                className="mt-0.5 truncate text-[10px] uppercase tracking-[0.12em]"
                style={{ color: 'var(--ambient-muted)' }}
              >
                {product.colorName}
              </p>
            ) : null}
          </div>
          <PriceTag price={product.price} size={large ? 'md' : 'sm'} />
        </div>
      </Link>

      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <FavoriteButton id={product.id} name={product.name} className="size-9" />
        {inStock ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label={`Agregar ${product.name} a la bolsa`}
            className="grid size-9 place-items-center rounded-full border text-lg leading-none
                       border-[var(--ambient-hairline)] transition-colors
                       hover:border-[var(--ambient-fg)]"
          >
            <span aria-hidden>+</span>
          </button>
        ) : null}
      </div>

      {/* Se monta solo al abrirlo: seis <dialog> ocultos en la grilla no
          aportan nada y ensucian el árbol. */}
      {adding ? <QuickAdd garment={product} open onClose={() => setAdding(false)} /> : null}
    </article>
  );
}
