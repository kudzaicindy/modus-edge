import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import ColorPalette from "./ColorPalette";
import { isPaintedColor, labelForGroup, money, swatchIsLight, swatchStyle } from "../data";
import { useCart } from "../cart";

function ShopSwatches({ colors, tone, onChange }) {
  if (!colors.length) return null;
  if (colors.length >= 2) {
    return <ColorPalette options={colors} value={tone} onChange={onChange} showLabel={false} size="sm" />;
  }
  const only = colors[0];
  if (!only?.name || !isPaintedColor(only.name)) return null;
  return (
    <div className="palette palette-sm">
      <div className="palette-dots" role="listbox" aria-label="Colour">
        <span
          className={`swatch on${swatchIsLight(only.name) ? " light" : ""}`}
          style={swatchStyle(only.name)}
          title={only.name}
          aria-label={only.name}
        />
      </div>
    </div>
  );
}

export default function ProductCard({ product, colorName, showPalette = false }) {
  const { add } = useCart();
  const colors = product.colors || [];
  const initial = colors.findIndex((option) => option.name === colorName);
  const [tone, setTone] = useState(initial >= 0 ? initial : 0);
  const chosen = colors[tone];
  const photo = chosen?.image || product.image;
  const href = chosen?.name
    ? `/product/${product.id}?color=${encodeURIComponent(chosen.name)}`
    : `/product/${product.id}`;
  const catalogItem = labelForGroup(product.group);
  const outOfStock = product.stock === 0;

  useEffect(() => {
    setTone(initial >= 0 ? initial : 0);
  }, [product.id, initial]);

  if (showPalette) {
    return (
      <article className={`shop-card${outOfStock ? " is-out" : ""}`}>
        <Link to={href} className="shop-card-media" tabIndex={-1} aria-hidden="true">
          {product.badge ? <span className="shop-card-badge">{product.badge}</span> : null}
          <img src={photo} alt="" />
        </Link>

        <div className="shop-card-body">
          <header className="shop-card-head">
            <p className="shop-card-type">{catalogItem}</p>
            <h3 className="shop-card-name">
              <Link to={href}>{product.name}</Link>
            </h3>
          </header>

          {colors.length > 0 ? (
            <div className="shop-card-colors">
              <ShopSwatches colors={colors} tone={tone} onChange={setTone} />
              {chosen?.name ? <span className="shop-card-tone">{chosen.name}</span> : null}
            </div>
          ) : (
            <div className="shop-card-colors shop-card-colors-empty" aria-hidden="true" />
          )}

          <footer className="shop-card-foot">
            <div className="shop-card-amount">
              <span className="shop-card-price">{money(product.price)}</span>
              {product.compareAt ? <s>{money(product.compareAt)}</s> : null}
              {outOfStock ? <span className="shop-card-stock">Out of stock</span> : null}
            </div>
            <button
              type="button"
              className="shop-card-add"
              aria-label={`Add ${product.name} to the list`}
              disabled={outOfStock}
              onClick={() => add(product.id, 1, chosen?.name, product.sizes?.[0])}
            >
              <Plus size={18} strokeWidth={2.4} />
            </button>
          </footer>
        </div>
      </article>
    );
  }

  return (
    <article className="card">
      <Link to={href} className="card-media">
        {product.badge ? <span className="badge-sale">{product.badge}</span> : null}
        <img src={photo} alt={chosen?.name ? `${product.name}, ${chosen.name}` : product.name} />
      </Link>
      <div className="card-body">
        <p className="card-group">{catalogItem}</p>
        <h3>
          <Link to={href}>{product.name}</Link>
        </h3>
        <div className="card-foot">
          <p className="price">
            {money(product.price)}
            {product.compareAt ? <s>{money(product.compareAt)}</s> : null}
            {outOfStock ? <span className="card-stock">Out</span> : null}
          </p>
          <button
            type="button"
            className="add-btn"
            aria-label={`Add ${product.name} to the list`}
            disabled={outOfStock}
            onClick={() => add(product.id, 1, chosen?.name, product.sizes?.[0])}
          >
            <Plus size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </article>
  );
}
