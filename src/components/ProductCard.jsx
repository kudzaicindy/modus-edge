import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import ColorPalette from "./ColorPalette";
import { labelForGroup, money } from "../data";
import { useCart } from "../cart";

export default function ProductCard({ product, colorName }) {
  const { add } = useCart();
  const colors = product.colors || [];
  const locked = colors.findIndex((option) => option.name === colorName);
  const [tone, setTone] = useState(locked >= 0 ? locked : 0);
  const chosen = colors[tone];
  const photo = chosen?.image || product.image;
  const href = chosen?.name
    ? `/product/${product.id}?color=${encodeURIComponent(chosen.name)}`
    : `/product/${product.id}`;

  useEffect(() => {
    setTone(locked >= 0 ? locked : 0);
  }, [product.id, locked]);

  return (
    <article className="card">
      <Link to={href} className="card-media">
        {product.badge && <span className="badge-sale">{product.badge}</span>}
        <img src={photo} alt={chosen?.name ? `${product.name}, ${chosen.name}` : product.name} />
      </Link>
      <div className="card-body">
        <p className="card-group">{chosen?.name || labelForGroup(product.group)}</p>
        <h3>
          <Link to={href}>{product.name}</Link>
        </h3>
        {locked < 0 && (
          <ColorPalette options={colors} value={tone} onChange={setTone} showLabel={false} size="sm" />
        )}
        <div className="card-foot">
          <p className="price">
            {money(product.price)}
            {product.compareAt && <s>{money(product.compareAt)}</s>}
            {product.stock === 0 && <span className="card-stock">Out</span>}
          </p>
          <button
            type="button"
            className="add-btn"
            aria-label={`Add ${product.name} to the list`}
            disabled={product.stock === 0}
            onClick={() => add(product.id, 1, chosen?.name, product.sizes?.[0])}
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
