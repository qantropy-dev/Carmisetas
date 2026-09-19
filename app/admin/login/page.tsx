import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false, follow: false } };

const NOTICES: Record<string, string> = {
  'sin-acceso': 'Esa cuenta no tiene acceso al panel.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-start gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Carmisetas</p>
          <h1 className="mt-2 text-4xl">Panel</h1>
        </div>
        <LoginForm
          {...(params.next ? { next: params.next } : {})}
          {...(params.error && NOTICES[params.error] ? { notice: NOTICES[params.error] } : {})}
        />
      </div>
    </main>
  );
}
