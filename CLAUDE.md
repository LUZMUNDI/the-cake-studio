# The Cake Studio — Guía de proyecto

Sitio web estático (HTML/CSS/JS puro, sin frameworks) de una home bakery artesanal
venezolano-chilena en Santiago Centro. El objetivo principal es que el cliente vea
los productos y haga pedidos por WhatsApp con el menor roce posible.

## Stack
- HTML estático · CSS único compartido (`styles.css`) · JS único compartido (`script.js`)
- Solo dependencia externa: Google Fonts (Playfair Display + Inter)
- Servidor local de desarrollo: `node serve.mjs` → http://localhost:3000

## Estructura
- `index.html` — Home (hero, imperdibles, categorías, valores, reseñas, CTA)
- `menu.html` — Catálogo completo por categorías + modal de pedido
- `como-pedir.html` — Pasos, formulario inline y FAQ (acordeón)
- `nosotros.html` — Historia del chef, especialidades, identidad venezolana
- `styles.css` / `script.js` — Compartidos por las 4 páginas
- Carpetas de imágenes: `Tortas/ Postres/ Cupcakes/ Brownies/ Galletas/`
  `Muffins Y Magdalenas/ Salado/ About Us/ Videos/ Logo/`

## Reglas de diseño (NO romper)
- **Fondo:** crema cálido `#FFFDF9` (token `--cream`)
- **Acento:** fucsia `#E91E8C` (token `--fuchsia`); hover `--fuchsia-dark #C2156F`
- **Títulos:** Playfair Display (serif), con palabras clave en `<em>` color fucsia
- **Cuerpo:** Inter
- **Formas:** bordes muy redondeados (`--radius` 22px, `--radius-lg` 34px),
  sombras suaves (`--shadow-*`), mucho espacio en blanco
- **Mobile-first y 100% responsive.** Breakpoints principales: 860px y 600px.
- Estética: calidez serif elegante (ref. `Ovenly.webp`) + energía con productos
  flotantes y acentos fucsia (ref. `CakePop.webp`).
- Todos los tokens viven en `:root` dentro de `styles.css`. Reusar tokens, no hardcodear colores.

## Componentes compartidos (copiar igual en cada página nueva)
- Navbar `.nav` con logo de `Logo/Logo White Background.PNG`
- Footer `.footer` (oscuro) con mismo logo, navegación y contacto
- Botón flotante de WhatsApp `.wa-float` (abajo a la derecha, siempre visible)
- Modal de pedido `#orderModal` (en páginas con botones "Pedir este")

## Pedidos por WhatsApp (carrito multi-producto en script.js)
- Formulario único = **carrito** en `como-pedir.html` (`#orderForm`, ancla `#pedir`).
  Filas dinámicas (producto + cantidad + subtotal + ✕), subtotales y total en vivo,
  texto fijo "El delivery se coordina y cobra aparte." y aviso "Precio a confirmar…"
  cuando algún producto es `Consultar`.
- **Catálogo y precios** viven en `CATALOG` dentro de `script.js` (precio en CLP;
  `null` = "Consultar"). `PRODUCTS` es el lookup plano nombre→{price,torta}.
  Los precios mostrados en `menu.html` deben coincidir con `CATALOG`.
- Los botones "Pedir este 🛒" (menú) y "Pedir este" (home) son enlaces
  `como-pedir.html?add=<Nombre exacto del CATALOG>#pedir` que precargan ese producto.
  Nav/hero/CTA "Hacer mi Pedido" enlazan a `como-pedir.html#pedir` (form limpio).
  Ya **no** hay modal ni `data-product`.
- **Mensaje** se envía a `https://wa.me/56926937751?text=...` (el link corto
  `wa.me/message/6TMTI4ZZF26OK1` NO admite `?text=`; solo botón flotante/contacto).
- Delivery muestra "comuna"; Retiro lo oculta. Validación en `buildCartMessage()`.

## Regla 72 h (carrito)
- Si el carrito tiene ≥1 torta (marcada en `CATALOG` con `torta:true`), se activa
  para todo el pedido: `input[type=date]` fija `min = hoy+3d`, fecha en rojo + error
  si es anterior, y el botón "Enviar por WhatsApp" queda **deshabilitado** hasta
  elegir una fecha válida. Se recalcula al agregar/quitar filas. `update()` en script.js.

## Seguridad (`_headers`, Cloudflare Pages)
- `_headers` define X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy, X-XSS-Protection y un **CSP**. El CSP permite Google Fonts
  (`style-src`/`font-src`) y todo lo demás `'self'`. Si agregas un recurso externo,
  actualiza el CSP o se bloqueará. `style-src` incluye `'unsafe-inline'` (hay
  atributos `style=""` en el HTML).

## Nombre de marca
- Marca visible: **TheCakeStudio** (una sola palabra). En navbar/footer se estiliza
  `TheCake<span>Studio</span>` con "Studio" en fucsia. NO cambiar rutas ni nombres de archivo.
- Logo navbar: `Logo/Logo Fuxia Background.PNG`. Logo footer: `Logo/Logo White Background.PNG`.

## Datos de contacto (mantener consistentes)
- WhatsApp: +56 9 2693 7751
- Instagram: @TheCakeStudio.cl
- Direcciones: Argomedo 350, Santiago Centro · Los Olmos 3223, Macul
- Imperdibles (home) ⭐: Chocoquesillo (Sin Gluten), Tres Leches, Pie de Limón
- "Cocoquesillo" se renombró a **Chocoquesillo** en todo el texto visible
  (el archivo `Postres/Cocoquesillo.JPG` mantiene su nombre).

## Regla de anticipación (script.js)
- Las **Tortas** requieren mínimo 72 h (3 días). Botones/opciones de torta llevan
  `data-category="tortas"`; `applyLeadTime()` ajusta `min` del date y muestra el aviso,
  y `collectForm()` valida al enviar. Otras categorías sin restricción.

## Imágenes
- Rutas relativas desde la raíz. Los nombres tienen espacios y acentos; el navegador
  los codifica solo y `serve.mjs` hace `decodeURIComponent`. Mantener `object-fit: cover`.
- Al agregar productos: foto cuadrada, nombre, meta (porciones), descripción breve,
  precio y botón "Pedir este 🛒" con su `data-product`.
