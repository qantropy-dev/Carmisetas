/**
 * Recorte automático en el navegador. La foto original nunca sale del equipo:
 * el modelo corre local (WASM), así que esto funciona incluso con la conexión
 * del taller.
 *
 * El paquete pesa mucho y descarga el modelo la primera vez, por eso se importa
 * de forma diferida: solo cuando alguien pulsa "quitar fondo".
 */

export type RemovalProgress = { stage: string; loaded: number; total: number };

const STAGES: Record<string, string> = {
  'fetch:/models/isnet': 'Descargando el modelo',
  compute: 'Recortando',
};

function describe(key: string): string {
  for (const [prefix, label] of Object.entries(STAGES)) {
    if (key.startsWith(prefix)) return label;
  }
  return key.startsWith('fetch') ? 'Descargando el modelo' : 'Procesando';
}

/**
 * Config compartida por el recorte y la precarga.
 *
 * `isnet_quint8` en lugar del modelo grande: son 44 MB en vez de 88 y el admin
 * se usa desde el celular. Sobre una prenda recortada contra fondo liso la
 * diferencia de calidad no se nota.
 *
 * `publicPath` por defecto apunta al CDN de la librería. Si se define
 * NEXT_PUBLIC_IMGLY_PUBLIC_PATH (ver `npm run imgly:mirror`), los recursos se
 * sirven desde nuestro dominio y deja de depender de un tercero.
 */
function config() {
  // La librería exige una URL absoluta, así que una ruta como `/imgly/` se
  // resuelve contra el origen de la pestaña.
  const configured = process.env.NEXT_PUBLIC_IMGLY_PUBLIC_PATH;
  const publicPath =
    configured && typeof window !== 'undefined'
      ? new URL(configured, window.location.origin).href
      : configured;

  return {
    model: 'isnet_quint8' as const,
    output: { format: 'image/png' as const },
    ...(publicPath ? { publicPath } : {}),
  };
}

export async function removeImageBackground(
  source: Blob,
  onProgress?: (progress: RemovalProgress) => void,
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');

  return removeBackground(source, {
    ...config(),
    progress: (key: string, current: number, total: number) => {
      onProgress?.({ stage: describe(key), loaded: current, total });
    },
  });
}

/** Deja el modelo listo para que el primer recorte no se sienta lento. */
export async function warmUpBackgroundRemoval(): Promise<void> {
  const { preload } = await import('@imgly/background-removal');
  await preload(config());
}
