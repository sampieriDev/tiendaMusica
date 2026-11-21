// Carrito del lado del cliente, guardado en localStorage.
// Al pagar, se manda a WordPress, que llena el carrito de WooCommerce y abre su checkout.
export interface CartItem {
  id: number; name: string; slug: string;
  price: string; currency: string; minorUnit: number; qty: number;
}

const KEY = 'tienda-carrito';
const listeners = new Set<(items: CartItem[]) => void>();

export function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

function save(items: CartItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* sin almacenamiento */ }
  listeners.forEach((fn) => fn(items));
}

export function onCartChange(fn: (items: CartItem[]) => void) {
  listeners.add(fn);
  fn(getCart());
}

export function addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
  const items = getCart();
  const found = items.find((i) => i.id === item.id);
  if (found) found.qty += qty; else items.push({ ...item, qty });
  save(items);
}

export function setQty(id: number, qty: number) {
  save(getCart().map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0));
}

export function clearCart() { save([]); }

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);

export function formatMoney(minor: number, currency: string, minorUnit: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(minor / 10 ** minorUnit);
}

/** Arma la URL que entiende el plugin tienda-headless de WordPress: ?tienda_checkout=ID:CANT,ID:CANT */
export function buildCheckoutUrl(base: string, items: CartItem[]) {
  const param = items.map((i) => `${i.id}:${i.qty}`).join(',');
  return `${base}?tienda_checkout=${encodeURIComponent(param)}`;
}

window.addEventListener('storage', (e) => { if (e.key === KEY) listeners.forEach((fn) => fn(getCart())); });
