import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: String,
    group: String,
    line: String,
    price: Number,
    compareAt: { type: Number, default: null },
    badge: { type: String, default: null },
    featured: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    stock: { type: Number, default: null },
    image: String,
    images: [String],
    colors: [mongoose.Schema.Types.Mixed],
    sizes: [String],
    blurb: String,
    details: String,
    highlights: [String],
    specs: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true, strict: false }
);

export const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export function productPayload(product) {
  return {
    id: product.id,
    name: product.name,
    group: product.group,
    line: product.line,
    price: product.price,
    compareAt: product.compareAt ?? null,
    badge: product.badge ?? null,
    featured: Boolean(product.featured),
    hidden: Boolean(product.hidden),
    stock: product.stock ?? null,
    image: product.image,
    images: product.images || undefined,
    colors: product.colors || undefined,
    sizes: product.sizes || undefined,
    blurb: product.blurb || "",
    details: product.details || "",
    highlights: product.highlights || undefined,
    specs: product.specs || undefined,
  };
}

/** Upsert seed data without overwriting admin-set prices on existing products. */
export function seedUpsertOp(product) {
  const payload = productPayload({ ...product, hidden: Boolean(product.hidden), stock: product.stock ?? null });
  const { price, compareAt, ...rest } = payload;
  return {
    updateOne: {
      filter: { id: product.id },
      update: {
        $set: rest,
        $setOnInsert: { price, compareAt },
      },
      upsert: true,
    },
  };
}
