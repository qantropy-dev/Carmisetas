'use client';

/** Interruptor accesible. Es un botón real, no una casilla disfrazada. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-40
                  ${checked ? 'bg-fg' : 'bg-muted/35'}`}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 size-5 rounded-full bg-bg shadow-sm transition-[left]
                    ${checked ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  );
}
