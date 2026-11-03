import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, MessageCircle, ShieldCheck } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { money, products } from "../data";
import { useCart } from "../cart";
import { useTitle } from "../useTitle";

export default function Product() {
  const { id } = useParams();
  const product = products.find((item) => item.id === id);
  useTitle(product ? product.name : "Product");
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <section className="section">
        <div className="wrap narrow empty">
          <h1>That club isn't on the rack.</h1>
          <Link to="/shop" className="btn-lime">
            Back to the shop
          </Link>
        </div>
      </section>
    );
  }

  const same = products.filter((item) => item.group === product.group && item.id !== product.id);
  const extra = products.filter((item) => item.group !== product.group);
  const related = [...same, ...extra].slice(0, 3);

  return (
    <section className="section">
      <div className="wrap">
        <p className="crumb">
          <Link to="/shop">Shop</Link>
          <span> / </span>
          {product.name}
        </p>
        <div className="product-layout">
          <div className="gallery">
            {product.badge && <span className="badge-sale">{product.badge}</span>}
            <img src={product.image} alt={product.name} />
          </div>
          <div className="product-copy">
            <p className="eyebrow">{product.group}</p>
            <h1>{product.name}</h1>
            <p className="product-price">
              {money(product.price)}
              {product.compareAt && <s>{money(product.compareAt)}</s>}
            </p>
            <p className="lede">{product.blurb}</p>
            <p>{product.details}</p>
            <ul className="ticks">
              {product.highlights.map((item) => (
                <li key={item}>
                  <Check size={16} /> {item}
                </li>
              ))}
            </ul>
            <div className="buy-row">
              <div className="stepper">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">
                  −
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty((value) => Math.min(8, value + 1))} aria-label="Increase quantity">
                  +
                </button>
              </div>
              <button type="button" className="btn-lime" onClick={() => add(product.id, qty)}>
                Add to list
              </button>
            </div>
            <p className="muted">The seller's catalogue price. Send the list on WhatsApp and the seller confirms it.</p>
            <dl className="specs">
              {product.specs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="trust">
              <div>
                <MessageCircle size={18} />
                List goes to the seller on WhatsApp
              </div>
              <div>
                <ShieldCheck size={18} />
                Price is the one on this catalogue
              </div>
            </div>
          </div>
        </div>

        <div className="section-head related-head">
          <h2>Also in the bag</h2>
        </div>
        <div className="grid">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
