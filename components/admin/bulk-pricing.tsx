'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { previewBulkPrice, type PricePreviewRow } from '@/app/admin/(panel)/precios/actions';
import { applyBulkPricing } from '@/app/admin/(panel)/precios/actions';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { Status } from '@/components/ui/status';
import { IDLE } from '@/lib/actions';
import { formatCOP } from '@/lib/pricing';
import type { AdminProductRow } from '@/lib/queries/admin';
import type { CategoryRow } from '@/lib/supabase/database.types';
import type { BulkPriceInput } from '@/lib/validators/product';

const MODES: { value: BulkPriceInput['mode']; label: string; hint: string }[] = [
  { value: 'porcentaje', label: 'Por porcentaje', hint: '−10 baja un 10%. 15 sube un 15%.' },
  { value: 'monto', label: 'Por monto', hint: '−5000 baja $ 5.000 a cada prenda.' },
  { value: 'fijar', label: 'Fijar precio', hint: 'Deja todas las seleccionadas en el mismo precio.' },
];

const ROUNDINGS: { value: BulkPriceInput['round_to']; label: string }[] = [
  { value: 0, label: 'Sin redondear' },
  { value: 100, label: 'A los $ 100' },
  { value: 1000, label: 'A los $ 1.000' },
];

export function BulkPricing({
  products,
  categories,
}: {
  products: AdminProductRow[];
  categories: CategoryRow[];
}) {
  const [rule, setRule] = useState<BulkPriceInput>({
    scope: 'todas',
    category_id: null,
    product_ids: [],
    mode: 'porcentaje',
    value: -10,
    round_to: 100,
    keep_discount: true,
  });

  const [rows, setRows] = useState<PricePreviewRow[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [loading, startPreview] = useTransition();
  const [state, action, applying] = useActionState(applyBulkPricing, IDLE);

  // La vista previa se recalcula sola: nadie debería tener que pedirla.
  useEffect(() => {
    const id = setTimeout(() => {
      startPreview(async () => {
        const result = await previewBulkPrice(rule);
        setRows(result.rows);
        setProblem(result.error);
      });
    }, 250);
    return () => clearTimeout(id);
  }, [rule]);

  // Tras aplicar, los precios "antes" ya son otros: se vuelve a pedir la previa.
  useEffect(() => {
    if (!state.ok) return;
    startPreview(async () => {
      const result = await previewBulkPrice(rule);
      setRows(result.rows);
      setProblem(result.error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const changing = rows.filter((r) => r.after !== r.before || r.compareAfter !== r.compareBefore);
  const patch = (next: Partial<BulkPriceInput>) => setRule((r) => ({ ...r, ...next }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-muted/25 p-4">
        <Field label="A qué prendas">
          <div className="flex flex-wrap gap-1.5">
            {(['todas', 'categoria', 'seleccion'] as const).map((scope) => (
              <Pill
                key={scope}
                on={rule.scope === scope}
                onClick={() => patch({ scope })}
              >
                {scope === 'todas' ? 'Todas' : scope === 'categoria' ? 'Una categoría' : 'Las que marque'}
              </Pill>
            ))}
          </div>
        </Field>

        {rule.scope === 'categoria' ? (
          <Field label="Categoría">
            <select
              className={inputClass}
              value={rule.category_id ?? ''}
              onChange={(e) => patch({ category_id: e.target.value || null })}
            >
              <option value="">Elige una</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {rule.scope === 'seleccion' ? (
          <Field label={`Prendas (${rule.product_ids.length})`}>
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-xl border border-muted/20 p-2">
              {products.map((p) => {
                const on = rule.product_ids.includes(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex min-h-10 items-center gap-2.5 px-1 text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          patch({
                            product_ids: on
                              ? rule.product_ids.filter((i) => i !== p.id)
                              : [...rule.product_ids, p.id],
                          })
                        }
                        className="size-4 accent-[var(--color-fg)]"
                      />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">
                        {p.price.finalLabel}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Field>
        ) : null}

        <Field label="Cómo" hint={MODES.find((m) => m.value === rule.mode)?.hint}>
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((m) => (
              <Pill key={m.value} on={rule.mode === m.value} onClick={() => patch({ mode: m.value })}>
                {m.label}
              </Pill>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={rule.mode === 'porcentaje' ? 'Porcentaje' : 'Valor en pesos'}>
            <input
              inputMode="numeric"
              className={`${inputClass} tabular-nums`}
              value={String(rule.value)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d-]/g, '');
                patch({ value: raw === '' || raw === '-' ? 0 : Number(raw) });
              }}
            />
          </Field>
          <Field label="Redondeo">
            <select
              className={inputClass}
              value={String(rule.round_to)}
              onChange={(e) =>
                patch({ round_to: Number(e.target.value) as BulkPriceInput['round_to'] })
              }
            >
              {ROUNDINGS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={rule.keep_discount}
            onChange={(e) => patch({ keep_discount: e.target.checked })}
            className="mt-0.5 size-4 accent-[var(--color-fg)]"
          />
          <span>
            Mover también el precio tachado
            <span className="block text-xs text-muted">
              Conserva el mismo porcentaje de descuento en las prendas que lo tienen.
            </span>
          </span>
        </label>
      </div>

      {/* ------------------------------------------------------- previa -- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">Vista previa</h2>
          <p className="text-sm text-muted" aria-live="polite">
            {loading
              ? 'Calculando…'
              : `${changing.length} de ${rows.length} ${rows.length === 1 ? 'prenda cambia' : 'prendas cambian'}`}
          </p>
        </div>

        {problem ? (
          <p role="alert" className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent">
            {problem}
          </p>
        ) : null}

        {rows.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {rows.map((row) => {
              const moves = row.after !== row.before;
              return (
                <li
                  key={row.id}
                  className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border px-3.5 py-2.5
                              ${moves ? 'border-muted/30' : 'border-muted/15 opacity-50'}`}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
                  <span className="text-sm tabular-nums text-muted line-through">
                    {formatCOP(row.before)}
                  </span>
                  <span aria-hidden className="text-muted">→</span>
                  <span className="text-sm font-medium tabular-nums">{formatCOP(row.after)}</span>
                  {row.compareAfter !== row.compareBefore ? (
                    <span className="w-full text-xs text-muted">
                      tachado {row.compareBefore === null ? '—' : formatCOP(row.compareBefore)} →{' '}
                      {row.compareAfter === null ? '—' : formatCOP(row.compareAfter)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        <form action={action} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="rule" value={JSON.stringify(rule)} />
          <Button
            type="submit"
            variant="solid"
            disabled={applying || loading || changing.length === 0}
          >
            {applying
              ? 'Aplicando…'
              : changing.length === 0
                ? 'Nada que aplicar'
                : `Aplicar a ${changing.length} ${changing.length === 1 ? 'prenda' : 'prendas'}`}
          </Button>
          <Status state={state} />
        </form>

        <p className="text-xs text-muted">
          Cada cambio queda en el historial con tu nombre, la hora y el precio anterior.
        </p>
      </section>
    </div>
  );
}

function Pill({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-10 rounded-[var(--radius-pill)] px-3.5 text-sm transition
                  ${on ? 'bg-fg text-bg' : 'border border-muted/30 text-muted hover:text-fg'}`}
    >
      {children}
    </button>
  );
}
