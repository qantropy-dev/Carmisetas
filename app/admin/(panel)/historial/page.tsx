import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCOP } from '@/lib/pricing';
import { getAuditLog } from '@/lib/queries/admin';

export const metadata: Metadata = { title: 'Historial', robots: { index: false, follow: false } };

const ENTITY: Record<string, string> = {
  products: 'Prenda',
  product_variants: 'Talla',
  product_colors: 'Color',
};

const ACTION: Record<string, string> = {
  insert: 'creó',
  update: 'cambió',
  delete: 'eliminó',
};

const FIELD: Record<string, string> = {
  base_price: 'precio',
  compare_at_price: 'precio tachado',
  price_override: 'precio de la talla',
  stock_status: 'disponibilidad',
  is_active: 'visibilidad',
  is_featured: 'destacada',
  name: 'nombre',
  slug: 'enlace',
  headline: 'titular',
  ambient_hex: 'color del escenario',
  swatch_hex: 'color de la prenda',
  cutout_url: 'recorte',
  sort_order: 'orden',
};

const MONEY_FIELDS = new Set(['base_price', 'compare_at_price', 'price_override']);

function show(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  if (MONEY_FIELDS.has(field) && typeof value === 'number') return formatCOP(value);
  const text = String(value);
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

const when = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function HistorialPage() {
  const entries = await getAuditLog();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="text-3xl">Historial</h1>
        <p className="text-sm text-muted">Quién cambió qué y cuándo. Últimos 120 movimientos.</p>
      </header>

      {entries.length === 0 ? (
        <EmptyState title="Todavía no hay cambios" detail="Aquí aparecerá cada edición del catálogo." />
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => {
            const fields = Object.entries(entry.diff ?? {});
            return (
              <li key={entry.id} className="rounded-2xl border border-muted/20 p-3.5">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-medium">{entry.adminName ?? 'Alguien'}</span>
                  <span className="text-muted">
                    {ACTION[entry.action] ?? entry.action}{' '}
                    {(ENTITY[entry.entity] ?? entry.entity).toLowerCase()}
                  </span>
                  <time
                    dateTime={entry.created_at}
                    className="ml-auto shrink-0 text-xs text-muted tabular-nums"
                  >
                    {when.format(new Date(entry.created_at))}
                  </time>
                </p>

                {fields.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {fields.slice(0, 6).map(([field, change]) => (
                      <li key={field} className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-xs uppercase tracking-[0.1em] text-muted">
                          {FIELD[field] ?? field}
                        </span>
                        <span className="tabular-nums line-through opacity-55">
                          {show(field, change.old)}
                        </span>
                        <span aria-hidden className="text-muted">→</span>
                        <span className="tabular-nums">{show(field, change.new)}</span>
                      </li>
                    ))}
                    {fields.length > 6 ? (
                      <li className="text-xs text-muted">y {fields.length - 6} campos más</li>
                    ) : null}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
