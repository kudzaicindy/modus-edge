import { brand, money } from "./data";

export function listMessage(items, name) {
  const lines = items.map((item) => {
    const each = money(item.product.price);
    const line = money(item.qty * item.product.price);
    return `• ${item.product.name} × ${item.qty} — ${each} each — ${line}`;
  });
  const total = items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
  const who = name?.trim() ? [`My name: ${name.trim()}`] : [];
  return [
    `Hello ${brand.name}, I would like to order:`,
    "",
    ...lines,
    "",
    `Catalogue total: ${money(total)}`,
    ...who,
    "",
    "Please confirm availability and the total.",
  ].join("\n");
}

export function whatsappHref(text) {
  return `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;
}
