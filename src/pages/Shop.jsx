import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useCatalog } from "../catalog";
import { groupsFor, isPaintedColor, resolveCat, shopFilters as seedShopFilters } from "../data";
import { useTitle } from "../useTitle";

function ways(product) {
  return product.colors?.length ? product.colors : [{ name: "", image: product.image }];
}

function matchesColor(optionName, filter) {
  if (!filter) return true;
  const name = (optionName || "").toLowerCase();
  const want = filter.toLowerCase();
  if (name === want) return true;
  return name.split("/").some((part) => part.trim() === want);
}

export default function Shop() {
  useTitle("Shop");
  const { products, revision, shopFilters: liveFilters } = useCatalog();
  const shopFilters = liveFilters?.length ? liveFilters : seedShopFilters;
  const sections = useMemo(() => shopFilters.filter((filter) => filter.id !== "all"), [shopFilters]);
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const cat = resolveCat(searchParams.get("cat") || "all");
  const color = searchParams.get("color") || "";
  const [draft, setDraft] = useState(q);
  const [sort, setSort] = useState("featured");
  const inLine = cat !== "all";
  const hasFilters = inLine || Boolean(color) || Boolean(q.trim());

  useEffect(() => {
    setDraft(q);
  }, [q]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const groups = groupsFor(cat);
    const filtered = products.filter((product) => {
      const catOk = cat === "all" || groups.includes(product.group);
      const blob = `${product.name} ${product.group}`.toLowerCase();
      const queryOk = !query || blob.includes(query);
      return catOk && queryOk;
    });
    const sorted = [...filtered];
    if (sort === "featured") {
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }
    if (sort === "low") sorted.sort((a, b) => a.price - b.price);
    if (sort === "high") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [products, revision, q, cat, sort]);

  const colorOptions = useMemo(() => {
    const names = new Set();
    list.forEach((product) => {
      ways(product).forEach((option) => {
        if (option.name && isPaintedColor(option.name)) names.add(option.name);
      });
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [list]);

  const tiles = useMemo(() => {
    return list
      .map((product) => {
        if (!color) return { product, colorName: "" };
        const match = ways(product).find((option) => matchesColor(option.name, color));
        if (!match) return null;
        // Seed the card on the filtered colour; palette still lets shoppers pick any colour.
        return { product, colorName: match.name || "" };
      })
      .filter(Boolean);
  }, [list, color]);

  function setCat(id) {
    const next = new URLSearchParams(searchParams);
    next.delete("color");
    if (id === "all") next.delete("cat");
    else next.set("cat", id);
    setSearchParams(next);
  }

  function setColor(name) {
    const next = new URLSearchParams(searchParams);
    if (!name) next.delete("color");
    else next.set("color", name);
    setSearchParams(next);
  }

  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const value = draft.trim();
    if (value) next.set("q", value);
    else next.delete("q");
    setSearchParams(next);
  }

  function clearFilters() {
    setDraft("");
    setSort("featured");
    setSearchParams({});
  }

  const heading = q ? `Results for “${q}”` : shopFilters.find((filter) => filter.id === cat)?.label || "Shop";
  const blocks = useMemo(() => {
    if (inLine || q || color || sort !== "featured") {
      return [{ title: "", items: tiles }];
    }
    return sections
      .map((filter) => ({
        id: filter.id,
        title: filter.label,
        items: tiles.filter((tile) => groupsFor(filter.id).includes(tile.product.group)),
      }))
      .filter((block) => block.items.length);
  }, [q, sort, cat, inLine, color, tiles, sections]);

  return (
    <section className="shop-page">
      <div className="wrap">
        <header className="shop-top">
          <div>
            <p className="store-kicker">{inLine ? "Line" : "In stock"}</p>
            <h1>{heading === "All" ? "Shop" : heading}</h1>
          </div>
          <p className="shop-count">{tiles.length} pieces</p>
        </header>

        <div className="shop-tools">
          <div className="shop-filter-row">
            <label className="shop-filter-field">
              <span className="shop-filter-title">Category</span>
              <select
                className="shop-select"
                value={cat}
                aria-label="Category"
                onChange={(event) => setCat(event.target.value)}
              >
                {shopFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            {colorOptions.length > 0 ? (
              <label className="shop-filter-field">
                <span className="shop-filter-title">Colour</span>
                <select
                  className="shop-select"
                  value={color}
                  aria-label="Colour"
                  onChange={(event) => setColor(event.target.value)}
                >
                  <option value="">All colours</option>
                  {colorOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="shop-filter-field">
              <span className="shop-filter-title">Sort</span>
              <select className="shop-select" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="low">Price, low to high</option>
                <option value="high">Price, high to low</option>
              </select>
            </label>

            <form className="shop-search" onSubmit={submit}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Search"
                aria-label="Search product"
              />
              <button type="submit" className="btn-dark">
                Search
              </button>
            </form>

            {hasFilters ? (
              <button type="button" className="shop-clear" onClick={clearFilters}>
                <X size={14} strokeWidth={2.4} aria-hidden="true" />
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {tiles.length === 0 ? (
          <div className="empty">
            <h2>{color ? `Nothing in ${color}.` : "Nothing in that search."}</h2>
            <p className="muted">{color ? "Pick another colour, or show all colours." : "Try another line, or clear it."}</p>
            <button type="button" className="btn-dark" onClick={() => (color ? setColor("") : clearFilters())}>
              {color ? "All colours" : "Clear filters"}
            </button>
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.title || "list"} className="catalogue-block">
              {block.title && (
                <div className="catalogue-head">
                  <h2>
                    <Link to={`/shop?cat=${block.id}`}>{block.title}</Link>
                  </h2>
                  <span>{block.items.length}</span>
                </div>
              )}
              <div className="grid" key={`grid-${revision}-${block.title || "list"}`}>
                {block.items.map((tile) => (
                  <ProductCard
                    key={`${tile.product.id}-${tile.product.price}-${tile.product.stock ?? "x"}-${revision}`}
                    product={tile.product}
                    colorName={tile.colorName}
                    showPalette
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
