import mongoose from "mongoose";

let cached = globalThis.__modusMongo;

if (!cached) {
  cached = globalThis.__modusMongo = { conn: null, promise: null, lastFailAt: 0 };
}

const FAIL_COOLDOWN_MS = 15000;

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}

export function dbRecentlyFailed() {
  return Boolean(cached.lastFailAt) && Date.now() - cached.lastFailAt < FAIL_COOLDOWN_MS;
}

export async function connectDb(uri = process.env.MONGODB_URI, { force = false } = {}) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  // Already connected.
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  // Avoid stacking 12s Atlas timeouts on every request while the IP is blocked.
  if (!force && dbRecentlyFailed()) {
    throw new Error(
      "Database unavailable (recent connection failure). Check Atlas Network Access whitelist."
    );
  }

  // Drop any in-flight / failed attempt so we can retry cleanly.
  cached.promise = null;
  cached.conn = null;

  // If mongoose is stuck connecting/disconnecting, reset it.
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  }

  cached.promise = mongoose
    .connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    })
    .then((conn) => {
      cached.conn = conn;
      cached.lastFailAt = 0;
      return conn;
    })
    .catch((error) => {
      cached.promise = null;
      cached.conn = null;
      cached.lastFailAt = Date.now();
      throw error;
    });

  return cached.promise;
}
