import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { products } from "./data";

const CartContext = createContext(null);
const STORAGE_KEY = "modus-edge-cart";

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(raw)) return [];
    return raw.filter((item) => item && item.id && item.qty > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const detailed = useMemo(
    () =>
      items
        .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
        .filter((item) => item.product),
    [items]
  );

  const count = detailed.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = detailed.reduce((sum, item) => sum + item.qty * item.product.price, 0);

  function add(id, qty = 1) {
    setItems((prev) => {
      const found = prev.find((item) => item.id === id);
      if (!found) return [...prev, { id, qty: Math.min(8, qty) }];
      return prev.map((item) =>
        item.id === id ? { ...item, qty: Math.min(8, item.qty + qty) } : item
      );
    });
    setToast(id);
  }

  function update(id, qty) {
    setItems((prev) => {
      if (qty < 1) return prev.filter((item) => item.id !== id);
      return prev.map((item) => (item.id === id ? { ...item, qty: Math.min(8, qty) } : item));
    });
  }

  function remove(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clear() {
    setItems([]);
  }

  const value = {
    items: detailed,
    count,
    subtotal,
    open,
    setOpen,
    add,
    update,
    remove,
    clear,
    toast,
    setToast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
