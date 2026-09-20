import type { Metadata } from 'next';
import { BrandMark } from '@/components/ui/brand-mark';
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
          <BrandMark height={13} className="text-fg" />
          <h1 className="mt-4 text-4xl">Panel</h1>
        </div>
        <LoginForm
          {...(params.next ? { next: params.next } : {})}
          {...(params.error && NOTICES[params.error] ? { notice: NOTICES[params.error] } : {})}
        />
      </div>
    </main>
  );
}
