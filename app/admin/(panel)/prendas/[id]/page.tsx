import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getProductForEdit, getTaxonomy } from '@/lib/queries/admin';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditarPrendaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, { categories, collections }] = await Promise.all([
    getProductForEdit(id),
    getTaxonomy(),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-2 text-sm text-muted">
        <Link href="/admin/prendas" className="underline-offset-4 hover:underline">
          Prendas
        </Link>
        <span aria-hidden> / </span>
        <span>{product.name}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">{product.name}</h1>
        <Link
          href={`/prenda/${product.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-muted underline-offset-4 hover:underline"
        >
          Ver en la tienda ↗
        </Link>
      </div>

      <ProductForm product={product} categories={categories} collections={collections} />
    </div>
  );
}
