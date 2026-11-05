import "dotenv/config";
import app from "./app.js";
import { connectDb, isDbReady } from "./db.js";

const port = Number(process.env.PORT || 3001);

async function ensureDb(label = "startup") {
  if (!process.env.MONGODB_URI) {
    console.warn("Warning: MONGODB_URI is missing. Set it in .env");
    return false;
  }
  if (isDbReady()) return true;
  try {
    await connectDb(process.env.MONGODB_URI, { force: label === "retry" || label === "startup" });
    console.log(`MongoDB connected (${label})`);
    return true;
  } catch (error) {
    console.error(`MongoDB unavailable (${label}):`, error.message);
    if (label === "startup" || label === "retry") {
      console.error(
        "Fix: Atlas → Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0), and confirm the cluster is not paused."
      );
      console.error("Admin can still sign in with ADMIN_USERNAME / ADMIN_PASSWORD from .env while DB is down (read-only seed catalogue).");
    }
    return false;
  }
}

async function start() {
  // Listen immediately so Vite proxy does not 500 while Mongo is still connecting.
  app.listen(port, () => {
    console.log(`Catalogue API on http://localhost:${port}`);
    console.log(`DB status: ${isDbReady() ? "connected" : "connecting / seed fallback"}`);
  });

  await ensureDb("startup");
  console.log(`DB status: ${isDbReady() ? "connected" : "disconnected (using seed fallback for reads)"}`);

  setInterval(() => {
    if (process.env.MONGODB_URI && !isDbReady()) {
      ensureDb("retry");
    }
  }, 20000);
}

process.on("uncaughtException", (error) => {
  console.error("uncaughtException:", error);
});
process.on("unhandledRejection", (error) => {
  console.error("unhandledRejection:", error);
});

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
