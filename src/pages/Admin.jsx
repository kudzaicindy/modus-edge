import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Plus, Save, Trash2, Upload } from "lucide-react";
import {
  adminLogin,
  adminLogout,
  isAdminAuthed,
  readFileAsDataUrl,
  useCatalog,
} from "../catalog";
import { money, shopFilters } from "../data";
import { useTitle } from "../useTitle";

const groups = shopFilters.filter((filter) => filter.id !== "all");

const blank = () => ({
  id: "",
  name: "",
  group: "shirts",
  price: 0,
  compareAt: "",
  stock: "",
  badge: "",
  featured: false,
  hidden: false,
  image: "/images/polo-navy.png",
  blurb: "",
  details: "",
  sizes: "S, M, L, XL, XXL",
});

function toForm(product) {
  return {
    id: product.id,
    name: product.name || "",
    group: product.group || "gifts",
    price: product.price ?? 0,
    compareAt: product.compareAt ?? "",
    stock: product.stock ?? "",
    badge: product.badge || "",
    featured: Boolean(product.featured),
    hidden: Boolean(product.hidden),
    image: product.image || "",
    blurb: product.blurb || "",
    details: product.details || "",
    sizes: (product.sizes || []).join(", "),
    colors: product.colors || [],
  };
}

export default function Admin() {
  useTitle("Admin");
  const navigate = useNavigate();
  const {
    adminProducts,
    upsertProduct,
    deleteProduct,
    setProductImage,
    exportCatalog,
    importCatalog,
    resetCatalog,
    error: catalogError,
    ready,
  } = useCatalog();

  const [authed, setAuthed] = useState(isAdminAuthed);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(blank);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  function flash(message, kind = "ok") {
    setNote(message);
    setToast({ message, kind, at: Date.now() });
  }

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return adminProducts
      .filter((product) => {
        if (!query) return true;
        return `${product.name} ${product.id} ${product.group}`.toLowerCase().includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [adminProducts, q]);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminLogin(password, "admin");
      setAuthed(true);
    } catch (err) {
      setError(err.message || "Wrong password.");
    } finally {
      setBusy(false);
    }
  }

  function select(product) {
    setForm(toForm(product));
    setNote("");
  }

  function startNew() {
    setForm(blank());
    setNote("");
  }

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function save(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      flash("Name is required.", "bad");
      return;
    }
    const wasNew = !form.id;
    setBusy(true);
    try {
      const saved = await upsertProduct({
        ...form,
        compareAt: form.compareAt === "" ? null : Number(form.compareAt),
        stock: form.stock === "" ? null : Number(form.stock),
        badge: form.badge || null,
        sizes: String(form.sizes || "")
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
        colors: form.colors,
      });
      setForm(toForm(saved));
      const stockLabel =
        saved.stock === 0 ? "out of stock" : saved.stock == null ? "stock open" : `${saved.stock} in stock`;
      flash(wasNew ? `Added ${saved.name}.` : `Saved ${saved.name} at ${money(saved.price)} (${stockLabel}).`);
      navigate(`/product/${saved.id}`);
    } catch (err) {
      flash(err.message || "Save failed. Is the API and MongoDB running?", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function onImage(file, colorName) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    if (!form.id) {
      patch("image", dataUrl);
      flash("Picture ready. Hit Save.");
      return;
    }
    setBusy(true);
    try {
      const saved = await setProductImage(form.id, dataUrl, colorName);
      if (saved) {
        setForm(toForm(saved));
        flash(colorName ? `Updated ${saved.name} · ${colorName} picture.` : `Updated ${saved.name} picture.`);
      }
    } catch (err) {
      flash(err.message || "Picture save failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!form.id) return;
    if (!window.confirm(`Hide/remove ${form.name} from the catalogue?`)) return;
    const name = form.name;
    setBusy(true);
    try {
      await deleteProduct(form.id);
      setForm(blank());
      flash(`Removed ${name} from the live catalogue.`);
    } catch (err) {
      flash(err.message || "Delete failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  function onExport() {
    const blob = new Blob([exportCatalog()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modus-edge-catalog.json";
    a.click();
    URL.revokeObjectURL(url);
    flash("Catalogue exported.");
  }

  async function onImport(file) {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      await importCatalog(text);
      setForm(blank());
      flash("Catalogue imported to MongoDB.");
    } catch (err) {
      flash(err.message || "Import failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!window.confirm("Reset all admin changes and restore the original catalogue?")) return;
    setBusy(true);
    try {
      await resetCatalog();
      setForm(blank());
      flash("Catalogue reset to original.");
    } catch (err) {
      flash(err.message || "Reset failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function toggleHidden() {
    const hidden = !form.hidden;
    setBusy(true);
    try {
      const saved = await upsertProduct({
        ...form,
        hidden,
        compareAt: form.compareAt === "" ? null : Number(form.compareAt),
        stock: form.stock === "" ? null : Number(form.stock),
        sizes: String(form.sizes || "")
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
      });
      setForm(toForm(saved));
      flash(hidden ? `Hidden ${saved.name} from shop.` : `Showing ${saved.name} in shop.`);
    } catch (err) {
      flash(err.message || "Update failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <section className="section admin-page">
        <div className="wrap narrow admin-login">
          <p className="eyebrow">Staff</p>
          <h1>Admin</h1>
          <p className="muted">Sign in to change prices, stock, pictures, and visibility. Saves go to MongoDB.</p>
          <form className="admin-login-form" onSubmit={login}>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            {error ? <p className="admin-note bad">{error}</p> : null}
            <button type="submit" className="btn-dark" disabled={busy}>
              {busy ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="admin-root">
      <section className="section admin-page">
        <div className="wrap admin-shell">
          <div className="admin-top">
            <div>
              <p className="eyebrow">Staff</p>
              <h1>Catalogue admin</h1>
              <p className="muted">
                Changes save to MongoDB and show for every visitor. {ready ? "API connected." : "Connecting…"}
                {catalogError ? ` Warning: ${catalogError}` : ""}
                {busy ? " Saving…" : ""}
              </p>
            </div>
            <div className="admin-top-actions">
              <Link to="/shop" className="btn-lime">
                Open shop
              </Link>
              {form.id ? (
                <Link to={`/product/${form.id}`} className="btn-ghost-ink">
                  View product
                </Link>
              ) : null}
              <button type="button" className="btn-ghost-ink" onClick={onExport}>
                Export
              </button>
              <label className="btn-ghost-ink admin-file">
                Import
                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(event) => onImport(event.target.files?.[0])}
                />
              </label>
              <button type="button" className="btn-ghost-ink" onClick={onReset}>
                Reset
              </button>
              <button
                type="button"
                className="btn-ghost-ink"
                onClick={() => {
                  adminLogout();
                  setAuthed(false);
                }}
              >
                Log out
              </button>
            </div>
          </div>

          <div className="admin-grid">
            <aside className="admin-list">
              <div className="admin-list-head">
                <input
                  type="search"
                  placeholder="Search products"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
                <button type="button" className="btn-dark admin-add" onClick={startNew}>
                  <Plus size={16} /> New
                </button>
              </div>
              <div className="admin-rows">
                {list.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className={`admin-row ${form.id === product.id ? "active" : ""} ${product.hidden ? "is-hidden" : ""}`}
                    onClick={() => select(product)}
                  >
                    <img src={product.image} alt="" />
                    <span>
                      <strong>{product.name}</strong>
                      <em>
                        {money(product.price)}
                        {product.stock === 0 ? " · Out" : product.stock != null ? ` · ${product.stock}` : ""}
                        {product.hidden ? " · Hidden" : ""}
                      </em>
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <form className="admin-editor" onSubmit={save}>
              <div className="admin-editor-head">
                <h2>{form.id ? "Edit product" : "New product"}</h2>
                {note ? <p className="admin-note">{note}</p> : null}
              </div>

              <div className="admin-fields">
                <label>
                  Name
                  <input value={form.name} onChange={(event) => patch("name", event.target.value)} required />
                </label>
                <label>
                  Group
                  <select value={form.group} onChange={(event) => patch("group", event.target.value)}>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                    <option value="caps">Caps</option>
                    <option value="bottles">Bottles</option>
                    <option value="desk">Desk</option>
                    <option value="power">Power</option>
                    <option value="towels">Towels</option>
                    <option value="sets">Sets</option>
                  </select>
                </label>
                <label>
                  Price (USD)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => patch("price", event.target.value)}
                  />
                </label>
                <label>
                  Compare at
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAt}
                    onChange={(event) => patch("compareAt", event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Stock
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) => patch("stock", event.target.value)}
                    placeholder="Blank = always available"
                  />
                </label>
                <label>
                  Badge
                  <input
                    value={form.badge}
                    onChange={(event) => patch("badge", event.target.value)}
                    placeholder="Sale, New"
                  />
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => patch("featured", event.target.checked)}
                  />
                  Featured
                </label>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={form.hidden}
                    onChange={(event) => patch("hidden", event.target.checked)}
                  />
                  Hidden from shop
                </label>
                <label className="admin-span">
                  Sizes (comma separated)
                  <input value={form.sizes} onChange={(event) => patch("sizes", event.target.value)} />
                </label>
                <label className="admin-span">
                  Short blurb
                  <textarea rows={2} value={form.blurb} onChange={(event) => patch("blurb", event.target.value)} />
                </label>
                <label className="admin-span">
                  Details
                  <textarea rows={4} value={form.details} onChange={(event) => patch("details", event.target.value)} />
                </label>
              </div>

              <div className="admin-media">
                <div className="admin-media-main">
                  <img src={form.image || "/images/polo-navy.png"} alt="" />
                  <div>
                    <p>Main picture</p>
                    <label className="btn-dark admin-upload">
                      <Upload size={16} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event) => onImage(event.target.files?.[0])}
                      />
                    </label>
                    <input
                      value={form.image}
                      onChange={(event) => patch("image", event.target.value)}
                      placeholder="/images/... or pasted URL"
                    />
                  </div>
                </div>

                {form.colors?.length > 0 ? (
                  <div className="admin-colors">
                    <h3>Colour pictures</h3>
                    {form.colors.map((color) => (
                      <div key={color.name} className="admin-color-row">
                        <img src={color.image || form.image} alt="" />
                        <span>{color.name}</span>
                        <label className="btn-ghost-ink admin-upload">
                          <Upload size={14} /> Replace
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) => onImage(event.target.files?.[0], color.name)}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="admin-actions">
                <button type="submit" className="btn-lime" disabled={busy}>
                  <Save size={16} /> {busy ? "Saving…" : "Save"}
                </button>
                {form.id ? (
                  <>
                    <button type="button" className="btn-ghost-ink" onClick={toggleHidden}>
                      {form.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      {form.hidden ? "Show" : "Hide"}
                    </button>
                    <button type="button" className="btn-ghost-ink danger" onClick={onDelete}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>

      {toast ? (
        <div className={`admin-toast ${toast.kind === "bad" ? "bad" : ""}`} role="status">
          {toast.kind !== "bad" ? <Check size={18} strokeWidth={2.5} /> : null}
          <span>{toast.message}</span>
        </div>
      ) : null}
    </div>
  );
}
