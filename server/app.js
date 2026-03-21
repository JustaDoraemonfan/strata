import express from "express";
import cookieParser from "cookie-parser";
import "./config/redis.js";

// Routers
import authRouter from "./routes/auth.routes.js";
import eventsRouter from "./routes/events.routes.js";
import sessionsRouter from "./routes/sessions.routes.js";
import insightsRouter from "./routes/insights.routes.js";

import { authenticate } from "./middleware/authenticate.js";

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cookieParser()); // Required for reading httpOnly refresh token cookie

// --- Health check ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Strata server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// --- API Routers ---
app.use("/api/auth", authRouter); // Public + protected auth routes
app.use("/api/events", authenticate, eventsRouter); // Protected in next step
app.use("/api/sessions", authenticate, sessionsRouter); // Protected in next step
app.use("/api/insights", authenticate, insightsRouter); // Protected in next step

export default app;
