import type { Metadata } from 'next';
import Link from 'next/link';
import { BentoGrid } from '@/components/bento-grid/bento-grid';
import { AmbientBackdrop } from '@/components/hero-ambient/ambient-backdrop';
import { Rack } from '@/components/rack-slider/rack';
import { EmptyState } from '@/components/ui/empty-state';
import { ViewToggle, type CatalogView } from '@/components/ui/view-toggle';
import { ambientTokens, tokensToCss } from '@/lib/color';
import { hasSupabaseConfig } from '@/lib/env';
import { getCatalog, getCategories, getGarments } from '@/lib/queries/products';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Todas las camisetas y suéteres, colgadas del perchero o en grilla.',
};

export const revalidate = 300;

/** Escenario neutro de la vista lista: la grilla ya trae el color en cada tarjeta. */
const LIST_AMBIENT = ambientTokens('#E9E5DE');

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { vista } = await searchParams;
  const view: CatalogView = vista === 'lista' ? 'lista' : 'perchero';

  if (!hasSupabaseConfig()) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-5">
        <EmptyState
          title="Falta conectar Supabase"
          detail="Copia .env.example a .env.local con las credenciales del proyecto."
        />
      </main>
    );
  }

  const [categories, garments, cards] = await Promise.all([
    getCategories(),
    view === 'perchero' ? getGarments() : Promise.resolve([]),
    view === 'lista' ? getCatalog() : Promise.resolve([]),
  ]);

  const empty = view === 'perchero' ? garments.length === 0 : cards.length === 0;
  const tokens = view === 'perchero' && garments[0] ? garments[0].ambient : LIST_AMBIENT;

  return (
    <main>
      {/* El escenario del primer render, ya resuelto en el servidor. */}
      <style dangerouslySetInnerHTML={{ __html: tokensToCss(tokens) }} />

      <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-1 sm:px-8">
        <h1 className="text-sm uppercase tracking-[0.16em] text-[var(--ambient-muted)]">
          Catálogo
        </h1>
        <ViewToggle current={view} />
      </div>

      {empty ? (
        <div className="grid min-h-[60dvh] place-items-center px-5">
          <AmbientBackdrop tokens={tokens} />
          <EmptyState
            title="Todavía no hay prendas"
            detail="Corre la semilla o crea la primera en el panel."
          >
            <Link href="/" className="mt-2 text-sm underline underline-offset-4">
              Volver al inicio
            </Link>
          </EmptyState>
        </div>
      ) : view === 'perchero' ? (
        <Rack garments={garments} />
      ) : (
        <div className="px-5 pb-16 sm:px-8">
          <AmbientBackdrop tokens={LIST_AMBIENT} />
          <BentoGrid products={cards} categories={categories} />
        </div>
      )}
    </main>
  );
}
