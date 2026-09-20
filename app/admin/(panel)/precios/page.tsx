import type { Metadata } from 'next';
import { BulkPricing } from '@/components/admin/bulk-pricing';
import { EmptyState } from '@/components/ui/empty-state';
import { getTaxonomy, listProducts } from '@/lib/queries/admin';

export const metadata: Metadata = { title: 'Precios', robots: { index: false, follow: false } };

export default async function PreciosPage() {
  const [products, { categories }] = await Promise.all([listProducts(), getTaxonomy()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="text-3xl">Cambiar precios</h1>
        <p className="text-sm text-muted">
          Nada se guarda hasta que confirmes lo que ves en la vista previa.
        </p>
      </header>

      {products.length === 0 ? (
        <EmptyState title="No hay prendas" detail="Crea alguna antes de cambiar precios." />
      ) : (
        <BulkPricing products={products} categories={categories} />
      )}
    </div>
  );
}
