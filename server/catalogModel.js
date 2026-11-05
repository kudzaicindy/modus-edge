import mongoose from "mongoose";

const CatalogSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    overrides: { type: mongoose.Schema.Types.Mixed, default: {} },
    extras: { type: [mongoose.Schema.Types.Mixed], default: [] },
    deleted: { type: [String], default: [] },
    categories: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export const Catalog =
  mongoose.models.Catalog || mongoose.model("Catalog", CatalogSchema);

export function emptyCatalog() {
  return { overrides: {}, extras: [], deleted: [], categories: [] };
}

export async function getCatalogDoc() {
  let doc = await Catalog.findOne({ key: "main" });
  if (!doc) {
    doc = await Catalog.create({ key: "main", ...emptyCatalog() });
  }
  return doc;
}

export function normalizeCategory(input) {
  if (!input) return null;
  const raw = typeof input === "string" ? { id: input } : input;
  const id = String(raw.id || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!id || id === "all") return null;
  const label =
    String(raw.label || "")
      .trim() ||
    id
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  return { id, label };
}

export function ensureCategory(doc, input) {
  const cat = normalizeCategory(input);
  if (!cat) return null;
  const list = Array.isArray(doc.categories) ? [...doc.categories] : [];
  const at = list.findIndex((item) => item?.id === cat.id);
  if (at >= 0) {
    list[at] = { ...list[at], ...cat };
  } else {
    list.push(cat);
  }
  doc.categories = list;
  doc.markModified("categories");
  return cat;
}

export function toState(doc) {
  return {
    overrides: doc.overrides && typeof doc.overrides === "object" ? doc.overrides : {},
    extras: Array.isArray(doc.extras) ? doc.extras : [],
    deleted: Array.isArray(doc.deleted) ? doc.deleted : [],
    categories: Array.isArray(doc.categories)
      ? doc.categories.map((item) => normalizeCategory(item)).filter(Boolean)
      : [],
    updatedAt: doc.updatedAt || null,
  };
}
