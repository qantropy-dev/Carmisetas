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
| 2 | Admin con recorte automático y color ambiental | ✅ |
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
| `npm run e2e` | **Humo del panel en un navegador real, a 390 px** |
| `npm run seed` | Regenera recortes PNG + `seed.sql` desde `supabase/seed-data.ts` |
| `npm run db:reset` | `supabase db reset` |
| `npm run db:types` | Regenera `lib/supabase/database.types.ts` desde la base |
| `npm run admin:create` | Da acceso al panel a un correo |
| `npm run imgly:mirror` | Copia el modelo de recorte a `public/imgly` (opcional) |

`db:verify` no necesita Docker ni un proyecto de Supabase: arranca un Postgres
local, monta lo mínimo que Supabase da por hecho (`auth`, `storage`, roles),
aplica las migraciones y la semilla, y corre las comprobaciones de RLS.

`e2e` sí necesita la pila completa (`npx supabase start` y `npm run dev`).
Recorre el panel en un navegador real con viewport de teléfono: login, listado,
filtros, interruptores, edición, matriz de tallas, subida de imagen con recorte,
precios masivos e historial. Falla si aparece cualquier error de consola.

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

## El panel

`/admin`, cerrado por `middleware.ts`. Alcance: prendas, colores, variantes,
imágenes, precios, categorías y colecciones. Nada de configuración de diseño.

- **Listado** con búsqueda, filtros de estado y categoría, interruptores de
  visible/destacada y orden por arrastre. El arrastre se desactiva mientras hay
  un filtro puesto, porque reordenar una lista filtrada no significa nada.
- **Ficha en una sola pantalla**: datos, precios, colores, tallas y una vista
  previa en vivo que usa los mismos `ambientTokens` y `resolvePrice` que el
  sitio público. Si ahí se ve mal, en la tienda también.
- **Colores**: crear uno genera sus cinco tallas. El color del escenario se
  propone solo a partir del de la prenda, y deja de proponerse en cuanto lo
  tocas a mano.
- **Matriz color × talla**: la celda muestra el estado de un vistazo y al
  tocarla se abre el editor de esa talla. Solo se envía lo que cambió.
- **Imágenes**: recorte automático en el navegador, color dominante como
  sugerencia editable, etiqueta de vista, compresión a WebP y subida directa a
  Storage sin pasar por nuestro servidor.
- **Precios masivos** por porcentaje, monto o precio fijo, con redondeo y vista
  previa obligatoria. Cada prenda se actualiza por separado para que el
  historial registre qué precio cambió y a cuánto.
- **Historial**: quién, qué campo, de qué valor a cuál y cuándo.

Todo está pensado para el teléfono: objetivos de 44 px, tipo de 16 px en los
campos (iOS no hace zoom), filas que se apilan y barras que caben a 390 px.

### Recorte automático

Corre en el navegador con `@imgly/background-removal`: la foto no sale del
teléfono hasta que se sube. Se usa el modelo `isnet_quint8` (44 MB en vez de
los 88 del grande) porque el admin se usa con datos móviles; sobre una prenda
contra fondo liso la diferencia no se nota.

Por defecto el modelo viene del CDN de la librería. `npm run imgly:mirror` lo
copia a `public/imgly` para servirlo desde nuestro dominio; entonces hay que
poner `NEXT_PUBLIC_IMGLY_PUBLIC_PATH=/imgly/`. Si el recorte falla por lo que
sea, el cargador ofrece subir una imagen ya recortada.

## Seguridad

- El público solo lee filas activas; no tiene permiso de escritura en ninguna tabla.
- `admin_profiles` y `audit_log` son invisibles para el público.
- Estar autenticado no basta: hay que figurar en `admin_profiles`. Se comprueba
  en el middleware, en el login y en cada policy.
- El middleware usa `getUser()` (valida el JWT contra el servidor de auth), no
  `getSession()`, que solo lee una cookie.
- La `service_role` key nunca sale del servidor.
- Cada Server Action vuelve a comprobar que quien llama es admin: el middleware
  protege las páginas, pero una acción se puede invocar directamente.
- Todo esto está cubierto por `npm run db:verify`.

Un detalle del `config.toml` que cuesta caro descubrir: `auth.email.enable_signup`
del CLI mapea a `GOTRUE_EXTERNAL_EMAIL_ENABLED`, que apaga el proveedor de correo
**entero** y deja a todo el mundo fuera. El registro público se cierra con
`auth.enable_signup`, que es el que está en `false`.
