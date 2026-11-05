import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { products as seedProducts } from "../src/data.js";
import { authenticateAdmin, authenticateEnvAdmin } from "./adminModel.js";
import { connectDb, dbRecentlyFailed, isDbReady } from "./db.js";
import { Catalog, emptyCatalog, ensureCategory, getCatalogDoc, toState } from "./catalogModel.js";
import { shopFilters } from "../src/data.js";
import { Product, productPayload, seedUpsertOp } from "./productModel.js";
import { isSeedProduct } from "./seedIds.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../build");

async function listProducts() {
  const rows = await Product.find({}).lean();
  return rows.map((row) => {
    const { _id, __v, createdAt, updatedAt, ...product } = row;
    return product;
  });
}

async function catalogResponse(doc) {
  const products = await listProducts();
  const state = toState(doc);
  return {
    ...state,
    categories: categoriesFromProducts(products, state.categories),
    products,
  };
}

function seedCatalogResponse() {
  return {
    overrides: {},
    extras: [],
    deleted: [],
    categories: [],
    updatedAt: null,
    products: seedProducts,
    source: "seed",
  };
}

function knownFilterIds() {
  return new Set(shopFilters.map((filter) => filter.id));
}

function categoriesFromProducts(products, existing = []) {
  const known = knownFilterIds();
  const byId = new Map();
  for (const item of existing) {
    if (item?.id && !known.has(item.id)) byId.set(item.id, item);
  }
  for (const product of products || []) {
    const id = String(product?.group || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!id || id === "all" || known.has(id) || byId.has(id)) continue;
    // Skip legacy aliases that already map into seed filters.
    if (["caps", "bottles", "towels", "gifts", "sets", "power"].includes(id)) continue;
    const label = id
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    byId.set(id, { id, label });
  }
  return [...byId.values()];
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "12mb" }));

async function requireAdmin(req, res, next) {
  try {
    const password = req.header("x-admin-password") || req.body?.password || "";
    const username = req.header("x-admin-username") || req.body?.username || "admin";
    if (authenticateEnvAdmin(username, password)) {
      return next();
    }
    if (!isDbReady()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ok = await authenticateAdmin(username, password);
    if (!ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
  } catch (error) {
    console.error(error);
    return res.status(503).json({ error: "Auth unavailable" });
  }
}

async function withDb(req, res, next) {
  try {
    await connectDb();
    return next();
  } catch (error) {
    console.error(error);
    return res.status(503).json({
      error: "Database unavailable",
      detail: error.message,
      hint: "Atlas → Network Access → allow your IP or 0.0.0.0/0. Shop still works from seed data.",
    });
  }
}

/** Prefer DB, but allow public catalogue reads to fall back to seed data. */
async function withDbOrSeed(req, res, next) {
  if (!process.env.MONGODB_URI || dbRecentlyFailed()) {
    req.catalogSource = "seed";
    return next();
  }
  if (isDbReady()) {
    req.catalogSource = "db";
    return next();
  }
  try {
    await connectDb();
    req.catalogSource = "db";
    return next();
  } catch (error) {
    console.error("Catalogue falling back to seed:", error.message);
    req.catalogSource = "seed";
    return next();
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "modus-edge-catalog",
    db: isDbReady() ? "connected" : "disconnected",
  });
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "admin").trim() || "admin";
    const password = String(req.body?.password || "");

    // Local/dev fallback when Atlas is unreachable.
    if (authenticateEnvAdmin(username, password)) {
      return res.json({
        ok: true,
        username,
        source: isDbReady() ? "env" : "env-offline",
        db: isDbReady() ? "connected" : "disconnected",
      });
    }

    if (!isDbReady()) {
      try {
        await connectDb();
      } catch (error) {
        return res.status(503).json({
          error: "Database unavailable",
          detail: error.message,
          hint: "Use ADMIN_PASSWORD from .env, or whitelist your IP in Atlas Network Access.",
        });
      }
    }

    const ok = await authenticateAdmin(username, password);
    if (!ok) {
      return res.status(401).json({ error: "Wrong username or password" });
    }
    return res.json({ ok: true, username, source: "db", db: "connected" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/catalog", withDbOrSeed, async (req, res) => {
  try {
    if (req.catalogSource === "seed" || !isDbReady()) {
      return res.json(seedCatalogResponse());
    }
    const doc = await getCatalogDoc();
    res.json(await catalogResponse(doc));
  } catch (error) {
    console.error(error);
    res.json(seedCatalogResponse());
  }
});

app.put("/api/catalog", withDb, requireAdmin, async (req, res) => {
  try {
    const overrides = req.body?.overrides && typeof req.body.overrides === "object" ? req.body.overrides : {};
    const extras = Array.isArray(req.body?.extras) ? req.body.extras : [];
    const deleted = Array.isArray(req.body?.deleted) ? req.body.deleted : [];
    const categories = Array.isArray(req.body?.categories) ? req.body.categories : [];
    const doc = await Catalog.findOneAndUpdate(
      { key: "main" },
      { overrides, extras, deleted, categories },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(await catalogResponse(doc));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save catalogue" });
  }
});

app.put("/api/catalog/product", withDb, requireAdmin, async (req, res) => {
  try {
    const product = req.body?.product;
    if (!product?.id) {
      return res.status(400).json({ error: "product.id is required" });
    }

    const livePatch = {
      name: product.name,
      group: product.group,
      price: product.price,
      compareAt: product.compareAt ?? null,
      badge: product.badge ?? null,
      featured: Boolean(product.featured),
      hidden: Boolean(product.hidden),
      stock: product.stock ?? null,
      image: product.image,
      sizes: product.sizes,
      blurb: product.blurb,
      details: product.details,
    };
    if (product.colors) livePatch.colors = product.colors;
    if (product.images) livePatch.images = product.images;
    if (product.highlights) livePatch.highlights = product.highlights;
    if (product.specs) livePatch.specs = product.specs;
    if (product.line) livePatch.line = product.line;

    const payload = productPayload({ ...product, ...livePatch });
    await Product.findOneAndUpdate(
      { id: product.id },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const doc = await getCatalogDoc();
    const overrides = { ...(doc.overrides || {}) };
    // Keep Product as source of truth; only light admin marks in overrides.
    delete overrides[product.id];
    doc.overrides = overrides;
    doc.deleted = (doc.deleted || []).filter((id) => id !== product.id);

    if (isSeedProduct(product.id)) {
      doc.extras = (doc.extras || []).filter((item) => item.id !== product.id);
    } else {
      doc.extras = [
        ...(doc.extras || []).filter((item) => item.id !== product.id),
        payload,
      ];
    }

    const categoryInput = product.category || {
      id: product.group,
      label: product.groupLabel || product.categoryLabel,
    };
    if (categoryInput?.id || product.group) {
      const known = knownFilterIds();
      const id = String(categoryInput.id || product.group || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (id && id !== "all" && !known.has(id) && !["caps", "bottles", "towels", "gifts", "sets", "power"].includes(id)) {
        ensureCategory(doc, {
          id,
          label: categoryInput.label || product.groupLabel || product.categoryLabel,
        });
      }
    }

    doc.markModified("overrides");
    doc.markModified("extras");
    doc.markModified("deleted");
    await doc.save();

    res.json({ ok: true, state: await catalogResponse(doc), product: livePatch });
  } catch (error) {
    console.error("PUT /api/catalog/product failed:", error);
    res.status(500).json({ error: "Failed to save product", detail: error.message });
  }
});

app.delete("/api/catalog/product/:id", withDb, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await getCatalogDoc();
    doc.extras = (doc.extras || []).filter((item) => item.id !== id);
    const overrides = { ...(doc.overrides || {}) };
    delete overrides[id];
    doc.overrides = overrides;
    if (isSeedProduct(id)) {
      doc.deleted = [...new Set([...(doc.deleted || []), id])];
      await Product.findOneAndUpdate({ id }, { $set: { hidden: true } });
    } else {
      doc.deleted = (doc.deleted || []).filter((item) => item !== id);
      await Product.deleteOne({ id });
    }
    await doc.save();
    res.json({ ok: true, state: await catalogResponse(doc) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

app.post("/api/catalog/reset", withDb, requireAdmin, async (_req, res) => {
  try {
    const doc = await Catalog.findOneAndUpdate(
      { key: "main" },
      { ...emptyCatalog() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(await catalogResponse(doc));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reset catalogue" });
  }
});

app.post("/api/catalog/seed", withDb, requireAdmin, async (_req, res) => {
  try {
    const { products: seedProducts } = await import("../src/data.js");
    // Preserve admin prices on existing products; seed prices only for new inserts.
    const ops = seedProducts.map((product) => seedUpsertOp(product));
    await Product.bulkWrite(ops, { ordered: false });
    const doc = await Catalog.findOneAndUpdate(
      { key: "main" },
      { key: "main", overrides: {}, extras: [], deleted: [] },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({
      ok: true,
      count: await Product.countDocuments(),
      state: await catalogResponse(doc),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to seed catalogue" });
  }
});

app.use(express.static(distDir));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) next();
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

export default app;
