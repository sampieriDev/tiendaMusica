#!/bin/sh
# Instala WordPress y WooCommerce en el entorno local (solo la primera vez).
set -e
if ! wp core is-installed 2>/dev/null; then
  wp core install --url=http://localhost:8080 --title="Tienda de Música" \
    --admin_user=admin --admin_password=admin --admin_email=admin@example.com --skip-email
fi
wp language core install es_MX --activate || true
wp rewrite structure '/%postname%/' --hard
wp plugin install woocommerce --activate
wp option update woocommerce_currency MXN
wp option update woocommerce_default_country MX
echo "Listo: http://localhost:8080/wp-admin (admin / admin)"
