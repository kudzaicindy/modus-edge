import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { money, products } from "../data";
import { useCart } from "../cart";
import { listMessage, whatsappHref } from "../order";

export function CartDrawer() {
  const { items, subtotal, open, setOpen, update, remove } = useCart();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;

  function close() {
    setOpen(false);
  }

  const message = listMessage(items, name);

  return (
    <>
      <button type="button" className="overlay" aria-label="Close bag" onClick={close} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title">
        <div className="drawer-head">
          <h2 id="bag-title">Your list</h2>
          <button type="button" className="icon-btn dark" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          {items.length === 0 && (
            <div className="empty">
              <h3>Your list is empty.</h3>
              <p className="muted">Add a shirt, a cap, or a gift. WhatsApp will send that list to the seller.</p>
              <Link to="/shop" className="btn-lime" onClick={close}>
                Browse the catalogue
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <ul className="lines">
              {items.map((item) => (
                <li key={item.id} className="line">
                  <img src={item.product.image} alt="" />
                  <div>
                    <strong>{item.product.name}</strong>
                    <p className="muted">{money(item.product.price)}</p>
                    <div className="line-actions">
                      <div className="stepper">
                        <button type="button" onClick={() => update(item.id, item.qty - 1)} aria-label="Decrease quantity">
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button type="button" onClick={() => update(item.id, item.qty + 1)} aria-label="Increase quantity">
                          +
                        </button>
                      </div>
                      <button type="button" className="linkish" onClick={() => remove(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="totals">
              <strong>Catalogue total</strong>
              <strong>{money(subtotal)}</strong>
            </div>
            <label className="field">
              Your name
              <input
                value={name}
                autoComplete="name"
                placeholder="So the seller knows who is writing"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <a className="btn-lime" href={whatsappHref(message)} target="_blank" rel="noreferrer">
              Send list on WhatsApp
            </a>
            <p className="muted">The message already lists these pieces and the seller's prices. The seller confirms the order.</p>
          </div>
        )}
      </aside>
    </>
  );
}

export function Toast() {
  const { toast, setToast, setOpen, open } = useCart();
  if (!toast || open) return null;
  const product = products.find((item) => item.id === toast);
  if (!product) return null;
  return (
    <div className="toast" role="status">
      <span>Added {product.name} to your list</span>
      <button
        type="button"
        onClick={() => {
          setToast(null);
          setOpen(true);
        }}
      >
        View list
      </button>
    </div>
  );
}
