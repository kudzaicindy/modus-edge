import { useState } from "react";
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

export default function ProductCard({ product, colorName, showPalette = false, compact = false }) {
  const { add } = useCart();
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const start = Math.max(
    0,
    colors.findIndex((option) => option.name === colorName)
  );
  const [tone, setTone] = useState(start);
  const [activeId, setActiveId] = useState(product.id);

  // Keep local colour selection when browsing; only jump when the product changes.
  if (product.id !== activeId) {
    setActiveId(product.id);
    setTone(start);
  }

  const safeTone = Math.min(tone, Math.max(colors.length - 1, 0));
  const chosen = colors[safeTone];
  const photo = chosen?.image || product.image;
  const href = chosen?.name
    ? `/product/${product.id}?color=${encodeURIComponent(chosen.name)}`
    : `/product/${product.id}`;
  const catalogItem = labelForGroup(product.group);
  const outOfStock = product.stock === 0;
  const useShopCard = showPalette || compact;
  const previewColors = colors.filter((option) => option?.name && isPaintedColor(option.name)).slice(0, 5);

  function pickTone(index) {
    setTone(index);
  }

  if (useShopCard) {
    return (
      <article className={`shop-card${compact ? " shop-card-compact" : ""}${outOfStock ? " is-out" : ""}`}>
        <Link to={href} className="shop-card-media" aria-label={product.name}>
          {product.badge ? <span className="shop-card-badge">{product.badge}</span> : null}
          <span className="shop-card-stage">
            <img
              key={`${product.id}-${photo}-${safeTone}`}
              src={photo}
              alt={chosen?.name ? `${product.name}, ${chosen.name}` : product.name}
            />
          </span>
        </Link>

        <div className="shop-card-body">
          <p className="shop-card-type">{catalogItem}</p>
          <h3 className="shop-card-name">
            <Link to={href}>{product.name}</Link>
          </h3>

          {showPalette && colors.length > 0 ? (
            <div className="shop-card-colors">
              <ShopSwatches colors={colors} tone={safeTone} onChange={pickTone} />
              {chosen?.name ? <span className="shop-card-tone">{chosen.name}</span> : null}
            </div>
          ) : null}

          {compact && previewColors.length > 0 ? (
            <div className="shop-card-dots" aria-label="Available colours">
              {previewColors.map((option) => (
                <span
                  key={option.name}
                  className={`dot${swatchIsLight(option.name) ? " light" : ""}`}
                  style={swatchStyle(option.name)}
                  title={option.name}
                />
              ))}
              {colors.length > previewColors.length ? (
                <span className="shop-card-more">+{colors.length - previewColors.length}</span>
              ) : null}
            </div>
          ) : null}

          <div className="shop-card-foot">
            <div className="shop-card-amount">
              <strong className="shop-card-price">{money(product.price)}</strong>
              {product.compareAt ? <s>{money(product.compareAt)}</s> : null}
              {outOfStock ? <span className="shop-card-stock">Out</span> : null}
            </div>
            <button
              type="button"
              className="shop-card-add"
              aria-label={`Add ${product.name}`}
              disabled={outOfStock}
              onClick={() => add(product.id, 1, chosen?.name, product.sizes?.[0])}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card">
      <Link to={href} className="card-media">
        {product.badge ? <span className="badge-sale">{product.badge}</span> : null}
        <img key={photo} src={photo} alt={chosen?.name ? `${product.name}, ${chosen.name}` : product.name} />
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
