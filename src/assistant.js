import { brand, money, products } from "./data.js";

const skip = new Set([
  "how", "much", "the", "is", "are", "a", "an", "price", "prices", "for", "do", "you",
  "have", "what", "whats", "what's", "cost", "costs", "please", "me", "of", "and", "to",
  "i", "want", "add", "get", "buy", "order", "some", "any", "can", "your", "my", "on",
  "in", "it", "this", "that", "with", "from", "list", "catalogue", "catalog", "piece",
  "pieces", "golf",
]);

const extra = {
  "tour-soft": ["ball", "balls"],
  iron: ["iron"],
  driver: ["driver"],
  putter: ["putter"],
  cart: ["cart"],
  carry: ["carry", "bag", "bags"],
  glove: ["glove"],
  polo: ["lime", "polo", "shirt", "shirts"],
  navy: ["navy", "polo", "shirt", "shirts"],
  cap: ["cap", "caps", "hat", "hats", "trucker"],
  crew: ["crew", "shirt", "shirts"],
};

function stem(word) {
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

function wordsOf(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !skip.has(word) && word.length > 1)
    .map(stem);
}

function keysFor(product) {
  const fromName = product.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && word !== "golf");
  return [...new Set([...fromName, ...(extra[product.id] || [])])];
}

const keyIndex = products.map((product) => ({ product, keys: keysFor(product) }));

function rarity(word) {
  const count = keyIndex.filter((entry) => entry.keys.includes(word)).length;
  if (count === 1) return 5;
  if (count === 2) return 3;
  return 1;
}

function findProducts(text) {
  const words = wordsOf(text);
  const scored = keyIndex
    .map((entry) => {
      const score = words.reduce((sum, word) => (entry.keys.includes(word) ? sum + rarity(word) : sum), 0);
      return { product: entry.product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return [];
  const top = scored[0].score;
  return scored.filter((entry) => entry.score >= top - 1).slice(0, 6).map((entry) => entry.product);
}

function qtyFrom(text) {
  const named = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  for (const [word, qty] of Object.entries(named)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) return qty;
  }
  const match = text.match(/(?:^|\s)([1-8])(?=\s|$)/);
  if (!match) return 1;
  const after = text.slice(match.index + match[0].length).trim().toLowerCase();
  if (after.startsWith("iron")) return 1;
  return Number(match[1]);
}

function priceLine(product) {
  return `${product.name} — ${money(product.price)}`;
}

function listTotal(items) {
  return items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
}

export function reply(question, { items }) {
  const text = question.trim();
  const lower = text.toLowerCase();

  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(lower)) {
    return {
      text: `Hello from ${brand.name}. I quote catalogue prices while the seller is busy. Ask for a shirt, a cap, or a price, or say "add 2 lime polos". The seller confirms the order when they are free.`,
    };
  }

  if (/\b(clear|start over|empty the list|cancel the list)\b/.test(lower)) {
    return { text: "Cleared. Tell me what to add.", items: [] };
  }

  if (/\b(where|address|phone|whatsapp|call|email|contact)\b/.test(lower)) {
    return {
      text: `${brand.name} is at ${brand.address}. WhatsApp ${brand.whatsappDisplay}. Email ${brand.email}.`,
    };
  }

  if (/\b(my list|my bag|my order|what do i have|what's on my|whats on my|catalogue total|my total)\b/.test(lower)) {
    if (!items.length) return { text: "Your list is empty. Name a piece and say add it." };
    const lines = items.map((item) => `${item.product.name} × ${item.qty} — ${money(item.qty * item.product.price)}`);
    return {
      text: `On your order:\n${lines.join("\n")}\nCatalogue total: ${money(listTotal(items))}.\nThe seller confirms this when they are free.`,
    };
  }

  const found = findProducts(text);
  if (!found.length) {
    return {
      text: "I only quote prices the seller has listed. I don't have a price for that. The seller will answer when they are free.",
    };
  }

  const adding = /\b(add|include|put|want|get|order|take)\b/.test(lower) && !/\b(how much|price|prices|cost)\b/.test(lower);
  if (adding) {
    if (found.length > 1) {
      return { text: `Which one should I add?\n${found.map(priceLine).join("\n")}` };
    }
    const product = found[0];
    const qty = qtyFrom(text);
    const next = items.some((item) => item.id === product.id)
      ? items.map((item) => (item.id === product.id ? { ...item, qty: Math.min(8, item.qty + qty) } : item))
      : [...items, { id: product.id, qty, product }];
    return {
      add: { id: product.id, qty },
      items: next,
      text: `Added ${product.name} × ${qty} at ${money(product.price)} each. Your order is ${money(listTotal(next))}. The seller confirms the total.`,
    };
  }

  if (found.length === 1) {
    return { text: `${priceLine(found[0])}. That is the seller's catalogue price. Say "add ${found[0].name}" if you want it on the order.` };
  }
  return { text: `Seller prices:\n${found.map(priceLine).join("\n")}\nSay which one to add.` };
}
