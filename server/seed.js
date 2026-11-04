import "dotenv/config";
import { products as seedProducts } from "../src/data.js";
import { ensureAdmin } from "./adminModel.js";
import { connectDb } from "./db.js";
import { Catalog } from "./catalogModel.js";
import { Product, productPayload } from "./productModel.js";

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  console.log(`Seeding ${seedProducts.length} products…`);
  await connectDb();

  const adminUser = process.env.ADMIN_USERNAME || "admin";
  const adminPass = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "modus2024";
  const adminResult = await ensureAdmin(adminUser, adminPass);
  console.log(
    adminResult.created
      ? `Admin created: ${adminResult.username}`
      : `Admin updated: ${adminResult.username}`
  );

  // Products collection is the source of truth; keep Catalog overrides empty.
  const ops = seedProducts.map((product) => {
    const payload = productPayload({ ...product, hidden: false, stock: product.stock ?? null });
    return {
      updateOne: {
        filter: { id: product.id },
        update: { $set: payload },
        upsert: true,
      },
    };
  });

  const productResult = await Product.bulkWrite(ops, { ordered: false });
  await Catalog.findOneAndUpdate(
    { key: "main" },
    {
      key: "main",
      overrides: {},
      extras: [],
      deleted: [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const count = await Product.countDocuments();
  console.log("Product upserts:", {
    upserted: productResult.upsertedCount,
    modified: productResult.modifiedCount,
    matched: productResult.matchedCount,
  });
  console.log(`Catalogue ready. Products in DB: ${count}`);
  console.log("Catalog overrides cleared (Product collection is source of truth).");
  console.log(`Login at /admin with username "${adminUser}" and your ADMIN_PASSWORD.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exit(1);
  });
