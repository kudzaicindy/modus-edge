import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import qrcode from "qrcode-terminal";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { reply } from "../src/assistant.js";
import { products } from "../src/data.js";

const waitMs = Number(process.env.AGENT_WAIT_MS || 45000);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "whatsapp-session");
const ordersFile = path.join(root, "orders.json");
const logger = pino({ level: "silent" });
const pending = new Map();
const sentByUs = new Set();

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ordersFile, "utf8"));
  } catch {
    return {};
  }
}

function writeOrders(orders) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

function itemsFor(jid) {
  return (readOrders()[jid] || [])
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product ? { id: item.id, qty: item.qty, product } : null;
    })
    .filter(Boolean);
}

function storeItems(jid, items) {
  const orders = readOrders();
  orders[jid] = items.map((item) => ({ id: item.id, qty: item.qty }));
  writeOrders(orders);
}

function textOf(message) {
  if (!message) return "";
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    ""
  );
}

function isDirectChat(jid) {
  return Boolean(jid) && (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@lid"));
}

function cancel(jid) {
  const job = pending.get(jid);
  if (!job) return;
  clearTimeout(job.timer);
  pending.delete(jid);
  console.log("Seller replied. The agent will stay quiet for that chat.");
}

async function answer(sock, jid, text) {
  pending.delete(jid);
  const current = itemsFor(jid);
  const question = text.trim() || "What can I send you?";
  const result = reply(question, { items: current });
  if (result.items) storeItems(jid, result.items);
  const sent = await sock.sendMessage(jid, { text: result.text });
  if (sent?.key?.id) sentByUs.add(sent.key.id);
  console.log(`Replied to ${jid.split("@")[0]}`);
}

function schedule(sock, jid, text) {
  cancel(jid);
  const timer = setTimeout(() => {
    answer(sock, jid, text).catch((error) => console.error(error.message));
  }, waitMs);
  pending.set(jid, { timer });
  console.log(`Message from ${jid.split("@")[0]}. Waiting ${Math.round(waitMs / 1000)}s in case the seller replies.`);
}

async function start() {
  fs.mkdirSync(root, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(root);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.windows("MODUS-EDGE"),
    markOnlineOnConnect: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("\nOn the phone for 0786209200, open WhatsApp → Linked devices → Link a device, then scan this code:\n");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log(`WhatsApp agent is connected. It quotes catalogue prices if the seller has not replied within ${Math.round(waitMs / 1000)} seconds.`);
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(loggedOut ? "Logged out of WhatsApp. Run the agent again and scan a new code." : "Connection closed. Reconnecting...");
      if (!loggedOut) setTimeout(start, 3000);
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    for (const message of messages) {
      const jid = message.key.remoteJid;
      if (!isDirectChat(jid)) continue;
      if (message.key.fromMe) {
        if (!sentByUs.has(message.key.id)) cancel(jid);
        continue;
      }
      const age = Date.now() - Number(message.messageTimestamp || 0) * 1000;
      if (age > 2 * 60 * 1000) continue;
      schedule(sock, jid, textOf(message.message));
    }
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
