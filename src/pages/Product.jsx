import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ColorPalette from "../components/ColorPalette";
import ProductCard from "../components/ProductCard";
import { findProduct, groupsFor, labelForGroup, money, products, resolveCat } from "../data";
import { useCart } from "../cart";
import { useTitle } from "../useTitle";

const LINEUP_RE = /lineup|handle-colors|label-group|women-colors|women-grid/i;

export default function Product() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const colorQuery = params.get("color") || "";
  const product = findProduct(id);
  const aliasColor = { navy: "Navy", crew: "Pink" }[id] || "";
  useTitle(product ? product.name : "Product");
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(0);

  const thumbs = useMemo(() => {
    if (!product) return [];
    return [
      ...new Set(
        [
          ...(product.colors || []).map((option) => option.image),
          ...(product.images || []),
          product.image,
        ].filter((src) => src && !LINEUP_RE.test(src))
      ),
    ];
  }, [product]);

  useEffect(() => {
    setQty(1);
    setSize(0);
    const want = colorQuery || aliasColor;
    const at = product?.colors?.findIndex((option) => option.name === want);
    const index = at >= 0 ? at : 0;
    setColor(index);
    const next = product?.colors?.[index]?.image || product?.image;
    const shotAt = next ? thumbs.indexOf(next) : 0;
    setShot(shotAt >= 0 ? shotAt : 0);
  }, [id, colorQuery, product, aliasColor, thumbs]);

  if (!product) {
    return (
      <section className="section product-page">
        <div className="wrap narrow empty">
          <h1>That piece is not in stock.</h1>
          <Link to="/shop" className="btn-lime">
            Back to the shop
          </Link>
        </div>
      </section>
    );
  }

  const bucket = groupsFor(resolveCat(product.group)) || [product.group];
  const same = products.filter((item) => bucket.includes(item.group) && item.id !== product.id);
  const extra = products.filter((item) => !bucket.includes(item.group));
  const related = [...same, ...extra].slice(0, 4);
  const chosen = product.colors?.[color];
  const cat = resolveCat(product.group);
  const photo = thumbs[shot] || chosen?.image || product.image;
  const facts = (product.specs || []).slice(0, 4);
  const colourCount = product.colors?.length || 0;

  function pickColor(index) {
    setColor(index);
    const next = product.colors?.[index]?.image;
    const at = next ? thumbs.indexOf(next) : -1;
    setShot(at >= 0 ? at : 0);
  }

  function pickShot(index) {
    setShot(index);
    const match = product.colors?.findIndex((option) => option.image === thumbs[index]);
    if (match >= 0) setColor(match);
  }

  return (
    <section className="section product-page">
      <div className="wrap">
        <p className="crumb">
          <Link to="/shop">Shop</Link>
          <span aria-hidden="true"> / </span>
          <Link to={`/shop?cat=${cat}`}>{labelForGroup(product.group)}</Link>
          <span aria-hidden="true"> / </span>
          <span>{product.name}</span>
        </p>

        <div className="product-layout">
          <div className="gallery-stack">
            <div className="gallery">
              {product.badge && <span className="badge-sale">{product.badge}</span>}
              <img
                key={photo}
                src={photo}
                alt={`${product.name}${chosen?.name ? `, ${chosen.name}` : ""}`}
              />
            </div>
            {thumbs.length > 1 && (
              <div className="gallery-thumbs" role="tablist" aria-label="Product photos">
                {thumbs.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    className={src === photo ? "on" : undefined}
                    aria-label={`Photo ${index + 1}`}
                    aria-selected={src === photo}
                    onClick={() => pickShot(index)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-copy">
            <div className="product-intro">
              <p className="eyebrow">{labelForGroup(product.group)}</p>
              <h1>{product.name}</h1>
              <p className="product-price">
                {money(product.price)}
                {product.compareAt && <s>{money(product.compareAt)}</s>}
              </p>
              <p className="stock-line">
                <span className="stock-pill">In stock</span>
                {colourCount > 0 && (
                  <span className="muted">
                    {colourCount} colour{colourCount === 1 ? "" : "s"}
                    {chosen?.name ? ` · viewing ${chosen.name}` : ""}
                  </span>
                )}
              </p>
            </div>

            {product.colors?.length > 1 && (
              <div className="product-option">
                <ColorPalette options={product.colors} value={color} onChange={pickColor} />
              </div>
            )}

            {product.colors?.length === 1 && (
              <div className="product-option">
                <p className="option-label">
                  Colour <strong>{product.colors[0].name}</strong>
                </p>
              </div>
            )}

            {product.sizes?.length > 0 && (
              <div className="product-option">
                <p className="option-label">
                  Size <strong>{product.sizes[size]}</strong>
                </p>
                <div className="size-row" role="listbox" aria-label="Size">
                  {product.sizes.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      className={index === size ? "size-chip on" : "size-chip"}
                      aria-selected={index === size}
                      onClick={() => setSize(index)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="buy-panel">
              <div className="buy-row">
                <div className="stepper" aria-label="Quantity">
                  <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">
                    −
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty((value) => Math.min(8, value + 1))} aria-label="Increase quantity">
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-lime"
                  onClick={() => add(product.id, qty, chosen?.name, product.sizes?.[size])}
                >
                  Add to cart
                </button>
              </div>
              <p className="buy-note">MOQ 20 · Branding on request · Confirm on WhatsApp</p>
            </div>

            {facts.length > 0 && (
              <dl className="product-facts">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <>
            <div className="section-head related-head">
              <p className="eyebrow">Also in stock</p>
              <h2>More from the catalogue</h2>
            </div>
            <div className="grid product-related">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
