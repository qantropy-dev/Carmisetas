import type { Metadata } from 'next';
import { getCatalog } from '@/lib/queries/products';

export const metadata: Metadata = { title: 'Prendas', robots: { index: false, follow: false } };

/* PROVISIONAL (fase 1): prueba de que la sesion de admin lee el catalogo.
   La fase 2 lo reemplaza por el listado con filtros, switches y drag & drop. */
export default async function PrendasPage() {
  const products = await getCatalog();

  return (
    <>
      <h1 className="text-3xl">Prendas</h1>
      <p className="mt-1 text-sm text-muted">{products.length} en el catálogo</p>

      <ul className="mt-6 divide-y divide-muted/20">
        {products.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-3">
            <span
              aria-hidden
              className="size-6 shrink-0 rounded-full border border-muted/30"
              style={{ backgroundColor: p.swatchHex ?? 'transparent' }}
            />
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="shrink-0 text-sm tabular-nums text-muted">{p.price.finalLabel}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
