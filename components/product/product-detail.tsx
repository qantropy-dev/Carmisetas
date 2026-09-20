'use client';

import { useMemo, useState } from 'react';
import { AmbientBackdrop } from '@/components/hero-ambient/ambient-backdrop';
import { BenefitsSheet } from '@/components/product/benefits-sheet';
import { Gallery } from '@/components/product/gallery';
import { InfoTabs } from '@/components/product/info-tabs';
import { PriceTag } from '@/components/product/price-tag';
import { SizeCircles } from '@/components/product/size-circles';
import { FavoriteButton } from '@/components/ui/favorite-button';
import { useBag } from '@/lib/bag';
import { resolvePrice } from '@/lib/pricing';
import type { Product } from '@/lib/queries/products';
import type { GarmentSize } from '@/lib/supabase/database.types';

export function ProductDetail({ product }: { product: Product }) {
  const [colorId, setColorId] = useState(product.colors[0]?.id ?? '');
  const [size, setSize] = useState<GarmentSize | null>(null);
  const [warn, setWarn] = useState(false);
  const { add, setOpen } = useBag();

  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];

  // El precio sigue a la variante: una talla con precio propio lo cambia aquí.
  const price = useMemo(() => {
    if (!color) return resolvePrice({ basePrice: product.basePrice, compareAtPrice: product.compareAtPrice });
    const variant = size ? color.variants.find((v) => v.size === size) : null;
    if (variant) {
      return resolvePrice({ basePrice: variant.price, compareAtPrice: product.compareAtPrice });
    }
    return color.price;
  }, [color, size, product.basePrice, product.compareAtPrice]);

  // Sin colores no hay nada que enseñar; la ficha la protege la consulta.
  if (!color) return null;

  const active = color;
  const sizes = active.variants.map((v) => ({ size: v.size, available: v.available }));
  const variant = size ? active.variants.find((v) => v.size === size) : null;

  function pickColor(nextId: string) {
    setColorId(nextId);
    // La talla elegida puede no existir en el color nuevo: mejor volver a cero
    // que dejar seleccionada una talla que ya no está.
    const next = product.colors.find((c) => c.id === nextId);
    if (size && !next?.variants.some((v) => v.size === size && v.available)) setSize(null);
  }

  function addToBag(): boolean {
    if (!variant || !size) {
      setWarn(true);
      return false;
    }
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colorId: active.id,
      colorName: active.name,
      swatchHex: active.swatchHex,
      size,
      unitPrice: variant.price,
      cutoutUrl: active.cutoutUrl,
    });
    setWarn(false);
    return true;
  }

  return (
    <div className="pb-[max(6.5rem,env(safe-area-inset-bottom))]">
      <AmbientBackdrop tokens={active.ambient} />

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-8 sm:px-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+1rem)] lg:self-start">
          <Gallery images={active.images} colorId={active.id} productName={product.name} />
        </div>

        <div className="flex flex-col gap-6">
          <header>
            {product.categoryName ? (
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--ambient-muted)]">
                {product.categoryName}
              </p>
            ) : null}
            <h1 className="mt-1.5 text-[clamp(2rem,8vw,3rem)] uppercase lg:text-[clamp(2.4rem,3.4vw,3.4rem)]">
              {product.name}
            </h1>
            {product.headline ? (
              <p className="mt-2 text-base text-[var(--ambient-muted)]">{product.headline}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-4">
              <PriceTag price={price} size="lg" />
              <FavoriteButton id={product.id} name={product.name} />
            </div>
          </header>

          {product.colors.length > 1 ? (
            <section className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ambient-muted)]">
                Color · {active.name}
              </p>
              <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
                {product.colors.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={option.id === active.id}
                    aria-label={option.name}
                    onClick={() => pickColor(option.id)}
                    className={`size-9 rounded-full border-2 transition-colors
                      ${option.id === active.id
                        ? 'border-[var(--ambient-fg)]'
                        : 'border-[var(--ambient-hairline)] hover:border-[var(--ambient-fg)]'}`}
                    style={{ backgroundColor: option.swatchHex }}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--ambient-muted)]">
              Talla {size ? `· ${size}` : ''}
            </p>
            <SizeCircles
              sizes={sizes}
              value={size}
              onChange={(next) => {
                setSize(next);
                setWarn(false);
              }}
            />
            {warn ? (
              <p role="alert" className="text-sm">
                Elige una talla para continuar.
              </p>
            ) : variant?.stockStatus === 'pocas' ? (
              <p className="text-sm text-[var(--ambient-muted)]">Quedan pocas en esta talla.</p>
            ) : null}
          </section>

          <InfoTabs
            description={product.description}
            fit={product.fit}
            material={product.material}
            care={product.care}
          />

          <BenefitsSheet />
        </div>
      </div>

      <StickyCta
        onAdd={() => {
          if (addToBag()) setOpen(true);
        }}
        onOrder={() => {
          if (addToBag()) setOpen(true);
        }}
        disabled={sizes.every((s) => !s.available)}
      />
    </div>
  );
}

/** Dos píldoras fijas abajo. Es lo único que no se va de pantalla. */
function StickyCta({
  onAdd,
  onOrder,
  disabled,
}: {
  onAdd: () => void;
  onOrder: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t px-5 pt-3 sm:px-8
                 border-[var(--ambient-hairline)]"
      style={{
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'color-mix(in srgb, var(--ambient) 92%, transparent)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="mx-auto flex max-w-6xl gap-2">
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="min-h-12 flex-1 rounded-[var(--radius-pill)] border text-sm font-medium
                     border-[var(--ambient-fg)] transition-opacity disabled:opacity-40"
        >
          {disabled ? 'Agotada' : 'Agregar a la bolsa'}
        </button>
        <button
          type="button"
          onClick={onOrder}
          disabled={disabled}
          className="min-h-12 flex-1 rounded-[var(--radius-pill)] text-sm font-medium
                     bg-[var(--ambient-fg)] text-[var(--ambient)]
                     transition-opacity disabled:opacity-40"
        >
          Pedir ahora
        </button>
      </div>
    </div>
  );
}
