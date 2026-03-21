import express from "express";
import {
  triggerInsightBuild,
  getInsights,
  getWeekInsight,
} from "../controllers/insights.controller.js";

const router = express.Router();

// POST /api/insights/build          → trigger weekly insight generation
router.post("/build", triggerInsightBuild);

// GET  /api/insights                → get all insights for a user
router.get("/", getInsights);

// GET  /api/insights/week           → get insight for a specific week
router.get("/week", getWeekInsight);

export default router;
