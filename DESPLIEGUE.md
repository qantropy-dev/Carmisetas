# Desplegar Carmisetas

Dos piezas: **Supabase** (base, auth, imágenes) y **Vercel** (el sitio).
Unos 20 minutos la primera vez.

---

## 1. Supabase

1. Crea el proyecto en [supabase.com](https://supabase.com) → **South America
   (São Paulo)**, que es la región más cerca de Colombia.
2. Guarda la contraseña de la base: no se vuelve a mostrar.
3. Desde este repo, publica el esquema:

```bash
npx supabase login
npx supabase link --project-ref <REF_DEL_PROYECTO>
npx supabase db push          # migraciones: esquema, RLS, triggers, permisos
```

`db push` **no** siembra datos. Para arrancar con las 6 prendas de ejemplo:

```bash
npx supabase db push --include-seed
```

Si vas a cargar el catálogo real desde el panel, sáltate la semilla.

4. Las claves están en **Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (nunca en el cliente)

5. Cierra el registro público: **Authentication → Providers → Email** y
   desactiva *Enable signup*. El proveedor de correo **tiene que quedar
   encendido**, o nadie podrá entrar al panel.

---

## 2. Vercel

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
2. Variables de entorno (**Production** y **Preview**):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | de Supabase |
| `NEXT_PUBLIC_SITE_URL` | `https://carmisetas.com` — **sin barra final** |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `57XXXXXXXXXX` — indicativo, sin `+` |

3. Deploy. No hace falta configurar nada más: Next se detecta solo.

4. Vuelve a Supabase → **Authentication → URL Configuration** y pon la URL de
   Vercel en *Site URL* y en *Redirect URLs*.

Antes de desplegar, comprueba que no falta nada:

```bash
npm run check
```

---

## 3. Las dos cuentas del panel

No hay registro público. Con las claves de producción en `.env.local`:

```bash
npm run admin:create -- correo@dominio.com "Nombre Apellido"
```

Imprime una contraseña temporal. El script avisa si se pasa de dos cuentas.

---

## 4. Dominio

En Vercel → **Settings → Domains**, agrega `carmisetas.com`. Vercel dice qué
registros DNS poner. Cuando el dominio esté activo, actualiza
`NEXT_PUBLIC_SITE_URL` y vuelve a desplegar: de ahí salen el sitemap, las URLs
canónicas y los enlaces del pedido de WhatsApp.

---

## Comprobar que quedó bien

```bash
BASE_URL=https://tu-dominio.com npm run e2e     # 41 comprobaciones
BASE_URL=https://tu-dominio.com npm run audit   # Lighthouse, listón en 90
```

A mano, en el teléfono:

1. La portada carga con la prenda flotando y el fondo de su color.
2. En **Catálogo → Lista**, el botón `+` de una tarjeta abre las tallas y la
   prenda entra a la bolsa.
3. **Finalizar por WhatsApp** abre el chat con el pedido escrito y el enlace a
   cada prenda.
4. `/admin/login` entra con una de las dos cuentas y `/admin` no aparece en
   Google (va con `noindex`).

---

## Cuando el catálogo crezca

El recorte automático descarga ~44 MB la primera vez desde el CDN de la
librería. Para servirlo desde tu propio dominio:

```bash
npm run imgly:mirror
```

y agrega `NEXT_PUBLIC_IMGLY_PUBLIC_PATH=/imgly/` en Vercel. Es opcional: sin
eso funciona igual, solo depende de un tercero.
