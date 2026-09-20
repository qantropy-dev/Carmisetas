import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Carmisetas</p>
        <h1 className="text-5xl uppercase">Aquí no hay nada</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          La prenda que buscas cambió de enlace, se agotó o nunca existió.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link
            href="/catalogo"
            className="min-h-12 rounded-[var(--radius-pill)] bg-fg px-6 py-3.5 text-sm font-medium text-bg"
          >
            Ver el catálogo
          </Link>
          <Link
            href="/"
            className="min-h-12 rounded-[var(--radius-pill)] border border-muted/30 px-6 py-3.5 text-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
