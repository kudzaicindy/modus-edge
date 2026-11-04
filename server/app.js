import cors from "cors";
import express from "express";
import { authenticateAdmin } from "./adminModel.js";
import { connectDb } from "./db.js";
import { Catalog, emptyCatalog, getCatalogDoc, toState } from "./catalogModel.js";
import { Product, productPayload } from "./productModel.js";
import { isSeedProduct } from "./seedIds.js";

async function listProducts() {
  const rows = await Product.find({}).lean();
  return rows.map((row) => {
    const { _id, __v, createdAt, updatedAt, ...product } = row;
    return product;
  });
}

async function catalogResponse(doc) {
  return {
    ...toState(doc),
    products: await listProducts(),
  };
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "12mb" }));

async function requireAdmin(req, res, next) {
  try {
    const password = req.header("x-admin-password") || req.body?.password || "";
    const username = req.header("x-admin-username") || req.body?.username || "admin";
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
    return res.status(503).json({ error: "Database unavailable", detail: error.message });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "modus-edge-catalog" });
});

app.post("/api/admin/login", withDb, async (req, res) => {
  try {
    const username = String(req.body?.username || "admin").trim() || "admin";
    const password = String(req.body?.password || "");
    const ok = await authenticateAdmin(username, password);
    if (!ok) {
      return res.status(401).json({ error: "Wrong username or password" });
    }
    return res.json({ ok: true, username });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/catalog", withDb, async (_req, res) => {
  try {
    const doc = await getCatalogDoc();
    res.json(await catalogResponse(doc));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load catalogue" });
  }
});

app.put("/api/catalog", withDb, requireAdmin, async (req, res) => {
  try {
    const overrides = req.body?.overrides && typeof req.body.overrides === "object" ? req.body.overrides : {};
    const extras = Array.isArray(req.body?.extras) ? req.body.extras : [];
    const deleted = Array.isArray(req.body?.deleted) ? req.body.deleted : [];
    const doc = await Catalog.findOneAndUpdate(
      { key: "main" },
      { overrides, extras, deleted },
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
    const overrides = {};
    const ops = seedProducts.map((product) => {
      const payload = productPayload({ ...product, hidden: false, stock: product.stock ?? null });
      overrides[product.id] = { ...payload };
      return {
        updateOne: {
          filter: { id: product.id },
          update: { $set: payload },
          upsert: true,
        },
      };
    });
    await Product.bulkWrite(ops, { ordered: false });
    const doc = await Catalog.findOneAndUpdate(
      { key: "main" },
      { key: "main", overrides, extras: [], deleted: [] },
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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

export default app;
