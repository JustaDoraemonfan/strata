import express from "express";
import {
  triggerSessionBuild,
  getSessions,
  getSession,
  scoreSession,
} from "../controllers/sessions.controller.js";

const router = express.Router();

// POST /api/sessions/build        → trigger session aggregation from raw events
router.post("/build", triggerSessionBuild);

// POST /api/sessions/score  → compute Stratum Score for a built session
router.post("/score", scoreSession);

// GET  /api/sessions              → get sessions by userId + time range
router.get("/", getSessions);

// GET  /api/sessions/:sessionId   → get a single session by sessionId
router.get("/:sessionId", getSession);

export default router;
