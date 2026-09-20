import type { ComponentProps } from 'react';

type Variant = 'solid' | 'ghost' | 'quiet' | 'danger';

const STYLES: Record<Variant, string> = {
  solid: 'bg-fg text-bg hover:opacity-90',
  ghost: 'border border-muted/30 hover:border-fg',
  quiet: 'text-muted hover:text-fg',
  danger: 'border border-accent/40 text-accent hover:bg-accent/10',
};

export function Button({
  variant = 'ghost',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)]
                  px-4 text-sm font-medium transition
                  disabled:cursor-not-allowed disabled:opacity-45 ${STYLES[variant]} ${className}`}
    />
  );
}
