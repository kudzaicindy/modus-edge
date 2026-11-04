import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { findProduct } from "./data";

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
        .map((item) => ({ ...item, product: findProduct(item.id) }))
        .filter((item) => item.product),
    [items]
  );

  const count = detailed.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = detailed.reduce((sum, item) => sum + item.qty * item.product.price, 0);

  function sameLine(item, id, color, size) {
    return item.id === id && (item.color || "") === (color || "") && (item.size || "") === (size || "");
  }

  function add(id, qty = 1, color, size) {
    const nextQty = Math.min(8, qty);
    setItems((prev) => {
      const found = prev.find((item) => sameLine(item, id, color, size));
      if (!found) {
        return [...prev, { id, qty: nextQty, ...(color ? { color } : {}), ...(size ? { size } : {}) }];
      }
      return prev.map((item) =>
        sameLine(item, id, color, size) ? { ...item, qty: Math.min(8, item.qty + qty) } : item
      );
    });
    setToast({ id, qty: nextQty, color: color || "", size: size || "" });
  }

  function update(id, qty, color, size) {
    setItems((prev) => {
      if (qty < 1) return prev.filter((item) => !sameLine(item, id, color, size));
      return prev.map((item) => (sameLine(item, id, color, size) ? { ...item, qty: Math.min(8, qty) } : item));
    });
  }

  function remove(id, color, size) {
    setItems((prev) => prev.filter((item) => !sameLine(item, id, color, size)));
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
