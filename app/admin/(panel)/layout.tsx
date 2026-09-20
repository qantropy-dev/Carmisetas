import Link from 'next/link';
import { signOut } from '@/app/admin/login/actions';
import { requireAdmin } from '@/lib/auth';

const LINKS = [
  { href: '/admin/prendas', label: 'Prendas' },
  { href: '/admin/precios', label: 'Precios' },
  { href: '/admin/colecciones', label: 'Colecciones' },
  { href: '/admin/historial', label: 'Historial' },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-20 border-b border-muted/20 bg-bg/92 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8">
          <nav aria-label="Panel" className="-mx-1 flex min-w-0 gap-0.5 overflow-x-auto px-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 rounded-[var(--radius-pill)] px-2.5 py-2 text-[13px] text-muted
                           transition-colors hover:bg-fg/5 hover:text-fg sm:px-3 sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              className="min-h-10 px-2 text-sm text-muted underline-offset-4 hover:underline"
              title={admin.email}
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="px-4 py-6 pb-16 sm:px-8">{children}</main>
    </div>
  );
}
