'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Panel inferior en móvil, diálogo centrado en pantallas grandes.
 * Usa <dialog> nativo: foco atrapado y Escape, sin librería.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 max-h-[88dvh] w-full max-w-lg self-end justify-self-center rounded-t-3xl
                 border border-muted/20 bg-bg p-0 text-fg backdrop:bg-fg/35
                 sm:my-auto sm:self-center sm:rounded-3xl"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-muted/20 px-5 py-3.5">
          <h2 className="text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 grid size-10 place-items-center rounded-full text-muted hover:text-fg"
          >
            ✕
          </button>
        </header>
        <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}
