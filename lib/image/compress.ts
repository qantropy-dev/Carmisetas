/**
 * Compresión en el navegador antes de subir.
 *
 * Se usa WebP porque conserva el canal alfa (los recortes lo necesitan) y pesa
 * bastante menos que PNG. Si el navegador no sabe codificar WebP, cae a PNG.
 */

export type CompressOptions = {
  /** Lado mayor en píxeles. Por encima, se reescala. */
  maxSide?: number;
  quality?: number;
};

export type CompressedImage = {
  blob: Blob;
  width: number;
  height: number;
  extension: 'webp' | 'png';
};

const DEFAULTS = { maxSide: 1600, quality: 0.9 } satisfies Required<CompressOptions>;

async function toBitmap(source: Blob): Promise<ImageBitmap> {
  // `imageOrientation` respeta el EXIF de las fotos de celular.
  return createImageBitmap(source, { imageOrientation: 'from-image' });
}

function canvasFor(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(
  source: Blob,
  options: CompressOptions = {},
): Promise<CompressedImage> {
  const { maxSide, quality } = { ...DEFAULTS, ...options };
  const bitmap = await toBitmap(source);

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = canvasFor(width, height);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('El navegador no permitió procesar la imagen');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await toBlob(canvas, 'image/webp', quality);
  if (webp && webp.type === 'image/webp') {
    return { blob: webp, width, height, extension: 'webp' };
  }

  const png = await toBlob(canvas, 'image/png', 1);
  if (!png) throw new Error('No se pudo comprimir la imagen');
  return { blob: png, width, height, extension: 'png' };
}

/** Bytes a algo legible: "2,4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
