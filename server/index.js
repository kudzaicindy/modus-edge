import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./db.js";

const port = Number(process.env.PORT || 3001);

async function start() {
  if (!process.env.MONGODB_URI) {
    console.warn("Warning: MONGODB_URI is missing. Set it in .env");
  } else {
    await connectDb();
    console.log("MongoDB connected");
  }
  app.listen(port, () => {
    console.log(`Catalogue API on http://localhost:${port}`);
  });
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
