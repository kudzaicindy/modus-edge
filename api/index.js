// On Vercel, set MONGODB_URI / ADMIN_* in Project → Settings → Environment Variables.
// dotenv only helps locally when a .env file exists.
import "dotenv/config";
import app from "../server/app.js";

export default app;
