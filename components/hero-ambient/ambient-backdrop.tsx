'use client';

import { useEffect, useRef, useState } from 'react';
import type { AmbientTokens } from '@/lib/color';
import { DURATION, EASE } from '@/lib/motion';

/**
 * El escenario: ocupa la pantalla entera, por detrás de todo, incluida la barra
 * superior. "Todo el fondo transiciona al color de la prenda activa" se toma al
 * pie de la letra.
 *
 * Dos decisiones que importan:
 *
 * 1. El color NO se interpola. Interpolar dos colores en sRGB los hace pasar
 *    por un gris sucio a mitad de camino; aquí el color nuevo entra como una
 *    capa que se funde sobre la anterior.
 *
 * 2. Los tokens se escriben en `:root`, no en un contenedor, para que la barra
 *    y cualquier sección los hereden. El servidor ya emite los del primer
 *    render, así que el primer paint sale correcto sin JavaScript.
 */
export function AmbientBackdrop({ tokens }: { tokens: AmbientTokens }) {
  const base = useRef(tokens['--ambient']);
  const [incoming, setIncoming] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(tokens)) root.style.setProperty(key, value);
  }, [tokens]);

  useEffect(() => {
    const next = tokens['--ambient'];
    if (next === base.current) return;

    setIncoming(next);
    // Un frame con la capa a opacidad 0 antes de encenderla, o el navegador
    // colapsa ambos estados en uno y no hay transición.
    const raf = requestAnimationFrame(() => setVisible(true));
    const done = setTimeout(() => {
      base.current = next;
      setIncoming(null);
      setVisible(false);
    }, DURATION.ambient * 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [tokens]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{ backgroundColor: base.current }} />
      {incoming ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: incoming,
            opacity: visible ? 1 : 0,
            transition: `opacity ${DURATION.ambient}s cubic-bezier(${EASE.stage.join(',')})`,
          }}
        />
      ) : null}
    </div>
  );
}
