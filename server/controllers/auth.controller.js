import {
  registerUser,
  loginUser,
  rotateRefreshToke
  logoutUser,
} from "../services/auth.service.js";

// Cookie configuration — same settings used for set and clear
const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript cannot access this cookie — XSS protection
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict", // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds — matches refresh token expiry
};

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, password, displayName",
      });
    }

    const { user, accessToken, refreshToken } = await registerUser(
      email,
      password,
      displayName,
    );

    // Refresh token goes in httpOnly cookie — never in response body
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user,
        accessToken, // Access token goes in response body — client stores in memory
      },
    });
  } catch (error) {
    if (error.message === "EMAIL_EXISTS") {
      return res.status(409).json({
        success: false,
        error: "An account with this email already exists",
      });
    }

    // Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    return res.status(500).json({
      success: false,
      error: "Registration failed",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and issues tokens.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: email, password",
      });
    }

    const { user, accessToken, refreshToken } = await loginUser(
      email,
      password,
    );

    // Rotate refresh token into cookie
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Login failed",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * POST /api/auth/refresh
 * Issues a new access token using the refresh token from cookie.
 */
const refresh = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    const { accessToken, refreshToken } =
      await rotateRefreshToken(incomingRefreshToken);

    // Rotate cookie with new refresh token
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
      data: { accessToken },
    });
  } catch (error) {
    if (
      error.message === "NO_REFRESH_TOKEN" ||
      error.message === "INVALID_REFRESH_TOKEN"
    ) {
      // Clear the cookie — force re-login
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        error: "Session expired — please log in again",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Token refresh failed",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * POST /api/auth/logout
 * Invalidates refresh token and clears cookie.
 */
const logout = async (req, res) => {
  try {
    // req.user is attached by authenticate middleware
    await logoutUser(req.user.userId);

    // Clear the refresh token cookie
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Logout failed",
      ...(process.env.NODE_ENV === "development" && { debug: error.message }),
    });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * req.user is attached by authenticate middleware — no DB call needed.
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

export { register, login, refresh, logout, getMe };
