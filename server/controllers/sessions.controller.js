import {
  buildSession,
  getSessionsByUserAndRange,
  getSessionById,
} from "../services/session.service.js";
import { computeStratumScore } from "../services/scoring.service.js";

/**
 * POST /api/sessions/build
 * Triggers session aggregation from raw events.
 * Call this after a coding session ends to build the session document.
 */
const triggerSessionBuild = async (req, res) => {
  try {
    const { sessionId, userId, projectId } = req.body;

    if (!sessionId || !userId || !projectId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: sessionId, userId, projectId",
      });
    }

    const session = await buildSession(sessionId, userId, projectId);

    return res.status(201).json({
      success: true,
      message: "Session built successfully",
      data: session,
    });
  } catch (error) {
    // Known error — no events found for this sessionId
    if (error.message.startsWith("No events found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to build session",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * GET /api/sessions?userId=&from=&to=
 * Returns all sessions for a user within a time range.
 */
const getSessions = async (req, res) => {
  try {
    const { userId, from, to } = req.query;

    if (!userId || !from || !to) {
      return res.status(400).json({
        success: false,
        error: "Missing required query params: userId, from, to",
      });
    }

    const sessions = await getSessionsByUserAndRange(
      userId,
      new Date(from),
      new Date(to),
    );

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve sessions",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * GET /api/sessions/:sessionId
 * Returns a single session by sessionId.
 */
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: `No session found for sessionId: ${sessionId}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve session",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * POST /api/sessions/score
 * Triggers Stratum Score computation for a built session.
 * Must be called after /build — session must exist before scoring.
 */
const scoreSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "sessionId is required",
      });
    }

    const result = await computeStratumScore(sessionId);

    return res.status(200).json({
      success: true,
      message: "Stratum Score computed successfully",
      data: result,
    });
  } catch (error) {
    if (error.message.startsWith("No session found")) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to compute Stratum Score",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

export { triggerSessionBuild, getSessions, getSession, scoreSession };
