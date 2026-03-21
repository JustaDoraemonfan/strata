import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

/**
 * Verifies the JWT access token from the Authorization header.
 * Expected header format: Authorization: Bearer <token>
 */
const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access denied — no token provided",
      });
    }

    const token = authHeader.split(" ")[1]; // Extract just the token part

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied — malformed authorization header",
      });
    }

    // Verify token — throws if expired or tampered
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach decoded user to request — available in all downstream handlers
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      displayName: decoded.displayName,
    };

    next(); // Token valid — proceed to route handler
  } catch (error) {
    // jwt.verify throws specific errors — handle them cleanly
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Access token expired — please refresh",
        code: "TOKEN_EXPIRED", // Frontend uses this code to trigger refresh automatically
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
        code: "TOKEN_INVALID",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication failed",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

export { authenticate };
