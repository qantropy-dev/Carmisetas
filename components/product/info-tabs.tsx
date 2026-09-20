'use client';

import { useState } from 'react';
import { GARMENT_SIZES } from '@/lib/supabase/database.types';

type TabId = 'detalles' | 'tallas' | 'cuidados';

/** Guía de tallas en centímetros: lo que de verdad resuelve la duda. */
const SIZE_CHART: Record<string, { pecho: string; largo: string }> = {
  S: { pecho: '50', largo: '68' },
  M: { pecho: '53', largo: '70' },
  L: { pecho: '56', largo: '72' },
  XL: { pecho: '59', largo: '74' },
  XXL: { pecho: '62', largo: '76' },
};

export function InfoTabs({
  description,
  fit,
  material,
  care,
}: {
  description: string | null;
  fit: string | null;
  material: string | null;
  care: string | null;
}) {
  const [tab, setTab] = useState<TabId>('detalles');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'detalles', label: 'Detalles' },
    { id: 'tallas', label: 'Tallas' },
    { id: 'cuidados', label: 'Cuidados' },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div role="tablist" aria-label="Información de la prenda" className="flex gap-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={`min-h-11 rounded-[var(--radius-pill)] px-4 text-sm transition-colors
              ${tab === item.id
                ? 'bg-[var(--ambient-fg)] text-[var(--ambient)]'
                : 'text-[var(--ambient-muted)] hover:text-[var(--ambient-fg)]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="text-sm leading-relaxed"
      >
        {tab === 'detalles' ? (
          <div className="flex flex-col gap-3">
            {description ? <p>{description}</p> : null}
            {fit || material ? (
              <dl className="flex flex-col gap-2 border-t pt-3 border-[var(--ambient-hairline)]">
                {fit ? <Row label="Horma" value={fit} /> : null}
                {material ? <Row label="Material" value={material} /> : null}
              </dl>
            ) : null}
          </div>
        ) : null}

        {tab === 'tallas' ? (
          <div className="flex flex-col gap-3">
            <table className="w-full border-separate border-spacing-y-1 text-left">
              <caption className="sr-only">Medidas de la prenda en centímetros</caption>
              <thead className="text-xs uppercase tracking-[0.12em] text-[var(--ambient-muted)]">
                <tr>
                  <th scope="col" className="font-normal">Talla</th>
                  <th scope="col" className="font-normal">Pecho</th>
                  <th scope="col" className="font-normal">Largo</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {GARMENT_SIZES.map((size) => (
                  <tr key={size}>
                    <th scope="row" className="font-normal">{size}</th>
                    <td>{SIZE_CHART[size]?.pecho} cm</td>
                    <td>{SIZE_CHART[size]?.largo} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-[var(--ambient-muted)]">
              Medidas de la prenda extendida, no del cuerpo. Entre dos tallas, la mayor cae más suelta.
            </p>
          </div>
        ) : null}

        {tab === 'cuidados' ? (
          <p>{care ?? 'Lavar a máquina en frío del revés. Secar a la sombra.'}</p>
        ) : null}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-xs uppercase tracking-[0.12em] text-[var(--ambient-muted)]">
        {label}
      </dt>
      <dd className="min-w-0 flex-1">{value}</dd>
    </div>
  );
}
