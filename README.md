# Carmisetas

Showroom de camisetas y suéteres. La prenda flota recortada sobre un escenario
que adopta su color; el sitio se recorre como un showroom, no como una tienda.

**Stack:** Next.js 15 (App Router) · TypeScript estricto · Tailwind 4 ·
Framer Motion · Embla · Supabase (Postgres + Auth + Storage + RLS) · Vercel.

---

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Base de datos, auth, RLS, semilla de 6 prendas | ✅ |
| 2 | Admin con recorte automático y color ambiental | pendiente |
| 3 | Hero color ambiental | pendiente |
| 4 | Catálogo: Perchero + Lista | pendiente |
| 5 | Ficha + bolsa + WhatsApp | pendiente |
| 6 | Total Look, motion fino, SEO y rendimiento | pendiente |

---

## Arrancar

```bash
npm install
cp .env.example .env.local        # y rellena las credenciales
supabase start                    # Postgres + Auth + Storage locales
supabase db reset                 # aplica migraciones + semilla
npm run dev
```

Sin credenciales de Supabase el sitio arranca igual y muestra un estado vacío
explicando qué falta, en vez de reventar.

### Cuentas del panel

No hay registro público. En local, `supabase db reset` crea dos cuentas:

| Correo | Contraseña |
|---|---|
| `admin@carmisetas.local` | `carmisetas-dev` |
| `taller@carmisetas.local` | `carmisetas-dev` |

En producción se crean una a una, desde una máquina de confianza:

```bash
npm run admin:create -- correo@dominio.com "Nombre Apellido"
```

Imprime una contraseña temporal. El script avisa si se pasa de dos cuentas.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:verify` | **Levanta un Postgres desechable y comprueba el RLS** |
| `npm run seed` | Regenera recortes PNG + `seed.sql` desde `supabase/seed-data.ts` |
| `npm run db:reset` | `supabase db reset` |
| `npm run db:types` | Regenera `lib/supabase/database.types.ts` desde la base |
| `npm run admin:create` | Da acceso al panel a un correo |

`db:verify` no necesita Docker ni un proyecto de Supabase: arranca un Postgres
local, monta lo mínimo que Supabase da por hecho (`auth`, `storage`, roles),
aplica las migraciones y la semilla, y corre las comprobaciones de RLS.

---

## Dónde está cada cosa

```
app/(public)/          sitio público
app/admin/             panel (protegido por middleware.ts)
components/            hero-ambient · rack-slider · total-look · bento-grid ·
                       product · bag · admin · ui
lib/tokens.ts          ← LA PALETA. Único sitio donde tocar los colores de marca
lib/color.ts           luminancia WCAG, contraste y tokens del escenario
lib/pricing.ts         precio efectivo, descuento y formato es-CO
lib/queries/           capa de datos tipada
lib/supabase/          clientes browser / server / service-role
supabase/migrations/   esquema, RLS, triggers, grants
supabase/seed-data.ts  ← EL CATÁLOGO SEMILLA. De aquí salen las imágenes y el SQL
supabase/test/         bootstrap + comprobaciones de RLS
scripts/               generadores de semilla y utilidades
```

---

## Color

Dos sistemas, a propósito separados:

**Neutros de marca** — `--color-bg`, `--color-fg`, `--color-accent`,
`--color-muted`. Viven en `lib/tokens.ts` y `app/layout.tsx` los emite en
`:root`. Ningún archivo CSS escribe un color literal. Cambiar la paleta es
editar un archivo.

**Color ambiental** — cada color de cada prenda trae su `ambient_hex` desde la
base. `ambientTokens()` calcula en el servidor la luminancia WCAG, elige el
color de texto con más contraste y deriva `--ambient-muted`, `--ambient-hairline`,
`--ambient-veil` y `--ambient-shadow`. Se serializa como `style` del escenario:
el primer paint ya sale correcto, sin parpadeo y sin JavaScript.

`npm run seed` falla si algún `ambient_hex` no alcanza 4.5:1, y avisa si una
prenda queda tan cerca de su escenario que dejaría de leerse.

---

## Precios

Enteros en COP, sin decimales. Precio final = `price_override ?? base_price`,
la misma regla en `lib/pricing.ts` y en la función `effective_price` de la base.
Se muestran en formato `es-CO` (`$ 89.900`). Si `compare_at_price` supera al
precio final, se tacha y se muestra el porcentaje de descuento.

---

## Seguridad

- El público solo lee filas activas; no tiene permiso de escritura en ninguna tabla.
- `admin_profiles` y `audit_log` son invisibles para el público.
- Estar autenticado no basta: hay que figurar en `admin_profiles`. Se comprueba
  en el middleware, en el login y en cada policy.
- El middleware usa `getUser()` (valida el JWT contra el servidor de auth), no
  `getSession()`, que solo lee una cookie.
- La `service_role` key nunca sale del servidor.
- Todo esto está cubierto por `npm run db:verify`.
