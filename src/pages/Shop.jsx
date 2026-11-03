import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { products, shopFilters } from "../data";
import { useTitle } from "../useTitle";

const known = shopFilters.map((filter) => filter.id);

const headings = {
  all: "All products",
  shirts: "Golf t-shirts",
  caps: "Caps",
  bags: "Bags",
  clubs: "Clubs",
  gifts: "Balls and gloves",
};

export default function Shop() {
  useTitle("Shop");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const rawCat = params.get("cat") || "all";
  const cat = known.includes(rawCat) ? rawCat : "all";
  const [draft, setDraft] = useState(q);
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    setDraft(q);
  }, [q]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const catOk = cat === "all" || product.group === cat;
      const blob = `${product.name} ${product.blurb} ${product.group}`.toLowerCase();
      const queryOk = !query || blob.includes(query);
      return catOk && queryOk;
    });
    const sorted = [...filtered];
    if (sort === "low") sorted.sort((a, b) => a.price - b.price);
    if (sort === "high") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [q, cat, sort]);

  function setCat(id) {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("cat");
    else next.set("cat", id);
    setParams(next);
  }

  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const value = draft.trim();
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next);
  }

  function clearSearch() {
    setDraft("");
    setParams({});
  }

  const heading = q ? `Results for “${q}”` : headings[cat];
  const sections = useMemo(() => {
    if (q || sort !== "featured") return [{ title: "", items: list }];
    if (cat === "all") {
      return [
        { title: "Golf t-shirts", items: list.filter((product) => product.group === "shirts") },
        { title: "Caps", items: list.filter((product) => product.group === "caps") },
        { title: "Bags", items: list.filter((product) => product.group === "bags") },
        { title: "Clubs", items: list.filter((product) => product.group === "clubs") },
        { title: "Balls and gloves", items: list.filter((product) => product.group === "gifts") },
      ].filter((block) => block.items.length);
    }
    return [{ title: "", items: list }];
  }, [q, sort, cat, list]);

  return (
    <section className="section">
      <div className="wrap">
        <h1 className="catalogue-title">{heading}</h1>
        <p className="muted">
          {list.length} {list.length === 1 ? "piece" : "pieces"} in the shop.
        </p>
        <div className="shop-tools">
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
          <form className="shop-search" onSubmit={submit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search product"
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

        {list.length === 0 ? (
          <div className="empty">
            <h2>Nothing matches that search.</h2>
            <p className="muted">Try a bag, a club, a cap, or a golf t-shirt.</p>
            <button type="button" className="btn-dark" onClick={clearSearch}>
              Clear search
            </button>
          </div>
        ) : (
          sections.map((block) => (
            <div key={block.title || "list"} className="catalogue-block">
              {block.title && <h2>{block.title}</h2>}
              <div className="grid">
                {block.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
