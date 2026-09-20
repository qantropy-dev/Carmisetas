import type { Metadata } from 'next';
import { ProductForm } from '@/components/admin/product-form';
import { getTaxonomy } from '@/lib/queries/admin';

export const metadata: Metadata = { title: 'Nueva prenda', robots: { index: false, follow: false } };

export default async function NuevaPrendaPage() {
  const { categories, collections } = await getTaxonomy();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-3xl">Nueva prenda</h1>
      <ProductForm product={null} categories={categories} collections={collections} />
    </div>
  );
}
