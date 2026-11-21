<?php
/**
 * Plugin Name: Tienda headless
 * Description: Puente entre el front en Astro y WooCommerce: recibe el carrito y abre el checkout,
 *              y avisa al hosting del front para recompilar cuando cambia un producto.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Carrito desde Astro: /?tienda_checkout=ID:CANT,ID:CANT
 * Vacía el carrito de WooCommerce, agrega los productos y redirige al checkout.
 */
add_action('template_redirect', function () {
    if (empty($_GET['tienda_checkout']) || !function_exists('WC')) {
        return;
    }

    $raw = sanitize_text_field(wp_unslash($_GET['tienda_checkout']));
    WC()->cart->empty_cart();

    foreach (array_slice(explode(',', $raw), 0, 100) as $pair) {
        [$id, $qty] = array_pad(array_map('absint', explode(':', $pair, 2)), 2, 1);
        if ($id > 0 && $qty > 0) {
            WC()->cart->add_to_cart($id, min($qty, 999));
        }
    }

    wp_safe_redirect(wc_get_checkout_url());
    exit;
});

/**
 * Recompilar el front al guardar o borrar productos.
 * Define en wp-config.php la URL del "deploy hook" del hosting (Vercel, Netlify, etc.):
 *   define('TIENDA_DEPLOY_HOOK', 'https://api.vercel.com/v1/integrations/deploy/...');
 */
function tienda_disparar_deploy() {
    if (!defined('TIENDA_DEPLOY_HOOK') || !TIENDA_DEPLOY_HOOK) {
        return;
    }
    // Evita varios deploys seguidos al guardar en lote.
    if (get_transient('tienda_deploy_pendiente')) {
        return;
    }
    set_transient('tienda_deploy_pendiente', 1, 60);
    wp_remote_post(TIENDA_DEPLOY_HOOK, ['blocking' => false, 'timeout' => 5]);
}
add_action('woocommerce_update_product', 'tienda_disparar_deploy');
add_action('woocommerce_new_product', 'tienda_disparar_deploy');
add_action('before_delete_post', function ($post_id) {
    if (get_post_type($post_id) === 'product') {
        tienda_disparar_deploy();
    }
});
