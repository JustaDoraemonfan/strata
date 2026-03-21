import {
  createEvent,
  getEventsByUserAndRange,
  getEventsBySession,
} from "../services/events.service.js";

/**
 * POST /api/events
 * Ingests a single developer event and persists it.
 */
const ingestEvent = async (req, res) => {
  try {
    const { userId, type, timestamp, sessionId, projectId, metadata } =
      req.body;

    // Basic presence check — detailed validation happens in validateRequest middleware
    if (!userId || !type || !sessionId || !projectId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, type, sessionId, projectId",
      });
    }

    const eventData = {
      userId,
      type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      sessionId,
      projectId,
      metadata: metadata || {},
    };

    const saved = await createEvent(eventData);

    return res.status(201).json({
      success: true,
      message: "Event ingested successfully",
      data: saved,
    });
  } catch (error) {
    // Mongoose validation errors have a specific shape — handle them cleanly
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to ingest event",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * GET /api/events?userId=&from=&to=
 * Returns all events for a user within a time range.
 */
const getEvents = async (req, res) => {
  try {
    const { userId, from, to } = req.query;

    if (!userId || !from || !to) {
      return res.status(400).json({
        success: false,
        error: "Missing required query params: userId, from, to",
      });
    }

    const events = await getEventsByUserAndRange(
      userId,
      new Date(from),
      new Date(to),
    );

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve events",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * GET /api/events/session/:sessionId
 * Returns all events belonging to a specific session.
 */
const getEventsBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "sessionId is required",
      });
    }

    const events = await getEventsBySession(sessionId);

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve session events",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

export { ingestEvent, getEvents, getEventsBySessionId };
