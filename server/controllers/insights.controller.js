// server/controllers/insights.controller.js
// PURPOSE: Handle HTTP request/response for insight endpoints.
// RULES: No business logic, no DB calls — delegate to insights.service.js
// TALKS TO: insights.service.js only.
// CALLED BY: insights.routes.js only.

import {
  buildWeeklyInsight,
  getInsightsByUser,
  getInsightForWeek,
  getMondayOfWeek,
} from "../services/insights.service.js";

/**
 * POST /api/insights/build
 * Triggers weekly insight generation for a user.
 * Pass a date within the target week — defaults to current week.
 */
const triggerInsightBuild = async (req, res) => {
  try {
    const { userId, date } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    // Use provided date or default to today
    const targetDate = date ? new Date(date) : new Date();

    // Validate date if provided
    if (date && isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format — use ISO 8601 e.g. 2026-03-17",
      });
    }

    const insight = await buildWeeklyInsight(userId, targetDate);

    return res.status(201).json({
      success: true,
      message: `Weekly insight built for week of ${getMondayOfWeek(targetDate).toDateString()}`,
      data: insight,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to build weekly insight",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * GET /api/insights?userId=&limit=
 * Returns all weekly insights for a user, newest first.
 * Optional limit param — defaults to 8 weeks.
 */
const getInsights = async (req, res) => {
  try {
    const { userId, limit } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    // Parse limit safely — default to 8 if not provided or invalid
    const parsedLimit = limit && !isNaN(parseInt(limit)) ? parseInt(limit) : 8;

    const insights = await getInsightsByUser(userId, parsedLimit);

    return res.status(200).json({
      success: true,
      count: insights.length,
      data: insights,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve insights",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * GET /api/insights/week?userId=&date=
 * Returns insight for a specific week.
 * Pass any date within the target week.
 */
const getWeekInsight = async (req, res) => {
  try {
    const { userId, date } = req.query;

    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing required query params: userId, date",
      });
    }

    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format — use ISO 8601 e.g. 2026-03-17",
      });
    }

    const insight = await getInsightForWeek(userId, targetDate);

    if (!insight) {
      return res.status(404).json({
        success: false,
        error: `No insight found for week of ${getMondayOfWeek(targetDate).toDateString()}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: insight,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve week insight",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

export { triggerInsightBuild, getInsights, getWeekInsight };
