'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { ambientTokens } from '@/lib/color';
import { compressImage, formatBytes } from '@/lib/image/compress';
import { suggestColorsFromImage } from '@/lib/image/dominant-color';
import { removeImageBackground, type RemovalProgress } from '@/lib/image/remove-background';
import { uploadToStorage } from '@/lib/image/upload';
import { PRODUCT_VIEWS, type ProductView } from '@/lib/supabase/database.types';

export type UploadResult = {
  url: string;
  view: ProductView;
  alt: string;
  /** Sugerencias del color dominante; el admin decide si las aplica. */
  suggestion: { swatch: string; ambient: string } | null;
  applySuggestion: boolean;
  setAsCutout: boolean;
};

type Step = 'elegir' | 'recortando' | 'revisar' | 'subiendo';

export function ImageUploader({
  open,
  onClose,
  onUploaded,
  productSlug,
  colorName,
  ambientHex,
  suggestedView,
  canSetCutout,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (result: UploadResult) => void;
  productSlug: string;
  colorName: string | null;
  ambientHex: string;
  suggestedView?: ProductView;
  canSetCutout: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('elegir');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<RemovalProgress | null>(null);

  const [original, setOriginal] = useState<{ blob: Blob; url: string } | null>(null);
  const [result, setResult] = useState<{ blob: Blob; url: string; cutout: boolean } | null>(null);
  const [suggestion, setSuggestion] = useState<{ swatch: string; ambient: string } | null>(null);
  const [applySuggestion, setApplySuggestion] = useState(true);
  const [setAsCutout, setSetAsCutout] = useState(canSetCutout);
  const [view, setView] = useState<ProductView>(suggestedView ?? 'frente');
  const [alt, setAlt] = useState('');

  function reset() {
    if (original) URL.revokeObjectURL(original.url);
    if (result) URL.revokeObjectURL(result.url);
    setOriginal(null);
    setResult(null);
    setSuggestion(null);
    setProgress(null);
    setError(null);
    setStep('elegir');
    if (fileRef.current) fileRef.current.value = '';
  }

  function close() {
    reset();
    onClose();
  }

  function pick(file: File) {
    setError(null);
    setOriginal({ blob: file, url: URL.createObjectURL(file) });
    setResult(null);
    setStep('elegir');
  }

  async function runRemoval() {
    if (!original) return;
    setStep('recortando');
    setError(null);
    try {
      const cut = await removeImageBackground(original.blob, setProgress);
      await finish(cut, true);
    } catch (e) {
      setError(
        e instanceof Error
          ? `No se pudo recortar: ${e.message}`
          : 'No se pudo recortar. Puedes subir un recorte hecho a mano.',
      );
      setStep('elegir');
    }
  }

  async function useAsIs() {
    if (!original) return;
    setStep('recortando');
    await finish(original.blob, false);
  }

  async function finish(blob: Blob, cutout: boolean) {
    setResult({ blob, url: URL.createObjectURL(blob), cutout });
    setSuggestion(await suggestColorsFromImage(blob));
    setProgress(null);
    setStep('revisar');
  }

  async function upload() {
    if (!result) return;
    setStep('subiendo');
    setError(null);
    try {
      const compressed = await compressImage(result.blob);
      const url = await uploadToStorage(compressed.blob, {
        productSlug,
        colorName,
        view,
        extension: compressed.extension,
      });
      onUploaded({
        url,
        view,
        alt,
        suggestion,
        applySuggestion: applySuggestion && suggestion !== null,
        setAsCutout: setAsCutout && result.cutout,
      });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la imagen');
      setStep('revisar');
    }
  }

  const stageHex = applySuggestion && suggestion ? suggestion.ambient : ambientHex;
  const busy = step === 'recortando' || step === 'subiendo';
  const pct =
    progress && progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : null;

  return (
    <Sheet open={open} onClose={close} title="Agregar imagen">
      <div className="flex flex-col gap-4">
        {!original ? (
          <>
            <input
              ref={fileRef}
              id="uploader-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) pick(file);
              }}
            />
            <label
              htmlFor="uploader-file"
              className="grid cursor-pointer place-items-center gap-2 rounded-2xl border
                         border-dashed border-muted/40 px-6 py-12 text-center transition-colors
                         hover:border-fg"
            >
              <span className="text-base">Tomar o elegir una foto</span>
              <span className="text-xs text-muted">
                El recorte se hace aquí mismo. La foto no sale del teléfono hasta que la subes.
              </span>
            </label>
          </>
        ) : null}

        {original && !result ? (
          <>
            <div className="overflow-hidden rounded-2xl bg-fg/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={original.url} alt="Foto elegida" className="mx-auto max-h-64 object-contain" />
            </div>
            <p className="text-xs text-muted">{formatBytes(original.blob.size)}</p>

            {step === 'recortando' ? (
              <div className="flex flex-col gap-2" role="status" aria-live="polite">
                <p className="text-sm">{progress?.stage ?? 'Preparando'}…</p>
                <div className="h-1 overflow-hidden rounded-full bg-muted/20">
                  <div
                    className="h-full bg-fg transition-[width]"
                    style={{ width: pct === null ? '35%' : `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted">
                  La primera vez descarga el modelo; después es casi inmediato.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button type="button" variant="solid" onClick={runRemoval}>
                  Quitar el fondo
                </Button>
                <Button type="button" onClick={useAsIs}>
                  Ya viene recortada, subir tal cual
                </Button>
                <Button type="button" variant="quiet" onClick={reset}>
                  Elegir otra foto
                </Button>
              </div>
            )}
          </>
        ) : null}

        {result ? (
          <>
            <div
              className="stage grid place-items-center rounded-2xl px-4 py-8"
              style={ambientTokens(stageHex) as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.url}
                alt="Resultado del recorte"
                className="max-h-56 object-contain drop-shadow-lg"
              />
            </div>
            <p className="text-xs text-muted">
              Así se verá en la tienda, sobre su color ambiental.
            </p>

            {suggestion ? (
              <label className="flex items-start gap-3 rounded-xl border border-muted/25 p-3">
                <input
                  type="checkbox"
                  checked={applySuggestion}
                  onChange={(e) => setApplySuggestion(e.target.checked)}
                  className="mt-1 size-4 accent-[var(--color-fg)]"
                />
                <span className="flex-1 text-sm">
                  Usar el color que detecté
                  <span className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                    <span
                      className="size-4 rounded-full border border-muted/30"
                      style={{ backgroundColor: suggestion.swatch }}
                    />
                    {suggestion.swatch} prenda
                    <span
                      className="ml-1 size-4 rounded-full border border-muted/30"
                      style={{ backgroundColor: suggestion.ambient }}
                    />
                    {suggestion.ambient} escenario
                  </span>
                </span>
              </label>
            ) : null}

            {result.cutout && canSetCutout ? (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={setAsCutout}
                  onChange={(e) => setSetAsCutout(e.target.checked)}
                  className="size-4 accent-[var(--color-fg)]"
                />
                Usar este recorte como el que flota en el hero
              </label>
            ) : null}

            <Field label="Vista">
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_VIEWS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={`min-h-10 rounded-[var(--radius-pill)] px-3.5 text-sm capitalize transition
                      ${view === v ? 'bg-fg text-bg' : 'border border-muted/30 text-muted hover:text-fg'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Texto alternativo" hint="Para quien no ve la imagen y para buscadores.">
              <input
                className={inputClass}
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder={`${colorName ?? 'Prenda'}, ${view}`}
              />
            </Field>

            <div className="flex flex-col gap-2">
              <Button type="button" variant="solid" onClick={upload} disabled={busy}>
                {step === 'subiendo' ? 'Subiendo…' : 'Subir'}
              </Button>
              <Button type="button" variant="quiet" onClick={reset} disabled={busy}>
                Empezar de nuevo
              </Button>
            </div>
          </>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
