import { products as seedProducts } from "../src/data.js";

export const seedIds = new Set(seedProducts.map((product) => product.id));

export function isSeedProduct(id) {
  return seedIds.has(id);
}
