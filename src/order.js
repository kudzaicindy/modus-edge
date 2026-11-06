import { brand, money } from "./data";

export function listMessage(items, name) {
  const lines = items.map((item) => {
    const each = money(item.product.price);
    const line = money(item.qty * item.product.price);
    const bits = [item.color, item.size, item.branding ? "custom branding" : ""]
      .filter(Boolean)
      .join(", ");
    const extra = bits ? ` (${bits})` : "";
    return `• ${item.product.name}${extra} × ${item.qty} — ${each} each — ${line}`;
  });
  const total = items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
  const who = name?.trim() ? [`My name: ${name.trim()}`] : [];
  const brandingNote = items.some((item) => item.branding)
    ? ["", "Please include custom branding options for the marked items."]
    : [];
  return [
    `Hello ${brand.name}, I would like to order:`,
    "",
    ...lines,
    "",
    `Catalogue total: ${money(total)}`,
    ...who,
    ...brandingNote,
    "",
    "Please confirm availability and the total.",
  ].join("\n");
}

export function whatsappHref(text, number = brand.whatsapp) {
  const id = String(number || brand.whatsapp).replace(/\D/g, "");
  return `https://wa.me/${id}?text=${encodeURIComponent(text)}`;
}

export function whatsappLinks(text) {
  const list = Array.isArray(brand.whatsappNumbers) && brand.whatsappNumbers.length
    ? brand.whatsappNumbers
    : [{ id: brand.whatsapp, display: brand.whatsappDisplay }];
  return list.map((entry) => ({
    ...entry,
    href: whatsappHref(text, entry.id),
  }));
}
