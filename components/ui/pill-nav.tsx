'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/ui/brand-mark';

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
      style={{
        height: 'var(--nav-h)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        // Sin fondo, el contenido pasa por debajo y choca con el logotipo.
        // Opaco a propósito: con un fondo translúcido el color real deja de ser
        // --ambient, y el contraste que calculamos para el texto ya no aplica.
        // Sobre el escenario no se nota, porque es exactamente su color.
        backgroundColor: 'var(--ambient)',
      }}
    >
      <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label="Carmisetas, inicio">
        <BrandMark height={11} className="sm:hidden" />
        <BrandMark height={13} className="hidden sm:flex" />
      </Link>

      <nav
        aria-label="Secciones"
        className="flex items-center gap-0.5 rounded-[var(--radius-pill)] p-1"
        style={{ backgroundColor: 'var(--ambient-veil)' }}
      >
        {LINKS.map((link) => {
          const active =
            link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-10 items-center rounded-[var(--radius-pill)] px-3.5 text-[13px]
                transition-colors sm:text-sm
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
