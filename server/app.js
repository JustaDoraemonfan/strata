import express from "express";
import eventsRouter from "./routes/events.routes.js";
import sessionRouter from "./routes/sessions.routes.js";
import insightsRouter from "./routes/insights.routes.js";

const app = express();

// --- Middleware ---
app.use(express.json());

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
app.use("/api/events", eventsRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/insights", insightsRouter);

export default app;
