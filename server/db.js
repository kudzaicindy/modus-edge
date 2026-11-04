import mongoose from "mongoose";

let cached = globalThis.__modusMongo;

if (!cached) {
  cached = globalThis.__modusMongo = { conn: null, promise: null };
}

export async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (cached.conn) {
    if (mongoose.connection.readyState === 1) return cached.conn;
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
