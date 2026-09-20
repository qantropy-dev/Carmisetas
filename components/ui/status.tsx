'use client';

import { useEffect, useState } from 'react';
import type { ActionState } from '@/lib/actions';

/**
 * Aviso de resultado de una acción. Vive junto al formulario que lo produjo:
 * un toast flotante en una pantalla de móvil se pierde.
 */
export function Status({ state, className = '' }: { state: ActionState; className?: string }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (!state.ok || !state.message) return;
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [state]);

  if (!state.message || !visible) return null;

  return (
    <p
      role={state.ok ? 'status' : 'alert'}
      aria-live="polite"
      className={`rounded-xl px-3 py-2 text-sm ${
        state.ok ? 'bg-fg/6 text-muted' : 'bg-accent/10 text-accent'
      } ${className}`}
    >
      {state.message}
    </p>
  );
}
