/** Forma unica de respuesta de las Server Actions, para `useActionState`. */
export type ActionState = {
  ok: boolean;
  message: string | null;
  /** Errores por campo, tal como los devuelve Zod. */
  fieldErrors: Record<string, string>;
};

export const IDLE: ActionState = { ok: false, message: null, fieldErrors: {} };

export function ok(message: string): ActionState {
  return { ok: true, message, fieldErrors: {} };
}

export function fail(message: string, fieldErrors: Record<string, string> = {}): ActionState {
  return { ok: false, message, fieldErrors };
}

/** Aplana los issues de Zod a `{ campo: mensaje }`, quedandose con el primero. */
export function zodErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || '_';
    out[key] ??= issue.message;
  }
  return out;
}
