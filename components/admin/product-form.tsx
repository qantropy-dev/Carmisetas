'use client';

import Link from 'next/link';
import { useActionState, useState, useTransition } from 'react';
import { removeProduct, saveProduct } from '@/app/admin/(panel)/prendas/actions';
import { ColorEditor } from '@/components/admin/color-editor';
import { LivePreview } from '@/components/admin/live-preview';
import { VariantMatrix } from '@/components/admin/variant-matrix';
import { Button } from '@/components/ui/button';
import { Field, inputClass, textareaClass } from '@/components/ui/field';
import { Status } from '@/components/ui/status';
import { Switch } from '@/components/ui/switch';
import { IDLE } from '@/lib/actions';
import { formatCOP } from '@/lib/pricing';
import { slugify } from '@/lib/slug';
import type { EditableProduct } from '@/lib/queries/admin';
import type { CategoryRow, CollectionRow } from '@/lib/supabase/database.types';

export function ProductForm({
  product,
  categories,
  collections,
}: {
  product: EditableProduct | null;
  categories: CategoryRow[];
  collections: CollectionRow[];
}) {
  const [state, action, pending] = useActionState(saveProduct, IDLE);
  const [, startTransition] = useTransition();

  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(product !== null);
  const [headline, setHeadline] = useState(product?.headline ?? '');
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ''));
  const [compareAt, setCompareAt] = useState(
    product?.compareAtPrice === null || product?.compareAtPrice === undefined
      ? ''
      : String(product.compareAtPrice),
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [collectionIds, setCollectionIds] = useState<string[]>(product?.collectionIds ?? []);
  const [previewColor, setPreviewColor] = useState<string | null>(product?.colors[0]?.id ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const base = Number(basePrice.replace(/\D/g, '') || '0');
  const compare = compareAt.replace(/\D/g, '') === '' ? null : Number(compareAt.replace(/\D/g, ''));

  function changeName(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10">
      <div className="flex min-w-0 flex-col gap-8">
        {/* ---------------------------------------------- datos generales -- */}
        <form action={action} id="producto" className="flex flex-col gap-5">
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <input type="hidden" name="is_active" value={String(isActive)} />
          <input type="hidden" name="is_featured" value={String(isFeatured)} />
          {collectionIds.map((id) => (
            <input key={id} type="hidden" name="collection_ids" value={id} />
          ))}

          <Field label="Nombre" error={state.fieldErrors['name']}>
            <input
              name="name"
              value={name}
              onChange={(e) => changeName(e.target.value)}
              required
              className={inputClass}
              placeholder="Camiseta Bruma"
            />
          </Field>

          <Field
            label="Enlace"
            error={state.fieldErrors['slug']}
            hint={`carmisetas.com/prenda/${slug || '…'}`}
          >
            <input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              spellCheck={false}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field
            label="Titular del hero"
            error={state.fieldErrors['headline']}
            hint="La frase corta que acompaña a la prenda cuando flota en la portada."
          >
            <input
              name="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className={inputClass}
              placeholder="El peso justo del algodón"
            />
          </Field>

          <Field label="Descripción" error={state.fieldErrors['description']}>
            <textarea
              name="description"
              defaultValue={product?.description ?? ''}
              className={textareaClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Precio" error={state.fieldErrors['base_price']} hint={formatCOP(base)}>
              <input
                name="base_price"
                inputMode="numeric"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value.replace(/\D/g, ''))}
                required
                className={`${inputClass} tabular-nums`}
                placeholder="89900"
              />
            </Field>

            <Field
              label="Precio tachado"
              error={state.fieldErrors['compare_at_price']}
              hint={
                compare === null
                  ? 'Vacío = sin descuento'
                  : compare > base
                    ? `${formatCOP(compare)} · −${Math.floor(((compare - base) / compare) * 100)}%`
                    : 'Tiene que ser mayor que el precio'
              }
            >
              <input
                name="compare_at_price"
                inputMode="numeric"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} tabular-nums`}
                placeholder="—"
              />
            </Field>
          </div>

          <Field label="Categoría" error={state.fieldErrors['category_id']}>
            <select
              name="category_id"
              defaultValue={product?.categoryId ?? ''}
              className={inputClass}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Colecciones" hint="Son las pestañas de Total Look en la portada.">
            <div className="flex flex-wrap gap-1.5">
              {collections.map((c) => {
                const on = collectionIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setCollectionIds((ids) =>
                        on ? ids.filter((i) => i !== c.id) : [...ids, c.id],
                      )
                    }
                    className={`min-h-10 rounded-[var(--radius-pill)] px-3.5 text-sm transition
                      ${on ? 'bg-fg text-bg' : 'border border-muted/30 text-muted hover:text-fg'}`}
                  >
                    {c.name}
                  </button>
                );
              })}
              {collections.length === 0 ? (
                <Link href="/admin/colecciones" className="text-sm text-muted underline">
                  Crear la primera colección
                </Link>
              ) : null}
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Horma">
              <input name="fit" defaultValue={product?.fit ?? ''} className={inputClass} />
            </Field>
            <Field label="Material">
              <input name="material" defaultValue={product?.material ?? ''} className={inputClass} />
            </Field>
            <Field label="Cuidados">
              <input name="care" defaultValue={product?.care ?? ''} className={inputClass} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-muted/25 p-4">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm">Visible en la tienda</span>
                <span className="block text-xs text-muted">
                  Apagada, desaparece del sitio pero sigue aquí.
                </span>
              </span>
              <Switch checked={isActive} onChange={setIsActive} label="Visible en la tienda" />
            </label>
            <label className="flex items-center justify-between gap-4 border-t border-muted/20 pt-3">
              <span>
                <span className="block text-sm">Destacada</span>
                <span className="block text-xs text-muted">Entra al carrusel del hero.</span>
              </span>
              <Switch checked={isFeatured} onChange={setIsFeatured} label="Destacada en el hero" />
            </label>
          </div>

          <Status state={state} />

          <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-muted/20 bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
            <Button type="submit" variant="solid" disabled={pending} className="flex-1 sm:flex-none">
              {pending ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear prenda'}
            </Button>
            <Button type="button" variant="quiet" onClick={() => history.back()}>
              Volver
            </Button>
          </div>
        </form>

        {/* ------------------------------------------------------ colores -- */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl">Colores</h2>
            <p className="text-sm text-muted">
              Cada color lleva su recorte, su muestra y el color del escenario.
            </p>
          </div>
          {product ? (
            <ColorEditor
              productId={product.id}
              productSlug={product.slug}
              colors={product.colors}
              images={product.images}
              onPreviewColor={setPreviewColor}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-muted/30 px-4 py-6 text-center text-sm text-muted">
              Guarda la prenda y aquí podrás agregar colores e imágenes.
            </p>
          )}
        </section>

        {/* ------------------------------------------------------- tallas -- */}
        {product ? (
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl">Tallas</h2>
              <p className="text-sm text-muted">
                Toca una celda para cambiar disponibilidad o ponerle precio propio.
              </p>
            </div>
            <VariantMatrix
              productId={product.id}
              basePrice={base || product.basePrice}
              colors={product.colors}
              variants={product.variants}
            />
          </section>
        ) : null}

        {/* ------------------------------------------------------ eliminar -- */}
        {product ? (
          <section className="flex flex-wrap items-center gap-3 border-t border-muted/20 pt-6">
            {confirmDelete ? (
              <>
                <p className="text-sm">
                  Se eliminan también sus colores, tallas e imágenes. No se puede deshacer.
                </p>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => startTransition(() => void removeProduct(product.id))}
                >
                  Eliminar «{product.name}»
                </Button>
                <Button type="button" variant="quiet" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button type="button" variant="quiet" onClick={() => setConfirmDelete(true)}>
                Eliminar prenda
              </Button>
            )}
          </section>
        ) : null}
      </div>

      {/* ------------------------------------------------------- previa -- */}
      <aside className="lg:sticky lg:top-20">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted">Como lo verá el cliente</p>
        <LivePreview
          name={name}
          headline={headline}
          basePrice={base}
          compareAtPrice={compare}
          colors={product?.colors ?? []}
          variants={product?.variants ?? []}
          selectedColorId={previewColor}
          onSelectColor={setPreviewColor}
        />
      </aside>
    </div>
  );
}
