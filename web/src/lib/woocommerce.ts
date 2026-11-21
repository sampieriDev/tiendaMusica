// Lectura del catálogo desde la Store API pública de WooCommerce
// (/wp-json/wc/store/v1). No necesita claves ni plugins extra.
import demoProducts from '../data/demo-products.json';

export interface Image { src: string; thumbnail: string; alt: string }
export interface Category { id: number; name: string; slug: string }
export interface Prices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_minor_unit: number;
}
export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  prices: Prices;
  images: Image[];
  categories: Category[];
  is_in_stock: boolean;
  is_purchasable: boolean;
  on_sale: boolean;
}

const WP_URL = (import.meta.env.WORDPRESS_URL ?? '').replace(/\/$/, '');
export const usingDemoData = !WP_URL;

async function fetchAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const url = `${WP_URL}/wp-json/wc/store/v1/${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WooCommerce respondió ${res.status} en ${url}`);
    items.push(...((await res.json()) as T[]));
    const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? '1');
    if (page >= totalPages) return items;
  }
}

let productsCache: Promise<Product[]> | undefined;

export function getProducts(): Promise<Product[]> {
  productsCache ??= usingDemoData
    ? Promise.resolve(demoProducts as Product[])
    : fetchAll<Product>('products');
  return productsCache;
}

export async function getCategories(): Promise<Category[]> {
  const products = await getProducts();
  const bySlug = new Map<string, Category>();
  for (const p of products) for (const c of p.categories) bySlug.set(c.slug, c);
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function formatPrice(amount: string, prices: Prices): string {
  const value = Number(amount) / 10 ** prices.currency_minor_unit;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: prices.currency_code }).format(value);
}

/** URL del endpoint de WordPress que llena el carrito y redirige al checkout. */
export const checkoutUrl = usingDemoData ? '' : `${WP_URL}/`;
