#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  Levanta un Postgres desechable, aplica bootstrap + migraciones + semilla y
#  corre las comprobaciones de RLS. No toca ningun proyecto de Supabase.
#
#  Uso: npm run db:verify
# ---------------------------------------------------------------------------
set -euo pipefail

PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d)"
AS_PG=()
PGDATA="$WORK/data"
SOCKET="$WORK/sock"
DB=carmisetas_test

cleanup() {
  "${AS_PG[@]:-}" "$PGBIN/pg_ctl" -D "$PGDATA" -s -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

mkdir -p "$SOCKET"

# Postgres se niega a arrancar como root. Si el entorno corre como root (CI,
# contenedores), soltamos privilegios al usuario `postgres` del sistema.
AS_PG=()
if [ "$(id -u)" -eq 0 ] && id -u postgres >/dev/null 2>&1; then
  chown -R postgres:postgres "$WORK"
  chmod 0755 "$WORK"
  AS_PG=(setpriv --reuid=postgres --regid=postgres --init-groups --)
fi

"${AS_PG[@]}" "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth=trust -E UTF8 --locale=C >/dev/null
"${AS_PG[@]}" "$PGBIN/pg_ctl" -D "$PGDATA" -s -o "-k $SOCKET -c listen_addresses=" -w start >/dev/null
"${AS_PG[@]}" "$PGBIN/createdb" -h "$SOCKET" -U postgres "$DB"

run() { psql -h "$SOCKET" -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q "$@"; }

echo "→ bootstrap (lo que Supabase ya trae hecho)"
run -f "$ROOT/supabase/test/bootstrap.sql"

for file in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$file")"
  run -f "$file"
done

echo "→ seed.sql"
run -f "$ROOT/supabase/seed.sql"

echo "→ comprobaciones"
psql -h "$SOCKET" -U postgres -d "$DB" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/test/rls-assertions.sql"
