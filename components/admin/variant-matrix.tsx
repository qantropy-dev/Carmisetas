'use client';

import { useActionState, useMemo, useState } from 'react';
import { saveVariants } from '@/app/admin/(panel)/prendas/actions';
import { Button } from '@/components/ui/button';
import { Status } from '@/components/ui/status';
import { IDLE } from '@/lib/actions';
import { formatCOP } from '@/lib/pricing';
import {
  GARMENT_SIZES,
  STOCK_STATUSES,
  type GarmentSize,
  type ProductColorRow,
  type ProductVariantRow,
  type StockStatus,
} from '@/lib/supabase/database.types';

type Draft = { price_override: number | null; stock_status: StockStatus; is_active: boolean; sku: string };

const STOCK_LABEL: Record<StockStatus, string> = {
  disponible: 'Disponible',
  pocas: 'Pocas',
  agotado: 'Agotado',
};

/** Un punto dice el estado sin leer: lleno, medio, vacío. */
const STOCK_DOT: Record<StockStatus, string> = {
  disponible: 'bg-fg',
  pocas: 'bg-accent',
  agotado: 'bg-transparent border border-muted/50',
};

function keyOf(colorId: string, size: GarmentSize) {
  return `${colorId}:${size}`;
}

/**
 * Matriz color × talla.
 *
 * La celda muestra el estado de un vistazo; al tocarla se abre el editor de esa
 * talla debajo. Así la matriz cabe en un teléfono sin convertirse en una tabla
 * de campos diminutos.
 */
export function VariantMatrix({
  productId,
  basePrice,
  colors,
  variants,
}: {
  productId: string;
  basePrice: number;
  colors: ProductColorRow[];
  variants: ProductVariantRow[];
}) {
  const byKey = useMemo(() => {
    const map = new Map<string, ProductVariantRow>();
    for (const v of variants) map.set(keyOf(v.color_id, v.size), v);
    return map;
  }, [variants]);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [state, action, pending] = useActionState(saveVariants, IDLE);

  function current(colorId: string, size: GarmentSize): Draft | null {
    const variant = byKey.get(keyOf(colorId, size));
    if (!variant) return null;
    return (
      drafts[keyOf(colorId, size)] ?? {
        price_override: variant.price_override,
        stock_status: variant.stock_status,
        is_active: variant.is_active,
        sku: variant.sku ?? '',
      }
    );
  }

  function edit(colorId: string, size: GarmentSize, patch: Partial<Draft>) {
    const key = keyOf(colorId, size);
    const base = current(colorId, size);
    if (!base) return;
    setDrafts((d) => ({ ...d, [key]: { ...base, ...patch } }));
  }

  /** Solo se envía lo que de verdad cambió. */
  const changed = Object.entries(drafts).filter(([key, draft]) => {
    const variant = byKey.get(key);
    if (!variant) return false;
    return (
      draft.price_override !== variant.price_override ||
      draft.stock_status !== variant.stock_status ||
      draft.is_active !== variant.is_active ||
      draft.sku !== (variant.sku ?? '')
    );
  });

  const payload = JSON.stringify(
    changed.map(([key, draft]) => {
      const variant = byKey.get(key) as ProductVariantRow;
      return {
        id: variant.id,
        product_id: productId,
        color_id: variant.color_id,
        size: variant.size,
        sku: draft.sku.trim() === '' ? null : draft.sku.trim(),
        price_override: draft.price_override,
        stock_status: draft.stock_status,
        is_active: draft.is_active,
      };
    }),
  );

  if (colors.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-muted/30 px-4 py-6 text-center text-sm text-muted">
        Agrega un color y aparecerán sus cinco tallas.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="variants" value={payload} />

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[420px] border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.12em] text-muted">
              <th scope="col" className="w-28 pb-1 text-left font-normal">Color</th>
              {GARMENT_SIZES.map((size) => (
                <th key={size} scope="col" className="pb-1 text-center font-normal">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => (
              <tr key={color.id}>
                <th scope="row" className="pr-2 text-left font-normal">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-4 shrink-0 rounded-full border border-muted/30"
                      style={{ backgroundColor: color.swatch_hex }}
                    />
                    <span className="truncate">{color.color_name}</span>
                  </span>
                </th>
                {GARMENT_SIZES.map((size) => {
                  const draft = current(color.id, size);
                  const key = keyOf(color.id, size);
                  if (!draft) {
                    return (
                      <td key={size} className="text-center text-muted/50">
                        —
                      </td>
                    );
                  }
                  const dirty = changed.some(([k]) => k === key);
                  return (
                    <td key={size} className="text-center">
                      <button
                        type="button"
                        onClick={() => setOpenCell(openCell === key ? null : key)}
                        aria-expanded={openCell === key}
                        aria-label={`${color.color_name} talla ${size}: ${STOCK_LABEL[draft.stock_status]}`}
                        className={`mx-auto grid size-11 place-items-center rounded-xl border transition
                          ${openCell === key ? 'border-fg' : 'border-muted/25'}
                          ${draft.is_active ? '' : 'opacity-40'}
                          ${dirty ? 'ring-1 ring-accent/50' : ''}`}
                      >
                        <span className={`size-2.5 rounded-full ${STOCK_DOT[draft.stock_status]}`} />
                        {draft.price_override !== null ? (
                          <span className="mt-0.5 text-[9px] leading-none text-muted">$</span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openCell ? <CellEditor /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="solid" disabled={changed.length === 0 || pending}>
          {pending
            ? 'Guardando…'
            : changed.length === 0
              ? 'Sin cambios'
              : `Guardar ${changed.length} ${changed.length === 1 ? 'talla' : 'tallas'}`}
        </Button>
        {changed.length > 0 ? (
          <Button type="button" variant="quiet" onClick={() => setDrafts({})}>
            Descartar
          </Button>
        ) : null}
        <Status state={state} />
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {STOCK_STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${STOCK_DOT[s]}`} />
            {STOCK_LABEL[s]}
          </span>
        ))}
        <span>· El signo $ marca una talla con precio propio.</span>
      </p>
    </form>
  );

  function CellEditor() {
    const key = openCell as string;
    const variant = byKey.get(key);
    const color = colors.find((c) => c.id === variant?.color_id);
    if (!variant || !color) return null;
    const draft = current(color.id, variant.size) as Draft;
    const finalPrice = draft.price_override ?? basePrice;

    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-muted/25 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">
            {color.color_name} · talla {variant.size}
          </p>
          <button
            type="button"
            onClick={() => setOpenCell(null)}
            className="text-sm text-muted hover:text-fg"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STOCK_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => edit(color.id, variant.size, { stock_status: s })}
              aria-pressed={draft.stock_status === s}
              className={`min-h-10 rounded-[var(--radius-pill)] px-3.5 text-sm transition
                ${draft.stock_status === s ? 'bg-fg text-bg' : 'border border-muted/30 text-muted hover:text-fg'}`}
            >
              {STOCK_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.13em] text-muted">
              Precio propio
            </span>
            <input
              inputMode="numeric"
              value={draft.price_override ?? ''}
              placeholder={`${basePrice} (precio base)`}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                edit(color.id, variant.size, { price_override: raw === '' ? null : Number(raw) });
              }}
              className="min-h-11 rounded-xl border border-muted/30 bg-transparent px-3.5 text-base
                         tabular-nums outline-none focus-visible:border-fg sm:text-sm"
            />
            <span className="text-xs text-muted">Se mostrará {formatCOP(finalPrice)}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-[0.13em] text-muted">SKU</span>
            <input
              value={draft.sku}
              onChange={(e) => edit(color.id, variant.size, { sku: e.target.value })}
              className="min-h-11 rounded-xl border border-muted/30 bg-transparent px-3.5 text-base
                         outline-none focus-visible:border-fg sm:text-sm"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => edit(color.id, variant.size, { is_active: e.target.checked })}
            className="size-4 accent-[var(--color-fg)]"
          />
          Ofrecer esta talla en la tienda
        </label>
      </div>
    );
  }
}
