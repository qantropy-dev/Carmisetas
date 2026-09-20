import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroAmbient } from '@/components/hero-ambient/hero-ambient';
import { TotalLook } from '@/components/total-look/total-look';
import { EmptyState } from '@/components/ui/empty-state';
import { hasSupabaseConfig } from '@/lib/env';
import { tokensToCss } from '@/lib/color';
import { getCollectionLooks, getHeroGarments } from '@/lib/queries/products';

export const metadata: Metadata = {
  description:
    'Camisetas y suéteres. Cada prenda flota sobre su propio color: el sitio se recorre como un showroom.',
};

export const revalidate = 300;

export default async function HomePage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-5">
        <EmptyState
          title="Falta conectar Supabase"
          detail="Copia .env.example a .env.local con las credenciales del proyecto. Las migraciones y la semilla ya están listas."
        />
      </main>
    );
  }

  const [garments, looks] = await Promise.all([getHeroGarments(), getCollectionLooks()]);

  if (garments.length === 0) {
    return (
      <main className="grid min-h-[70dvh] place-items-center px-5">
        <EmptyState
          title="Todavía no hay prendas destacadas"
          detail="Marca alguna como destacada en el panel y aparecerá aquí."
        >
          <Link href="/catalogo" className="mt-2 text-sm underline underline-offset-4">
            Ver el catálogo
          </Link>
        </EmptyState>
      </main>
    );
  }

  const first = garments[0] as (typeof garments)[number];

  return (
    <main>
      {/* El escenario de la primera prenda, ya resuelto en el servidor. */}
      <style dangerouslySetInnerHTML={{ __html: tokensToCss(first.ambient) }} />
      <HeroAmbient garments={garments} />
      {looks.length > 0 ? <TotalLook looks={looks} /> : null}
    </main>
  );
}
