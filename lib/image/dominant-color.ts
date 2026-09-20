import { rgbToHex, suggestAmbient } from '@/lib/color';

/**
 * Color dominante del recorte, para proponer el swatch y el color ambiental.
 * Es una sugerencia: el admin siempre puede corregirla a mano.
 */
export type ColorSuggestion = { swatch: string; ambient: string };

export async function suggestColorsFromImage(source: Blob): Promise<ColorSuggestion | null> {
  const { Vibrant } = await import('node-vibrant/browser');
  const url = URL.createObjectURL(source);

  try {
    const palette = await new Vibrant(url, { colorCount: 96 }).getPalette();

    // El tono de la prenda es el que más píxeles ocupa, no el más saturado:
    // `Vibrant` a secas devolvería el detalle llamativo, no el color de la tela.
    const swatches = Object.values(palette).filter((s) => s !== null);
    if (swatches.length === 0) return null;

    const dominant = swatches.reduce((best, current) =>
      current.population > best.population ? current : best,
    );

    const [r, g, b] = dominant.rgb;
    const swatch = rgbToHex({ r, g, b });
    return { swatch, ambient: suggestAmbient(swatch) };
  } catch (error) {
    // Una sugerencia fallida no puede bloquear la subida, pero tampoco debe
    // desaparecer en silencio: sin esto, "no propuso color" no tiene causa.
    console.warn('No se pudo deducir el color dominante', error);
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
