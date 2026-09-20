import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  error?: string | undefined;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs uppercase tracking-[0.13em] text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-accent">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* 16px en móvil evita el zoom automático de iOS al enfocar. */
export const inputClass =
  'min-h-11 w-full rounded-xl border border-muted/30 bg-transparent px-3.5 text-base ' +
  'outline-none transition-colors placeholder:text-muted/60 focus-visible:border-fg sm:text-sm';

export const textareaClass = `${inputClass} min-h-24 resize-y py-2.5 leading-relaxed`;
