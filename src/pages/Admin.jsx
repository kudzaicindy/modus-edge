import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  adminLogin,
  adminLogout,
  isAdminAuthed,
  readFileAsDataUrl,
  useCatalog,
} from "../catalog";
import ImageCropModal from "../components/ImageCropModal";
import { groupsFor, labelForGroup, money, shopFilters, titleCaseGroup } from "../data";
import { useTitle } from "../useTitle";
import "./Admin.css";

const legacyGroups = [
  { id: "caps", label: "Caps" },
  { id: "bottles", label: "Bottles" },
  { id: "sets", label: "Gift sets" },
  { id: "towels", label: "Towels" },
  { id: "power", label: "Power (legacy)" },
  { id: "gifts", label: "Gifts (legacy)" },
];

const blank = () => ({
  id: "",
  name: "",
  group: "shirts",
  groupLabel: "",
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
  colors: [],
});

function slugGroup(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toForm(product) {
  return {
    id: product.id,
    name: product.name || "",
    group: product.group || "gifts",
    groupLabel: labelForGroup(product.group || "gifts"),
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

function statusOf(product) {
  if (product.hidden) return "hidden";
  if (product.stock === 0) return "out";
  return "live";
}

function Field({ label, children }) {
  return (
    <div className="pd-field">
      <div className="pd-label">{label}</div>
      {children}
    </div>
  );
}

export default function Admin() {
  useTitle("Admin");
  const {
    adminProducts,
    categories,
    shopFilters: liveShopFilters,
    upsertProduct,
    deleteProduct,
    setProductImage,
    exportCatalog,
    importCatalog,
    resetCatalog,
    error: catalogError,
  } = useCatalog();

  const lineFilters = useMemo(
    () => (liveShopFilters || shopFilters).filter((filter) => filter.id !== "all"),
    [liveShopFilters]
  );

  const [authed, setAuthed] = useState(isAdminAuthed);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(blank);
  const [customGroup, setCustomGroup] = useState(false);
  const [colorDraft, setColorDraft] = useState("");
  const [cropper, setCropper] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const groupOptions = useMemo(() => {
    const fromCatalog = (adminProducts || [])
      .map((product) => product.group)
      .filter(Boolean)
      .map((id) => ({ id, label: labelForGroup(id) }));
    const fromCategories = (categories || []).map((item) => ({
      id: item.id,
      label: item.label || labelForGroup(item.id),
    }));
    const merged = [...lineFilters, ...legacyGroups, ...fromCategories, ...fromCatalog];
    return merged.filter((group, index, all) => all.findIndex((item) => item.id === group.id) === index);
  }, [adminProducts, categories, lineFilters]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!toolsOpen) return undefined;
    function onDocClick(event) {
      if (!event.target.closest(".admin-tools")) setToolsOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [toolsOpen]);

  function flash(message, kind = "ok") {
    setToast({ message, kind, at: Date.now() });
  }

  const counts = useMemo(() => {
    const next = { all: adminProducts.length, live: 0, hidden: 0, out: 0 };
    adminProducts.forEach((product) => {
      next[statusOf(product)] += 1;
    });
    return next;
  }, [adminProducts]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const allowedGroups = groupsFor(groupFilter);
    return adminProducts
      .filter((product) => {
        if (allowedGroups && !allowedGroups.includes(product.group)) return false;
        if (statusFilter !== "all" && statusOf(product) !== statusFilter) return false;
        if (!query) return true;
        return `${product.name} ${product.id} ${product.group}`.toLowerCase().includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [adminProducts, q, groupFilter, statusFilter]);

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
    const next = toForm(product);
    setForm(next);
    setCustomGroup(!groupOptions.some((group) => group.id === next.group));
    setColorDraft("");
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches) {
      document.getElementById("admin-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function startNew() {
    const next = blank();
    next.groupLabel = labelForGroup(next.group);
    setForm(next);
    setCustomGroup(false);
    setColorDraft("");
    document.getElementById("admin-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setColors(next) {
    setForm((prev) => ({ ...prev, colors: next }));
  }

  function addColor() {
    const name = colorDraft.trim();
    if (!name) {
      flash("Enter a colour name first.", "bad");
      return;
    }
    if ((form.colors || []).some((color) => color.name.toLowerCase() === name.toLowerCase())) {
      flash("That colour is already listed.", "bad");
      return;
    }
    setColors([...(form.colors || []), { name, image: "" }]);
    setColorDraft("");
  }

  function removeColor(index) {
    setColors((form.colors || []).filter((_, i) => i !== index));
  }

  function renameColor(index, nextName) {
    const name = nextName.trim();
    if (!name) return;
    setColors((form.colors || []).map((color, i) => (i === index ? { ...color, name } : color)));
  }

  function colorImageAt(index, dataUrl) {
    setColors(
      (form.colors || []).map((color, i) => (i === index ? { ...color, image: dataUrl } : color))
    );
  }

  async function save(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      flash("Name is required.", "bad");
      return;
    }
    const groupLabel = String(form.groupLabel || form.group || "").trim();
    const group = slugGroup(form.group || groupLabel);
    if (!group) {
      flash("Pick or type a category.", "bad");
      return;
    }
    const wasNew = !form.id;
    const createdCategory = customGroup || !groupOptions.some((item) => item.id === group);
    setBusy(true);
    try {
      const saved = await upsertProduct({
        ...form,
        group,
        groupLabel: groupLabel || titleCaseGroup(group),
        category: { id: group, label: groupLabel || titleCaseGroup(group) },
        compareAt: form.compareAt === "" ? null : Number(form.compareAt),
        stock: form.stock === "" ? null : Number(form.stock),
        badge: form.badge || null,
        sizes: String(form.sizes || "")
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
        colors: form.colors || [],
      });
      setForm(toForm(saved));
      setCustomGroup(false);
      const stockLabel =
        saved.stock === 0 ? "out of stock" : saved.stock == null ? "stock open" : `${saved.stock} in stock`;
      flash(
        createdCategory
          ? `Saved ${saved.name} and created category “${groupLabel || titleCaseGroup(group)}”.`
          : wasNew
            ? `Added ${saved.name}.`
            : `Saved ${saved.name} · ${money(saved.price)} · ${stockLabel}.`
      );
    } catch (err) {
      flash(err.message || "Save failed. Check MongoDB / Vercel env.", "bad");
    } finally {
      setBusy(false);
    }
  }

  function cropTitle(colorIndex) {
    if (typeof colorIndex === "number") {
      const colorName = form.colors?.[colorIndex]?.name;
      return `Crop ${colorName || "colour"} — one item only`;
    }
    return "Crop main picture";
  }

  async function openCropper(file, colorIndex) {
    if (!file) return;
    const raw = await readFileAsDataUrl(file, 2200);
    setCropper({
      src: raw,
      colorIndex,
      title: cropTitle(colorIndex),
    });
  }

  function openCropperFromSrc(src, colorIndex) {
    if (!src) {
      flash("Add a picture first.", "bad");
      return;
    }
    setCropper({
      src,
      colorIndex,
      title: cropTitle(colorIndex),
    });
  }

  async function applyCroppedImage(dataUrl, colorIndex) {
    const colorName =
      typeof colorIndex === "number" ? form.colors?.[colorIndex]?.name : undefined;
    setCropper(null);

    if (!form.id) {
      if (typeof colorIndex === "number") {
        colorImageAt(colorIndex, dataUrl);
        flash(`Cropped ${colorName || "colour"} ready. Hit Save.`);
      } else {
        patch("image", dataUrl);
        flash("Cropped picture ready. Hit Save.");
      }
      return;
    }

    setBusy(true);
    try {
      if (typeof colorIndex === "number") {
        const colors = (form.colors || []).map((color, i) =>
          i === colorIndex ? { ...color, image: dataUrl } : color
        );
        const image = colorIndex === 0 ? dataUrl : form.image;
        const saved = await upsertProduct({
          ...form,
          colors,
          image,
          compareAt: form.compareAt === "" ? null : Number(form.compareAt),
          stock: form.stock === "" ? null : Number(form.stock),
          sizes: String(form.sizes || "")
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean),
        });
        setForm(toForm(saved));
        flash(`Cropped ${saved.name} · ${colorName || "colour"}.`);
      } else {
        const saved = await setProductImage(form.id, dataUrl);
        if (saved) {
          setForm(toForm(saved));
          flash(`Cropped ${saved.name} picture.`);
        }
      }
    } catch (err) {
      flash(err.message || "Picture save failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!form.id) return;
    if (!window.confirm(`Remove ${form.name} from the catalogue?`)) return;
    const name = form.name;
    setBusy(true);
    try {
      await deleteProduct(form.id);
      setForm(blank());
      flash(`Removed ${name}.`);
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
    setToolsOpen(false);
  }

  async function onImport(file) {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      await importCatalog(text);
      setForm(blank());
      flash("Catalogue imported.");
    } catch (err) {
      flash(err.message || "Import failed.", "bad");
    } finally {
      setBusy(false);
      setToolsOpen(false);
    }
  }

  async function onReset() {
    if (!window.confirm("Reset all admin changes and restore the original catalogue?")) return;
    setBusy(true);
    try {
      await resetCatalog();
      setForm(blank());
      flash("Catalogue reset.");
    } catch (err) {
      flash(err.message || "Reset failed.", "bad");
    } finally {
      setBusy(false);
      setToolsOpen(false);
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
      flash(hidden ? `Hidden ${saved.name}.` : `Showing ${saved.name}.`);
    } catch (err) {
      flash(err.message || "Update failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <section className="admin-page admin-login-page">
        <div className="admin-login-card">
          <Link to="/" className="admin-back">
            <ArrowLeft size={16} /> Back to site
          </Link>
          <p className="admin-kicker">Modus Edge</p>
          <h1>Catalogue admin</h1>
          <p className="muted">Sign in to edit prices, stock, pictures, and visibility.</p>
          <form className="admin-login-form" onSubmit={login}>
            <label>
              Password
              <span className="admin-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={2.1} /> : <Eye size={18} strokeWidth={2.1} />}
                </button>
              </span>
            </label>
            {error ? <p className="admin-note bad">{error}</p> : null}
            <button type="submit" className="btn-dark admin-login-btn" disabled={busy}>
              {busy ? "Checking…" : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <div className="admin-root">
      <header className="admin-bar">
        <div className="admin-bar-main">
          <div>
            <p className="admin-kicker">Staff desk</p>
            <h1>Catalogue</h1>
          </div>
          {catalogError || busy ? (
            <p className={`admin-status ${catalogError ? "bad" : ""}`}>
              {catalogError || (busy ? "Saving…" : "")}
            </p>
          ) : null}
        </div>
        <div className="admin-bar-actions">
          <Link to="/shop" className="btn-lime">
            View shop
          </Link>
          {form.id ? (
            <Link to={`/product/${form.id}`} className="btn-ghost-ink">
              Open product
            </Link>
          ) : null}
          <div className="admin-tools">
            <button type="button" className="btn-ghost-ink" onClick={() => setToolsOpen((v) => !v)}>
              Tools
            </button>
            {toolsOpen ? (
              <div className="admin-tools-menu">
                <button type="button" onClick={onExport}>
                  <Download size={15} /> Export JSON
                </button>
                <label>
                  <Upload size={15} /> Import JSON
                  <input
                    type="file"
                    accept="application/json"
                    hidden
                    onChange={(event) => onImport(event.target.files?.[0])}
                  />
                </label>
                <button type="button" onClick={onReset}>
                  <RotateCcw size={15} /> Reset catalogue
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="admin-logout"
            onClick={() => {
              adminLogout();
              setAuthed(false);
            }}
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </header>

      <section className="admin-page">
        <div className="wrap admin-shell">
          <div className="admin-grid">
            <aside className="admin-list">
              <div className="admin-list-top">
                <div className="admin-search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Search name, id, group"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                  />
                </div>
                <button type="button" className="btn-dark admin-add" onClick={startNew}>
                  <Plus size={16} /> New
                </button>
              </div>

              <div className="admin-filter-row">
                <label className="admin-filter-field">
                  <span className="admin-filter-title">Status</span>
                  <select
                    className="admin-select"
                    value={statusFilter}
                    aria-label="Status"
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All ({counts.all})</option>
                    <option value="live">Live ({counts.live})</option>
                    <option value="hidden">Hidden ({counts.hidden})</option>
                    <option value="out">Out ({counts.out})</option>
                  </select>
                </label>

                <label className="admin-filter-field">
                  <span className="admin-filter-title">Category</span>
                  <select
                    className="admin-select"
                    value={groupFilter}
                    aria-label="Category"
                    onChange={(event) => setGroupFilter(event.target.value)}
                  >
                    <option value="all">All lines</option>
                    {lineFilters.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="admin-rows">
                {list.length === 0 ? (
                  <p className="admin-empty">No products match those filters.</p>
                ) : (
                  list.map((product) => {
                    const status = statusOf(product);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={`admin-row ${form.id === product.id ? "active" : ""} ${status === "hidden" ? "is-hidden" : ""}`}
                        onClick={() => select(product)}
                      >
                        <img src={product.image} alt="" />
                        <span>
                          <strong>{product.name}</strong>
                          <em>
                            {labelForGroup(product.group)} · {money(product.price)}
                          </em>
                        </span>
                        <b className={`admin-pill ${status}`}>
                          {status === "live" ? "Live" : status === "out" ? "Out" : "Hidden"}
                        </b>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <form id="admin-editor" className="admin-editor" onSubmit={save}>
              <div className="admin-editor-head">
                <div>
                  <p className="admin-kicker">{form.id ? form.id : "New item"}</p>
                  <h2>{form.id ? form.name || "Edit product" : "Add product"}</h2>
                </div>
                {form.id ? (
                  <span className={`admin-pill ${statusOf(form)}`}>
                    {statusOf(form) === "live" ? "Live" : statusOf(form) === "out" ? "Out of stock" : "Hidden"}
                  </span>
                ) : null}
              </div>

              <section className="admin-panel">
                <h3>Product details</h3>
                <table
                  className="pd-table"
                  style={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: "12px 10px" }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <Field label="Name">
                          <input value={form.name} onChange={(event) => patch("name", event.target.value)} required />
                        </Field>
                      </td>
                      <td>
                        <Field label="Category">
                          <div className="admin-group-fields">
                            <select
                              value={customGroup ? "__custom__" : form.group || "shirts"}
                              onChange={(event) => {
                                if (event.target.value === "__custom__") {
                                  setCustomGroup(true);
                                  setForm((prev) => ({ ...prev, group: "", groupLabel: "" }));
                                  return;
                                }
                                setCustomGroup(false);
                                const next = event.target.value;
                                setForm((prev) => ({
                                  ...prev,
                                  group: next,
                                  groupLabel: labelForGroup(next),
                                }));
                              }}
                              aria-label="Product category"
                            >
                              {groupOptions.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.label}
                                </option>
                              ))}
                              <option value="__custom__">New category…</option>
                            </select>
                            {customGroup ? (
                              <>
                                <input
                                  value={form.groupLabel}
                                  onChange={(event) => {
                                    const label = event.target.value;
                                    setForm((prev) => ({
                                      ...prev,
                                      groupLabel: label,
                                      group: slugGroup(label),
                                    }));
                                  }}
                                  placeholder="Category name e.g. Visors"
                                  aria-label="New category name"
                                  required
                                />
                                {form.group ? (
                                  <p className="muted admin-group-slug">Shop filter id: {form.group}</p>
                                ) : null}
                              </>
                            ) : null}
                          </div>
                        </Field>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Field label="Badge">
                          <input
                            value={form.badge}
                            onChange={(event) => patch("badge", event.target.value)}
                            placeholder="Sale, New…"
                          />
                        </Field>
                      </td>
                      <td>
                        <Field label="Sizes">
                          <input
                            value={form.sizes}
                            onChange={(event) => patch("sizes", event.target.value)}
                            placeholder="S, M, L, XL"
                          />
                        </Field>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Field label="Price (USD)">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(event) => patch("price", event.target.value)}
                          />
                        </Field>
                      </td>
                      <td>
                        <Field label="Compare at">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.compareAt}
                            onChange={(event) => patch("compareAt", event.target.value)}
                            placeholder="Optional"
                          />
                        </Field>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Field label="Stock">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={form.stock}
                            onChange={(event) => patch("stock", event.target.value)}
                            placeholder="Blank = open"
                          />
                        </Field>
                      </td>
                      <td>
                        <Field label="Flags">
                          <div className="admin-inline-checks">
                            <span className="admin-check">
                              <input
                                type="checkbox"
                                checked={form.featured}
                                onChange={(event) => patch("featured", event.target.checked)}
                              />
                              Featured
                            </span>
                            <span className="admin-check">
                              <input
                                type="checkbox"
                                checked={form.hidden}
                                onChange={(event) => patch("hidden", event.target.checked)}
                              />
                              Hidden
                            </span>
                          </div>
                        </Field>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <Field label="Short blurb">
                          <textarea rows={2} value={form.blurb} onChange={(event) => patch("blurb", event.target.value)} />
                        </Field>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <Field label="Details">
                          <textarea rows={3} value={form.details} onChange={(event) => patch("details", event.target.value)} />
                        </Field>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="admin-panel">
                <h3>Pictures</h3>
                <div className="admin-media">
                  <div className="admin-media-main">
                    <img src={form.image || "/images/polo-navy.png"} alt="" />
                    <div>
                      <p>Main picture</p>
                      <div className="admin-media-actions">
                        <label className="btn-dark admin-upload">
                          <Upload size={16} /> Upload & crop
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              openCropper(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn-ghost-ink"
                          onClick={() => openCropperFromSrc(form.image, undefined)}
                        >
                          Crop current
                        </button>
                      </div>
                      <input
                        value={form.image}
                        onChange={(event) => patch("image", event.target.value)}
                        placeholder="/images/... or URL"
                      />
                    </div>
                  </div>

                  <div className="admin-colors">
                    <h4>Colour pictures</h4>
                    <p className="muted admin-color-hint">
                      Upload a lineup if you must, then crop to one colour. Shoppers should never see four colours in one shot.
                    </p>
                    {(form.colors || []).map((color, index) => (
                      <div key={`${index}-${color.name}`} className="admin-color-row">
                        {color.image ? (
                          <img src={color.image} alt="" />
                        ) : (
                          <div className="admin-color-empty" title="Needs its own cropped photo">
                            ?
                          </div>
                        )}
                        <input
                          className="admin-color-name"
                          defaultValue={color.name}
                          onBlur={(event) => renameColor(index, event.target.value)}
                          aria-label={`Rename colour ${index + 1}`}
                        />
                        <label className="btn-ghost-ink admin-upload">
                          <Upload size={14} /> Upload
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              openCropper(file, index);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn-ghost-ink"
                          onClick={() => openCropperFromSrc(color.image || form.image, index)}
                        >
                          Crop
                        </button>
                        <button
                          type="button"
                          className="btn-ghost-ink danger admin-color-remove"
                          onClick={() => removeColor(index)}
                          aria-label={`Remove ${color.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="admin-color-add">
                      <input
                        value={colorDraft}
                        onChange={(event) => setColorDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addColor();
                          }
                        }}
                        placeholder="Colour name (Navy, White…)"
                        aria-label="New colour name"
                      />
                      <button type="button" className="btn-ghost-ink" onClick={addColor}>
                        <Plus size={14} /> Add colour
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="admin-actions">
                <button type="submit" className="btn-lime" disabled={busy}>
                  <Save size={16} /> {busy ? "Saving…" : "Save changes"}
                </button>
                {form.id ? (
                  <>
                    <button type="button" className="btn-ghost-ink" onClick={toggleHidden} disabled={busy}>
                      {form.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                      {form.hidden ? "Show in shop" : "Hide from shop"}
                    </button>
                    <button type="button" className="btn-ghost-ink danger" onClick={onDelete} disabled={busy}>
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

      {cropper ? (
        <ImageCropModal
          src={cropper.src}
          title={cropper.title}
          onCancel={() => setCropper(null)}
          onApply={(dataUrl) => applyCroppedImage(dataUrl, cropper.colorIndex)}
        />
      ) : null}
    </div>
  );
}
