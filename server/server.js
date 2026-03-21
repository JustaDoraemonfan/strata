import "./config/env.js";
import connectDB from "./config/db.js";
import { PORT, NODE_ENV } from "./config/env.js";
import app from "./app.js";

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] 🚀 Strata running on http://localhost:${PORT}`);
      console.log(`[server] 🌍 Environment: ${NODE_ENV}`);
    });
  } catch (error) {
    console.error(`[server] ❌ Failed to start: ${error.message}`);
    process.exit(1);
  }
};

process.on("uncaughtException", (err) => {
  console.error(`[server] 💥 Uncaught exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(`[server] 💥 Unhandled rejection: ${reason}`);
  process.exit(1);
});

start();
