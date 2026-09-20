'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn, type LoginState } from '@/app/admin/login/actions';

const INITIAL: LoginState = { error: null, email: '' };

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

  /*
   * React 19 resetea el formulario cuando termina la acción, y lo hace sobre el
   * DOM. El valor que se envía sale del DOM, no del estado de React, así que
   * tener el correo en un useState no basta: el campo queda vacío y el segundo
   * intento viaja sin correo.
   *
   * Por eso el correo vuelve desde el servidor y el campo se remonta con él.
   * De paso, el formulario sigue funcionando con JavaScript desactivado.
   */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt((n) => n + 1);
  }, [state]);
  const message = state.error ?? notice ?? null;

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <input type="hidden" name="next" value={next ?? ''} />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">Correo</span>
        <input
          key={`email-${attempt}`}
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email}
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
