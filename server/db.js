import mongoose from "mongoose";

let cached = globalThis.__modusMongo;

if (!cached) {
  cached = globalThis.__modusMongo = { conn: null, promise: null };
}

export function isDbReady() {
  return mongoose.connection.readyState === 1;
}

export async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  // Already connected.
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  // Drop stale failed / disconnected state so the next call can retry.
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 12000,
        connectTimeoutMS: 12000,
      })
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        throw error;
      });
  }

  return cached.promise;
}
