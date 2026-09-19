'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn, type LoginState } from '@/app/admin/login/actions';

const INITIAL: LoginState = { error: null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-12 w-full rounded-[var(--radius-pill)] bg-fg text-bg font-medium
                 transition-opacity disabled:opacity-50"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(signIn, INITIAL);
  const message = state.error ?? notice ?? null;

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <input type="hidden" name="next" value={next ?? ''} />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-12 rounded-xl border border-muted/30 bg-transparent px-4
                     outline-none focus-visible:border-fg"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="h-12 rounded-xl border border-muted/30 bg-transparent px-4
                     outline-none focus-visible:border-fg"
        />
      </label>

      {message ? (
        <p role="alert" className="text-sm text-accent">
          {message}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}
