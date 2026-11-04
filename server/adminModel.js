import crypto from "crypto";
import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    salt: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, passwordHash };
}

export function verifyPassword(password, salt, passwordHash) {
  if (!password || !salt || !passwordHash) return false;
  const check = crypto.scryptSync(String(password), salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(passwordHash, "hex"), Buffer.from(check, "hex"));
  } catch {
    return false;
  }
}

export async function ensureAdmin(username, password) {
  const existing = await Admin.findOne({ username });
  const { salt, passwordHash } = hashPassword(password);
  if (existing) {
    existing.salt = salt;
    existing.passwordHash = passwordHash;
    await existing.save();
    return { created: false, username };
  }
  await Admin.create({ username, salt, passwordHash });
  return { created: true, username };
}

export async function authenticateAdmin(username, password) {
  const admin = await Admin.findOne({ username: username || "admin" });
  if (!admin) return false;
  return verifyPassword(password, admin.salt, admin.passwordHash);
}
