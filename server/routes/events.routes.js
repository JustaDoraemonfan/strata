import express from "express";
import {
  ingestEvent,
  getEvents,
  getEventsBySessionId,
} from "../controllers/events.controller.js";

const router = express.Router();

// POST /api/events → ingest a single developer event
router.post("/", ingestEvent);

// GET  /api/events → get events by userId + time range (query params)
router.get("/", getEvents);

// GET  /api/events/session/:sessionId → get all events for a session
router.get("/session/:sessionId", getEventsBySessionId);

export default router;
