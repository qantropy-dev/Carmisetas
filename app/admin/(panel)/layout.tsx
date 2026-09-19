import Link from 'next/link';
import { signOut } from '@/app/admin/login/actions';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-muted/20 bg-bg/90 px-4 py-3 backdrop-blur sm:px-8">
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/admin/prendas" className="rounded-[var(--radius-pill)] px-3 py-1.5 hover:bg-fg/5">
            Prendas
          </Link>
          <Link href="/admin/colecciones" className="rounded-[var(--radius-pill)] px-3 py-1.5 hover:bg-fg/5">
            Colecciones
          </Link>
        </nav>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted underline-offset-4 hover:underline">
            Salir
          </button>
        </form>
      </header>
      <main className="px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
