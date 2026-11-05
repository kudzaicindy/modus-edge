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

  return cached.promise;
}
