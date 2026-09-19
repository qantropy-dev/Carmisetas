import Image from 'next/image';
import { EmptyState } from '@/components/ui/empty-state';
import { hasSupabaseConfig } from '@/lib/env';
import { getCatalog } from '@/lib/queries/products';

/*
 * PROVISIONAL (fase 1). Esta pagina existe para comprobar de un vistazo que la
 * base, el RLS y la semilla funcionan: cada prenda sobre su color ambiental,
 * con el texto que el calculo de contraste eligio. La fase 3 la reemplaza por
 * el hero de color ambiental.
 */
export default async function HomePage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <EmptyState
          title="Falta conectar Supabase"
          detail="Copia .env.example a .env.local con las credenciales del proyecto y vuelve a cargar. Las migraciones y la semilla ya están listas en supabase/."
        />
      </main>
    );
  }

  const products = await getCatalog();

  if (products.length === 0) {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <EmptyState
          title="Todavía no hay prendas"
          detail="Corre `supabase db reset` para aplicar migraciones y sembrar el catálogo de ejemplo."
        />
      </main>
    );
  }

  return (
    <main>
      <header className="px-6 py-10 sm:px-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Carmisetas · fase 1</p>
        <h1 className="mt-2 text-5xl sm:text-6xl">Base de datos en pie</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          {products.length} prendas leídas con RLS de solo lectura pública. Cada bloque usa el{' '}
          <code>ambient_hex</code> de su color primario y el texto lo eligió el cálculo de contraste.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-px bg-muted/20 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            style={product.ambient as React.CSSProperties}
            className="stage flex flex-col items-center gap-4 px-8 py-12"
          >
            {product.cutoutUrl ? (
              <Image
                src={product.cutoutUrl}
                alt={product.name}
                width={640}
                height={820}
                sizes="(max-width: 640px) 80vw, 30vw"
                className="h-64 w-auto object-contain"
                priority={product.isFeatured}
              />
            ) : null}
            <div className="text-center">
              <h2 className="text-2xl uppercase">{product.name}</h2>
              <p className="mt-1 text-sm text-[var(--ambient-muted)]">
                {product.colorName} · {product.categoryName}
              </p>
              <p className="mt-3 text-xl font-medium">
                {product.price.finalLabel}
                {product.price.compareAtLabel ? (
                  <span className="ml-2 text-sm line-through opacity-60">
                    {product.price.compareAtLabel}
                  </span>
                ) : null}
                {product.price.discountPercent !== null ? (
                  <span className="ml-2 text-sm">−{product.price.discountPercent}%</span>
                ) : null}
              </p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
