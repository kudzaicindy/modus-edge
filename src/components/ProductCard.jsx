import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { money } from "../data";
import { useCart } from "../cart";

export default function ProductCard({ product }) {
  const { add } = useCart();

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-media">
        {product.badge && <span className="badge-sale">{product.badge}</span>}
        <img src={product.image} alt={product.name} />
      </Link>
      <div className="card-body">
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="card-foot">
          <p className="price">
            <span className="price-label">Price:</span> {money(product.price)}
            {product.compareAt && <s>{money(product.compareAt)}</s>}
          </p>
          <button
            type="button"
            className="add-btn"
            aria-label={`Add ${product.name} to the list`}
            onClick={() => add(product.id)}
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
