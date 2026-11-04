import mongoose from "mongoose";

const CatalogSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    overrides: { type: mongoose.Schema.Types.Mixed, default: {} },
    extras: { type: [mongoose.Schema.Types.Mixed], default: [] },
    deleted: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Catalog =
  mongoose.models.Catalog || mongoose.model("Catalog", CatalogSchema);

export function emptyCatalog() {
  return { overrides: {}, extras: [], deleted: [] };
}

export async function getCatalogDoc() {
  let doc = await Catalog.findOne({ key: "main" });
  if (!doc) {
    doc = await Catalog.create({ key: "main", ...emptyCatalog() });
  }
  return doc;
}

export function toState(doc) {
  return {
    overrides: doc.overrides && typeof doc.overrides === "object" ? doc.overrides : {},
    extras: Array.isArray(doc.extras) ? doc.extras : [],
    deleted: Array.isArray(doc.deleted) ? doc.deleted : [],
    updatedAt: doc.updatedAt || null,
  };
}
