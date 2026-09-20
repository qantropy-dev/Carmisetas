import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ProductList } from '@/components/admin/product-list';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonRows } from '@/components/ui/skeleton';
import { listProducts, getTaxonomy } from '@/lib/queries/admin';

export const metadata: Metadata = { title: 'Prendas', robots: { index: false, follow: false } };

export default function PrendasPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Prendas</h1>
          <p className="text-sm text-muted">Orden, visibilidad y precios.</p>
        </div>
        <Link
          href="/admin/prendas/nueva"
          className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-fg px-4
                     text-sm font-medium text-bg"
        >
          + Nueva prenda
        </Link>
      </header>

      <Suspense fallback={<SkeletonRows rows={6} />}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  const [products, { categories }] = await Promise.all([listProducts(), getTaxonomy()]);

  if (products.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay prendas"
        detail="Crea la primera, o corre la semilla para empezar con seis de ejemplo."
      >
        <Link href="/admin/prendas/nueva" className="mt-2 text-sm underline underline-offset-4">
          Crear la primera
        </Link>
      </EmptyState>
    );
  }

  return <ProductList products={products} categories={categories} />;
}
