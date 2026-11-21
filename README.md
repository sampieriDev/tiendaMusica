# tiendamusica

Tienda en línea con **Astro** (front) y **WordPress + WooCommerce** como CMS headless.

```
web/         Front en Astro (sitio estático)
wordpress/   Entorno local de WordPress + WooCommerce y el plugin puente
```

## Cómo funciona

1. **Catálogo**: al compilar, Astro lee productos y categorías de la Store API pública de
   WooCommerce (`/wp-json/wc/store/v1/products`). No hace falta ninguna clave ni plugin extra.
2. **Carrito**: vive en el navegador (`localStorage`), así el sitio sigue siendo estático y rápido.
3. **Pago**: el botón "Pagar" manda el carrito a WordPress (`/?tienda_checkout=ID:CANT,...`).
   El plugin `wordpress/mu-plugins/tienda-headless.php` llena el carrito de WooCommerce y
   redirige a su checkout, donde se cobra con la pasarela que configures en WooCommerce.
4. **Actualizaciones**: al guardar o borrar un producto, el mismo plugin llama al "deploy hook"
   del hosting (constante `TIENDA_DEPLOY_HOOK` en `wp-config.php`) para recompilar el sitio.

## Desarrollo local

### WordPress (requiere Docker)

```sh
cd wordpress
docker compose up -d
docker compose run --rm wpcli sh /setup.sh
```

Panel: http://localhost:8080/wp-admin (usuario `admin`, contraseña `admin`). Agrega unos productos
en WooCommerce y configura una pasarela de pago en WooCommerce → Ajustes → Pagos.

### Astro

```sh
cd web
cp .env.example .env    # WORDPRESS_URL=http://localhost:8080
npm install
npm run dev             # http://localhost:4321
```

Si `WORDPRESS_URL` está vacía, el sitio usa los productos de ejemplo de
`web/src/data/demo-products.json`, útil para trabajar el diseño sin WordPress.

## Producción

- **Front**: cualquier hosting estático (Vercel, Netlify, Cloudflare Pages). Comando `npm run build`,
  carpeta `web/dist`, variable `WORDPRESS_URL` con la URL pública de WordPress.
- **WordPress**: hosting PHP con WooCommerce activo y el archivo `tienda-headless.php` copiado en
  `wp-content/mu-plugins/`. Usa HTTPS, porque el checkout se hace ahí.
