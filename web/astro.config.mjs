// @ts-check
import { defineConfig } from 'astro/config';

// Sitio estático: el catálogo se genera al compilar leyendo WooCommerce.
// Cuando cambie un producto en WordPress, un webhook vuelve a compilar el sitio.
export default defineConfig({
  output: 'static',
});
