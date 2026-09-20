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
| 3 | Hero color ambiental | ✅ |
| 4 | Catálogo: Perchero + Lista | ✅ |
| 5 | Ficha + bolsa + WhatsApp | ✅ |
| 6 | Total Look, motion fino, SEO y rendimiento | ✅ |

---

**Desplegar:** ver [DESPLIEGUE.md](./DESPLIEGUE.md).

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
| `npm test` | **Pruebas de la lógica pura: precios, color y pedido** |
| `npm run e2e` | **Humo del sitio y del panel en un navegador real, a 390 px** |
| `npm run audit` | **Lighthouse sobre el build, emulando teléfono** |
| `npm run check` | Dice qué variables de entorno faltan |
| `npm run brand` | Regenera el logotipo y los iconos desde `brand/` |
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

## Rendimiento y SEO

`npm run audit` corre Lighthouse sobre el build emulando un teléfono. El listón
son 90 en las cuatro categorías; el script sale con error si alguna baja, y
además imprime las auditorías concretas que fallan, porque un 96 de
accesibilidad puede esconder un contraste que no cumple.

Estado actual: **perf 94–97 · accesibilidad 100 · buenas prácticas 100 · SEO 100.**

Tres cosas que costaron encontrar y conviene no deshacer:

1. **El sitio público no lee cookies.** `lib/queries/products.ts` usa el cliente
   anónimo a propósito: leer cookies vuelve la página dinámica, anula el ISR y
   —lo peor— saca la metadata fuera de `<head>`, donde Lighthouse y los
   rastreadores simples no la ven. El panel sí usa la sesión, en sus propias
   consultas.
2. **Ninguna superficie con texto encima es translúcida.** Con transparencia el
   color real depende de lo que haya debajo, y el contraste que calcula
   `ambientTokens` deja de valer. Los chips y la barra usan `--ambient-veil`,
   que es opaco.
3. **Un `<a>` es inline: el padding no le da altura.** Los enlaces de la barra
   medían 17 px de alto por mucho `py-2` que llevaran, por debajo del mínimo
   táctil.

Sitemap, `robots.txt`, metadata y Open Graph por prenda, imagen de Open Graph
generada con el color de la prenda, y JSON-LD de `schema.org/Product` con una
oferta por variante.

## Precios

Enteros en COP, sin decimales. Precio final = `price_override ?? base_price`,
la misma regla en `lib/pricing.ts` y en la función `effective_price` de la base.
Se muestran en formato `es-CO` (`$ 89.900`). Si `compare_at_price` supera al
precio final, se tacha y se muestra el porcentaje de descuento.

---

## El sitio público

**Hero ambiental** (`/`). La prenda destacada flota sobre un escenario que
adopta su color, y el fondo entero transiciona con ella. Tres zonas en
escritorio, vertical con swipe en móvil, miniatura de la siguiente prenda en la
esquina, flechas y teclado.

**Catálogo** (`/catalogo`). Dos vistas, y la vista vive en la URL:

- **Perchero** (`?vista=perchero`): las prendas cuelgan de ganchos sobre una
  barra y se deslizan con arrastre, swipe, flechas o teclado. Al moverse se
  balancean desde el gancho.
- **Lista** (`?vista=lista`): buscador, chips circulares de categoría y grilla
  bento donde las destacadas ocupan el doble. Al pasar el cursor —o al primer
  toque en un teléfono— la tarjeta enseña la espalda.

### Cómo está hecho el balanceo del perchero

Embla mueve el carrusel; Framer pone la física. En cada frame se mide la
derivada del progreso de Embla y esa velocidad alimenta un resorte por gancho.
El origen de la transformación está **en el gancho**, así que la prenda gira
desde donde cuelga: es un péndulo, no una rotación decorativa. Al soltar, la
velocidad cae a cero y el resorte se pasa de largo y se asienta solo.

Medir la velocidad del carrusel en vez de la del puntero hace que el balanceo
también aparezca con las flechas, con el teclado y con la inercia después de
soltar, no solo mientras se arrastra. Cada gancho lleva una rigidez ligeramente
distinta según su posición, para que la fila no se mueva en bloque.

### Ficha de prenda

Título, la prenda recortada sobre su color ambiental y una miniatura por vista.
El selector de color cambia la galería **y** el escenario; el de talla
deshabilita de verdad las agotadas (`disabled`, no solo atenuadas) y el precio
sigue a la variante, así que una talla con precio propio se refleja al elegirla.

El zoom usa el gesto nativo de cada plataforma: `touch-action: pinch-zoom` deja
que el teléfono haga el pinch, y en escritorio se acerca hacia donde se hizo
clic. El visor a pantalla completa se recorre con swipe, flechas y Escape.

Abajo, dos píldoras fijas: «Agregar a la bolsa» y «Pedir ahora».

## Bolsa y cierre

La bolsa vive en `localStorage` y acumula **variantes** (prenda + color +
talla), que es la unidad real de compra. Sobrevive a recargas y se sincroniza
entre pestañas.

Todo lo que decide qué se pide y cómo se comunica está en **`lib/checkout.ts`**,
aparte de la interfaz. El panel de la bolsa llama a `checkout()` y abre lo que
le devuelva; no sabe que existe WhatsApp. Conectar una pasarela de pago es
cambiar esa función, sin tocar un componente.

El mensaje lleva cada prenda con su color, su talla, su precio unitario, el
total **y el enlace a la ficha**: quien atiende abre el link y ve exactamente
la misma pieza, sin adivinar por el nombre.

Falta el número: `NEXT_PUBLIC_WHATSAPP_NUMBER`, con indicativo de país y sin
`+`. Sin él, la bolsa funciona y el botón avisa en vez de romperse.

### Total Look

La sección editorial del home: pestañas de colección, tipografía gigante junto
a la prenda, indicador vertical de posición, tallas y precio grande. El
escenario aquí es **de la sección**, no de la página: el hero manda en `:root`
y Total Look aplica los suyos en su propio contenedor.

### Movimiento y accesibilidad

Todo el movimiento sale de `lib/motion.ts`: una sola escala de duraciones y
curvas. Con `prefers-reduced-motion` no hay desplazamiento, ni escala, ni
flotación, ni parallax: solo fundidos.

Dos reglas que hay que respetar al añadir animación, y que ya costaron un bug:

1. Las variantes deben producir **las mismas propiedades** en ambas ramas.
   `useReducedMotion()` devuelve `false` en el servidor y puede devolver `true`
   al hidratar; si una rama tiene `x` y la otra no, React abandona el parcheo.
2. Los bucles decorativos (flotar, balancearse en reposo) van en **CSS**, no en
   `animate` de Framer. Framer serializa el estado de `animate` en el HTML y el
   servidor nunca ve la preferencia del visitante.

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
