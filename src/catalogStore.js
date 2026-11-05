import { productAliases, products as seedProducts } from "./data";

export const AUTH_KEY = "modus-edge-admin";
export const CATALOG_EVENT = "modus-catalog-changed";
const PASS_KEY = "modus-edge-admin-pass";
const USER_KEY = "modus-edge-admin-user";

const emptyState = () => ({
  overrides: {},
  extras: [],
  deleted: [],
  products: null,
});

let memory = emptyState();
let loaded = false;

function apiBase() {
  return import.meta.env.VITE_API_URL || "";
}

export function getAdminPassword() {
  return sessionStorage.getItem(PASS_KEY) || "";
}

export function getAdminUsername() {
  return sessionStorage.getItem(USER_KEY) || "admin";
}

export function setAdminPassword(password) {
  sessionStorage.setItem(PASS_KEY, password);
}

export function setAdminUsername(username) {
  sessionStorage.setItem(USER_KEY, username || "admin");
}

export function clearAdminPassword() {
  sessionStorage.removeItem(PASS_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-username": getAdminUsername(),
    "x-admin-password": getAdminPassword(),
  };
}

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CATALOG_EVENT));
  }
}

function applyState(state) {
  memory = {
    overrides: state?.overrides && typeof state.overrides === "object" ? state.overrides : {},
    extras: Array.isArray(state?.extras) ? state.extras : [],
    deleted: Array.isArray(state?.deleted) ? state.deleted : [],
    products: Array.isArray(state?.products) && state.products.length ? state.products : null,
  };
  loaded = true;
  notify();
  return memory;
}

export function loadState() {
  return {
    overrides: { ...memory.overrides },
    extras: memory.extras.map((item) => ({ ...item })),
    deleted: [...memory.deleted],
    products: memory.products ? memory.products.map((item) => ({ ...item })) : null,
  };
}

export async function fetchCatalog() {
  const res = await fetch(`${apiBase()}/api/catalog`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Catalogue load failed (${res.status})`);
  }
  const data = await res.json();
  return applyState(data);
}

export function applyLocalSeed() {
  return applyState({
    overrides: {},
    extras: [],
    deleted: [],
    products: seedProducts,
  });
}

const seedById = new Map(seedProducts.map((product) => [product.id, product]));

function hydrateColors(product) {
  const seed = seedById.get(product.id);
  const seedColors = seed?.colors || [];
  const liveColors = Array.isArray(product.colors) ? product.colors : [];

  if (!liveColors.length && seedColors.length) {
    return seedColors.map((color) => ({ ...color }));
  }

  const liveImages = liveColors.map((color) => color?.image).filter(Boolean);
  const sharedGroup =
    liveImages.length > 1 && liveImages.every((image) => image === liveImages[0]);

  return liveColors.map((color) => {
    const next = { ...color };
    const match =
      seedColors.find((item) => item.name === next.name) ||
      seedColors.find((item) => item.image && item.name?.toLowerCase() === String(next.name || "").toLowerCase());
    if (!next.image || sharedGroup) {
      if (match?.image) next.image = match.image;
    }
    if (match?.tone && !next.tone) next.tone = match.tone;
    return next;
  });
}

function cloneProduct(product) {
  const colors = hydrateColors(product);
  return {
    ...product,
    image: product.image || seedById.get(product.id)?.image,
    colors: colors.length ? colors : undefined,
    sizes: product.sizes ? [...product.sizes] : undefined,
    highlights: product.highlights ? [...product.highlights] : undefined,
    specs: product.specs ? product.specs.map((row) => [...row]) : undefined,
    images: product.images ? [...product.images] : undefined,
  };
}

function applyOverride(product, patch) {
  if (!patch || Object.keys(patch).length === 0) return product;
  const next = { ...product, ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, "colors") && patch.colors) {
    next.colors = patch.colors.map((color) => ({ ...color }));
  }
  if (Object.prototype.hasOwnProperty.call(patch, "sizes") && patch.sizes) {
    next.sizes = [...patch.sizes];
  }
  if (Object.prototype.hasOwnProperty.call(patch, "highlights") && patch.highlights) {
    next.highlights = [...patch.highlights];
  }
  if (Object.prototype.hasOwnProperty.call(patch, "specs") && patch.specs) {
    next.specs = patch.specs.map((row) => [...row]);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "images") && patch.images) {
    next.images = [...patch.images];
  }
  next.colors = hydrateColors(next);
  return next;
}

function finalizeProduct(product) {
  const cloned = cloneProduct(product);
  return {
    ...cloned,
    colors: hydrateColors(cloned),
  };
}

export function buildCatalog(includeHidden = false) {
  const state = memory;
  const deleted = new Set(state.deleted);
  const source = Array.isArray(state.products) && state.products.length ? state.products : seedProducts;
  const base = source
    .filter((product) => !deleted.has(product.id))
    .map((product) => applyOverride(finalizeProduct(product), state.overrides[product.id]));

  const extras = state.extras
    .filter((product) => product?.id && !deleted.has(product.id))
    .map((product) => applyOverride(finalizeProduct(product), state.overrides[product.id]));

  const merged = [...base];
  extras.forEach((product) => {
    if (!merged.some((item) => item.id === product.id)) merged.push(product);
  });

  if (includeHidden) return merged;
  return merged.filter((product) => !product.hidden);
}

export function findCatalogProduct(id, { includeHidden = true } = {}) {
  const resolved = productAliases[id] || id;
  return buildCatalog(includeHidden).find((item) => item.id === resolved);
}

function slugify(name) {
  return String(name || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function uniqueId(name) {
  const base = slugify(name) || "item";
  let id = base;
  let n = 2;
  const taken = new Set(buildCatalog(true).map((product) => product.id));
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function toNumber(value, fallback = 0) {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStock(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeProduct(input) {
  const id = input.id || uniqueId(input.name);
  const seed = seedProducts.find((product) => product.id === id);
  const current = findCatalogProduct(id) || seed;

  return {
    id,
    name: String(input.name || current?.name || "Untitled").trim(),
    group: input.group || current?.group || "gifts",
    price: toNumber(input.price, current?.price ?? 0),
    compareAt: input.compareAt === "" || input.compareAt == null ? null : toNumber(input.compareAt, null),
    badge: input.badge ? String(input.badge) : null,
    featured: Boolean(input.featured),
    hidden: Boolean(input.hidden),
    stock: Object.prototype.hasOwnProperty.call(input, "stock") ? toStock(input.stock) : (current?.stock ?? null),
    image: input.image || current?.image || "/images/polo-navy.png",
    images: input.images || current?.images,
    colors: input.colors || current?.colors,
    sizes: Array.isArray(input.sizes)
      ? input.sizes
      : input.sizes
        ? String(input.sizes)
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
        : current?.sizes || ["One size"],
    blurb: input.blurb ?? current?.blurb ?? "",
    details: input.details ?? current?.details ?? "",
    highlights: input.highlights || current?.highlights || [],
    specs: input.specs || current?.specs || [],
  };
}

export async function upsertProduct(input) {
  const product = normalizeProduct(input);
  const res = await fetch(`${apiBase()}/api/catalog/product`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ product }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Save failed (${res.status})`);
  }
  if (body.state) applyState(body.state);
  else await fetchCatalog();
  return findCatalogProduct(product.id) || product;
}

export async function deleteProduct(id) {
  const res = await fetch(`${apiBase()}/api/catalog/product/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Delete failed (${res.status})`);
  }
  if (body.state) applyState(body.state);
  else await fetchCatalog();
}

export async function importCatalog(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const res = await fetch(`${apiBase()}/api/catalog`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({
      overrides: parsed.overrides || {},
      extras: parsed.extras || [],
      deleted: parsed.deleted || [],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Import failed (${res.status})`);
  }
  applyState(body);
}

export async function resetCatalog() {
  const res = await fetch(`${apiBase()}/api/catalog/reset`, {
    method: "POST",
    headers: adminHeaders(),
    body: "{}",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Reset failed (${res.status})`);
  }
  applyState(body);
}

export function exportCatalog() {
  return JSON.stringify(memory, null, 2);
}

export function setProductImage(id, imageUrl, colorName) {
  const product = findCatalogProduct(id);
  if (!product) return Promise.resolve(null);
  if (colorName && product.colors?.length) {
    const colors = product.colors.map((color) =>
      color.name === colorName ? { ...color, image: imageUrl } : color
    );
    const image = colorName === product.colors[0]?.name ? imageUrl : product.image;
    return upsertProduct({ ...product, colors, image });
  }
  return upsertProduct({ ...product, image: imageUrl });
}

export function readFileAsDataUrl(file, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function isAdminAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "1" && Boolean(getAdminPassword());
}

export async function adminLogin(password, username = "admin") {
  const res = await fetch(`${apiBase()}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Wrong username or password");
  }
  sessionStorage.setItem(AUTH_KEY, "1");
  setAdminUsername(body.username || username);
  setAdminPassword(password);
  return true;
}

export function adminLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  clearAdminPassword();
}

export function isCatalogLoaded() {
  return loaded;
}

export function restoreProduct() {
  return Promise.resolve();
}
