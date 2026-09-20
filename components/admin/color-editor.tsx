'use client';

import Image from 'next/image';
import { useActionState, useState, useTransition } from 'react';
import {
  addImage,
  applyColorSuggestion,
  removeColor,
  removeImage,
  saveColor,
  setCutout,
  updateImageMeta,
} from '@/app/admin/(panel)/prendas/actions';
import { ImageUploader, type UploadResult } from '@/components/admin/image-uploader';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { Status } from '@/components/ui/status';
import { IDLE, type ActionState } from '@/lib/actions';
import { ambientTokens, suggestAmbient } from '@/lib/color';
import { removeFromStorage } from '@/lib/image/upload';
import {
  PRODUCT_VIEWS,
  type ProductColorRow,
  type ProductImageRow,
  type ProductView,
} from '@/lib/supabase/database.types';

export function ColorEditor({
  productId,
  productSlug,
  colors,
  images,
  onPreviewColor,
}: {
  productId: string;
  productSlug: string;
  colors: ProductColorRow[];
  images: ProductImageRow[];
  onPreviewColor?: (colorId: string) => void;
}) {
  const [editing, setEditing] = useState<ProductColorRow | 'nuevo' | null>(null);
  const [uploadingFor, setUploadingFor] = useState<ProductColorRow | null>(null);
  const [notice, setNotice] = useState<ActionState>(IDLE);
  const [, startTransition] = useTransition();

  function handleUploaded(color: ProductColorRow, result: UploadResult) {
    startTransition(async () => {
      const sort = images.filter((i) => i.color_id === color.id).length;
      const added = await addImage({
        product_id: productId,
        color_id: color.id,
        url: result.url,
        view: result.view,
        alt: result.alt,
        sort_order: sort,
      });
      if (!added.ok) {
        setNotice(added);
        return;
      }
      if (result.setAsCutout) await setCutout(color.id, productId, result.url);
      if (result.applySuggestion && result.suggestion) {
        await applyColorSuggestion(
          color.id,
          productId,
          result.suggestion.swatch,
          result.suggestion.ambient,
        );
      }
      setNotice(added);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {colors.map((color) => (
        <ColorCard
          key={color.id}
          color={color}
          images={images.filter((i) => i.color_id === color.id)}
          productId={productId}
          onEdit={() => setEditing(color)}
          onAddImage={() => setUploadingFor(color)}
          onPreview={() => onPreviewColor?.(color.id)}
          onNotice={setNotice}
        />
      ))}

      <Button type="button" onClick={() => setEditing('nuevo')} className="self-start">
        + Agregar color
      </Button>

      <Status state={notice} />

      {editing ? (
        <ColorSheet
          productId={productId}
          color={editing === 'nuevo' ? null : editing}
          sortOrder={colors.length}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {uploadingFor ? (
        <ImageUploader
          open
          onClose={() => setUploadingFor(null)}
          productSlug={productSlug}
          colorName={uploadingFor.color_name}
          ambientHex={uploadingFor.ambient_hex}
          canSetCutout
          onUploaded={(result) => handleUploaded(uploadingFor, result)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- tarjeta -- */

function ColorCard({
  color,
  images,
  productId,
  onEdit,
  onAddImage,
  onPreview,
  onNotice,
}: {
  color: ProductColorRow;
  images: ProductImageRow[];
  productId: string;
  onEdit: () => void;
  onAddImage: () => void;
  onPreview: () => void;
  onNotice: (state: ActionState) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function drop(image: ProductImageRow) {
    startTransition(async () => {
      const result = await removeImage(image.id, productId);
      onNotice(result);
      if (result.ok) await removeFromStorage(image.url);
    });
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-muted/25">
      <div
        className="stage flex items-center gap-3 px-3 py-3"
        style={ambientTokens(color.ambient_hex) as React.CSSProperties}
      >
        <button
          type="button"
          onClick={onPreview}
          className="grid size-16 shrink-0 place-items-center rounded-xl"
          aria-label={`Previsualizar ${color.color_name}`}
        >
          {color.cutout_url ? (
            <Image
              src={color.cutout_url}
              alt=""
              width={128}
              height={164}
              className="size-14 object-contain"
            />
          ) : (
            <span className="text-[10px] uppercase tracking-wider opacity-60">Sin recorte</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{color.color_name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--ambient-muted)]">
            <span
              aria-hidden
              className="size-3 rounded-full border border-[var(--ambient-hairline)]"
              style={{ backgroundColor: color.swatch_hex }}
            />
            {color.swatch_hex} · escenario {color.ambient_hex}
          </p>
        </div>

        <Button
          type="button"
          onClick={onEdit}
          className="border-[var(--ambient-hairline)] hover:border-[var(--ambient-fg)]"
        >
          Editar
        </Button>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {images.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {images.map((image) => (
              <ImageChip
                key={image.id}
                image={image}
                productId={productId}
                isCutout={color.cutout_url === image.url}
                onMakeCutout={() =>
                  startTransition(async () => {
                    onNotice(await setCutout(color.id, productId, image.url));
                  })
                }
                onDelete={() => drop(image)}
                onNotice={onNotice}
              />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Sin imágenes todavía.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={onAddImage} disabled={pending}>
            + Imagen
          </Button>
          {confirming ? (
            <>
              <Button
                type="button"
                variant="danger"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    onNotice(await removeColor(color.id, productId));
                  })
                }
              >
                Sí, eliminar «{color.color_name}»
              </Button>
              <Button type="button" variant="quiet" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button type="button" variant="quiet" onClick={() => setConfirming(true)}>
              Eliminar color
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function ImageChip({
  image,
  productId,
  isCutout,
  onMakeCutout,
  onDelete,
  onNotice,
}: {
  image: ProductImageRow;
  productId: string;
  isCutout: boolean;
  onMakeCutout: () => void;
  onDelete: () => void;
  onNotice: (state: ActionState) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ProductView>(image.view);
  const [alt, setAlt] = useState(image.alt ?? '');
  const [pending, startTransition] = useTransition();

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative grid size-16 place-items-center overflow-hidden rounded-xl
                   border border-muted/25 bg-fg/5"
      >
        <Image src={image.url} alt={image.alt ?? ''} width={128} height={164} className="size-14 object-contain" />
        <span className="absolute inset-x-0 bottom-0 bg-fg/70 py-px text-[9px] uppercase tracking-wider text-bg">
          {image.view}
        </span>
        {isCutout ? (
          <span
            aria-label="Recorte del hero"
            title="Recorte del hero"
            className="absolute right-1 top-1 size-2 rounded-full bg-accent"
          />
        ) : null}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Imagen">
        <div className="flex flex-col gap-4">
          <div className="grid place-items-center rounded-2xl bg-fg/5 py-6">
            <Image src={image.url} alt={image.alt ?? ''} width={320} height={410} className="max-h-56 w-auto object-contain" />
          </div>

          <Field label="Vista">
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`min-h-10 rounded-[var(--radius-pill)] px-3.5 text-sm capitalize transition
                    ${view === v ? 'bg-fg text-bg' : 'border border-muted/30 text-muted hover:text-fg'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Texto alternativo">
            <input className={inputClass} value={alt} onChange={(e) => setAlt(e.target.value)} />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="solid"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  onNotice(await updateImageMeta(image.id, productId, { view, alt }));
                  setOpen(false);
                })
              }
            >
              Guardar
            </Button>
            {!isCutout ? (
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  onMakeCutout();
                  setOpen(false);
                }}
              >
                Usar como recorte del hero
              </Button>
            ) : null}
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Sheet>
    </li>
  );
}

/* --------------------------------------------------------------- sheet -- */

function ColorSheet({
  productId,
  color,
  sortOrder,
  onClose,
}: {
  productId: string;
  color: ProductColorRow | null;
  sortOrder: number;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveColor, IDLE);
  const [swatch, setSwatch] = useState(color?.swatch_hex ?? '#DDD6CC');
  const [ambient, setAmbient] = useState(color?.ambient_hex ?? suggestAmbient('#DDD6CC'));
  const [linked, setLinked] = useState(color === null);

  function changeSwatch(next: string) {
    setSwatch(next.toUpperCase());
    // Mientras el admin no toque el escenario a mano, lo seguimos proponiendo.
    if (linked && /^#[0-9a-fA-F]{6}$/.test(next)) setAmbient(suggestAmbient(next));
  }

  return (
    <Sheet open onClose={onClose} title={color ? 'Editar color' : 'Nuevo color'}>
      <form action={action} className="flex flex-col gap-4">
        {color ? <input type="hidden" name="id" value={color.id} /> : null}
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="sort_order" value={sortOrder} />
        <input type="hidden" name="cutout_url" value={color?.cutout_url ?? ''} />
        <input type="hidden" name="swatch_hex" value={swatch} />
        <input type="hidden" name="ambient_hex" value={ambient} />

        <Field label="Nombre del color" error={state.fieldErrors['color_name']}>
          <input
            name="color_name"
            defaultValue={color?.color_name ?? ''}
            required
            className={inputClass}
            placeholder="Hueso"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Color de la prenda" error={state.fieldErrors['swatch_hex']}>
            <HexInput value={swatch} onChange={changeSwatch} />
          </Field>
          <Field
            label="Color del escenario"
            error={state.fieldErrors['ambient_hex']}
            hint={linked ? 'Se propone solo a partir de la prenda.' : undefined}
          >
            <HexInput
              value={ambient}
              onChange={(v) => {
                setLinked(false);
                setAmbient(v.toUpperCase());
              }}
            />
          </Field>
        </div>

        <div
          className="stage grid place-items-center gap-1 rounded-2xl px-4 py-8 text-center"
          style={ambientTokens(ambient) as React.CSSProperties}
        >
          <span
            aria-hidden
            className="size-12 rounded-full border border-[var(--ambient-hairline)]"
            style={{ backgroundColor: swatch }}
          />
          <span className="mt-2 text-sm">Así se ve el texto sobre este escenario</span>
          <span className="text-xs text-[var(--ambient-muted)]">Y así el texto secundario</span>
        </div>

        <Status state={state} />

        <div className="flex gap-2">
          <Button type="submit" variant="solid" disabled={pending}>
            {pending ? 'Guardando…' : color ? 'Guardar' : 'Crear color y sus 5 tallas'}
          </Button>
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

function HexInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <span className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Selector de color"
        className="size-11 shrink-0 cursor-pointer rounded-xl border border-muted/30 bg-transparent p-1"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={`${inputClass} font-mono uppercase`}
      />
    </span>
  );
}
