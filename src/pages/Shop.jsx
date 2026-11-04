import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCatalog } from "../catalog";
import { groupsFor, isPaintedColor, resolveCat, shopFilters, swatchIsLight, swatchStyle } from "../data";
import { useTitle } from "../useTitle";

const sections = shopFilters.filter((filter) => filter.id !== "all");

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
  const { products, revision } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const cat = resolveCat(searchParams.get("cat") || "all");
  const color = searchParams.get("color") || "";
  const [draft, setDraft] = useState(q);
  const [sort, setSort] = useState("featured");
  const inLine = cat !== "all";

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
    if (!inLine && !color) {
      return list.map((product) => ({ product, colorName: "" }));
    }
    const out = [];
    list.forEach((product) => {
      ways(product).forEach((option) => {
        if (!matchesColor(option.name, color)) return;
        out.push({ product, colorName: option.name || "" });
      });
    });
    return out;
  }, [list, inLine, color]);

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

  function clearSearch() {
    setDraft("");
    setSearchParams(inLine ? { cat } : {});
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
  }, [q, sort, cat, inLine, color, tiles]);

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
          {inLine && colorOptions.length > 0 && (
            <div className="chips color-chips" role="tablist" aria-label="Colour">
              <button type="button" className={!color ? "chip on" : "chip"} onClick={() => setColor("")}>
                All colours
              </button>
              {colorOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={color === name ? "chip on chip-tone" : "chip chip-tone"}
                  onClick={() => setColor(name)}
                >
                  <span className={`swatch${swatchIsLight(name) ? " light" : ""}`} style={swatchStyle(name)} />
                  {name}
                </button>
              ))}
            </div>
          )}
          <div className="chips" role="tablist" aria-label="Categories">
            {shopFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={filter.id === cat ? "chip on" : "chip"}
                onClick={() => setCat(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="shop-find">
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
            <label className="sort-label">
              <span className="sr-only">Sort</span>
              <select className="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="low">Price, low to high</option>
                <option value="high">Price, high to low</option>
              </select>
            </label>
          </div>
        </div>

        {tiles.length === 0 ? (
          <div className="empty">
            <h2>{color ? `Nothing in ${color}.` : "Nothing in that search."}</h2>
            <p className="muted">{color ? "Pick another colour, or show all colours." : "Try another line, or clear it."}</p>
            <button type="button" className="btn-dark" onClick={() => (color ? setColor("") : clearSearch())}>
              {color ? "All colours" : "Clear search"}
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
                    key={`${tile.product.id}-${tile.colorName || "all"}-${tile.product.price}-${tile.product.stock ?? "x"}-${revision}`}
                    product={tile.product}
                    colorName={tile.colorName}
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
