import mongoose from "mongoose";

let cached = globalThis.__modusMongo;

if (!cached) {
  cached = globalThis.__modusMongo = { conn: null, promise: null };
}

export async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
