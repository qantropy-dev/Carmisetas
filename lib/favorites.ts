'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'carmisetas:favoritos';

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    // Ventana privada, almacenamiento bloqueado o dato corrupto: sin favoritos.
    return [];
  }
}

/**
 * Favoritos en el propio navegador. No hay cuentas de cliente, así que no hay
 * dónde guardarlos del lado del servidor; se leen después de montar para que el
 * HTML servido y el hidratado coincidan.
 */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(read());
    setReady(true);

    // Otra pestaña puede cambiarlos.
    function onStorage(event: StorageEvent) {
      if (event.key === KEY) setIds(read());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Si no se puede guardar, al menos que funcione en esta sesión.
      }
      return next;
    });
  }, []);

  return { ids, ready, toggle, has: (id: string) => ids.includes(id) };
}
