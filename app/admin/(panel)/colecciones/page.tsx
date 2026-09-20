import type { Metadata } from 'next';
import { TaxonomyEditor } from '@/components/admin/taxonomy-editor';
import { getTaxonomy } from '@/lib/queries/admin';

export const metadata: Metadata = { title: 'Colecciones', robots: { index: false, follow: false } };

export default async function ColeccionesPage() {
  const { categories, collections } = await getTaxonomy();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <header>
        <h1 className="text-3xl">Categorías y colecciones</h1>
        <p className="text-sm text-muted">El orden de aquí es el orden que se ve en la tienda.</p>
      </header>

      <TaxonomyEditor
        entity="categories"
        title="Categorías"
        hint="Los chips redondos del catálogo. Camisetas, suéteres…"
        items={categories}
      />

      <TaxonomyEditor
        entity="collections"
        title="Colecciones"
        hint="Las pestañas de Total Look en la portada."
        items={collections}
      />
    </div>
  );
}
