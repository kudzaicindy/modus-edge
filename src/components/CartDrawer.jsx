import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useCatalog } from "../catalog";
import { money } from "../data";
import { useCart } from "../cart";
import { listMessage, whatsappLinks } from "../order";

function linePhoto(item) {
  return item.product.colors?.find((option) => option.name === item.color)?.image || item.product.image;
}

function CartRow({ item, update, remove }) {
  return (
    <tr className="cart-row">
      <td className="cart-item">
        <img src={linePhoto(item)} alt="" />
        <div>
          <strong>{item.product.name}</strong>
          {item.size ? <span className="muted">Size {item.size}</span> : null}
          {item.branding ? <span className="muted">Custom branding</span> : null}
        </div>
      </td>
      <td className="cart-color">{item.color || "—"}</td>
      <td className="cart-stock">
        <span className="stock-pill">In stock</span>
      </td>
      <td className="cart-qty">
        <div className="stepper">
          <button
            type="button"
            onClick={() => update(item.id, item.qty - 1, item.color, item.size, item.branding)}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span>{item.qty}</span>
          <button
            type="button"
            onClick={() => update(item.id, item.qty + 1, item.color, item.size, item.branding)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="linkish"
          onClick={() => remove(item.id, item.color, item.size, item.branding)}
        >
          Remove
        </button>
      </td>
      <td className="cart-price">{money(item.product.price * item.qty)}</td>
    </tr>
  );
}

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
              <p className="muted">Add a bag, a club, a bottle, a towel, or a golf t-shirt. WhatsApp will send that list to the seller.</p>
              <Link to="/shop" className="btn-lime" onClick={close}>
                Browse the catalogue
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Colour</th>
                    <th>Stock</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <CartRow
                      key={`${item.id}-${item.color || ""}-${item.size || ""}`}
                      item={item}
                      update={update}
                      remove={remove}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
            {whatsappLinks(message).map((line) => (
              <a
                key={line.id}
                className="btn-lime"
                href={line.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Send list on WhatsApp ${line.display}`}
              >
                Send list on WhatsApp
              </a>
            ))}
            <p className="muted">The message already lists these pieces and the seller's prices. The seller confirms the order.</p>
          </div>
        )}
      </aside>
    </>
  );
}

export function Toast() {
  const { toast, setToast, setOpen, open } = useCart();
  const { findProduct } = useCatalog();
  if (!toast || open) return null;
  const product = findProduct(toast.id || toast);
  if (!product) return null;
  const color = toast.color || "";
  const photo = product.colors?.find((option) => option.name === color)?.image || product.image;
  const qty = toast.qty || 1;

  return (
    <div className="toast toast-row" role="status">
      <img src={photo} alt="" />
      <div className="toast-copy">
        <strong>{product.name}</strong>
        <span>
          {color ? `${color} · ` : ""}
          <em className="stock-inline">In stock</em>
          {` · ×${qty}`}
        </span>
      </div>
      <span className="toast-price">{money(product.price * qty)}</span>
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
