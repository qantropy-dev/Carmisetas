'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción el mensaje no llega al cliente; el digest sí, y es lo que
    // permite cruzarlo con los registros del servidor.
    console.error('Fallo en la página', error.digest ?? error.message);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Carmisetas</p>
        <h1 className="text-4xl uppercase">Algo se cayó</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          No pudimos cargar esta parte. Vuelve a intentarlo; si sigue igual, escríbenos.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 min-h-12 rounded-[var(--radius-pill)] bg-fg px-6 py-3.5 text-sm font-medium text-bg"
        >
          Reintentar
        </button>
        {error.digest ? (
          <p className="text-xs text-muted">Referencia: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
