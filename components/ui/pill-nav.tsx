'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
];

/**
 * Navegación tipo píldora. Vive sobre el escenario, así que toma sus colores de
 * los tokens ambientales y cambia con la prenda.
 */
export function PillNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-5 sm:px-8"
      style={{ height: 'var(--nav-h)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <Link href="/" className="shrink-0 leading-none">
        <span className="font-display text-[15px] font-extrabold uppercase tracking-[-0.045em]">
          Carmisetas
        </span>
      </Link>

      <nav
        aria-label="Secciones"
        className="flex items-center gap-0.5 rounded-[var(--radius-pill)] p-1"
        style={{ backgroundColor: 'color-mix(in srgb, var(--ambient-fg) 7%, transparent)' }}
      >
        {LINKS.map((link) => {
          const active =
            link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-[13px] transition-colors sm:text-sm
                ${active
                  ? 'bg-[var(--ambient-fg)] text-[var(--ambient)]'
                  : 'text-[var(--ambient-muted)] hover:text-[var(--ambient-fg)]'}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </header>
  );
}
