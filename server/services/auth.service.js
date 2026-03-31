import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { JWT_SECRET } from "../config/env.js";

// ─────────────────────────────────────────────
// TOKEN CONFIGURATION
// ─────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY = "15m"; // Short lived — expires every 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // Long lived — expires every 7 days

// ─────────────────────────────────────────────
// TOKEN GENERATORS
// ─────────────────────────────────────────────

/**
 * Generates a short lived access token.
 * Contains userId and email — enough for any protected route to identify the user.
 * @param {Object} user - User document from MongoDB
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
};

/**
 * Generates a long lived refresh token.
 * Contains only userId — minimal payload for security.
 * @param {Object} user - User document from MongoDB
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

// ─────────────────────────────────────────────
// AUTH OPERATIONS
// ─────────────────────────────────────────────

/**
 * Registers a new user.
 * Checks for duplicate email, creates user, returns tokens.
 * Password hashing happens automatically via User.model.js pre-save hook.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
const registerUser = async (email, password, displayName) => {
  // Check if email already exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("EMAIL_EXISTS"); // Controller maps this to a 409 response
  }

  // Create user — password gets hashed by pre-save hook automatically
  const user = await new User({ email, password, displayName }).save();

  // Generate both tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token hash in DB
  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      userId: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone,
      preferences: user.preferences,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Logs in an existing user.
 * Validates email + password, rotates refresh token, returns both tokens.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
const loginUser = async (email, password) => {
  // Explicitly select password + refreshToken — both have select: false
  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user || !user.isActive) {
    throw new Error("INVALID_CREDENTIALS"); // Never reveal whether email exists
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS"); // Same error — no hints to attackers
  }

  // Generate fresh tokens on every login
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Rotate refresh token — old one is invalidated
  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: {
      userId: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone,
      preferences: user.preferences,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Rotates a refresh token — issues a new access token + new refresh token.
 * Validates the incoming refresh token against what's stored in DB.
 * @param {string} incomingRefreshToken - From httpOnly cookie
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const rotateRefreshToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new Error("NO_REFRESH_TOKEN");
  }

  // Verify the token is valid and not expired
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, JWT_SECRET);
  } catch {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // Find user and check stored refresh token matches
  const user = await User.findById(decoded.userId).select("+refreshToken");

  if (!user || user.refreshToken !== incomingRefreshToken) {
    // Token mismatch — possible token reuse attack
    // Null out stored token to force re-login
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // Issue fresh tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Rotate — old refresh token is now invalid
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

/**
 * Logs out a user by nulling their refresh token.
 * Access token expires naturally after 15 mins.
 * @param {string} userId
 * @returns {Promise<void>}
 */
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Updates a user's profile fields.
 * Uses dot-notation keys for nested preferences so MongoDB merges correctly
 * instead of replacing the entire preferences object.
 * @param {string} userId
 * @param {Object} updates - Dot-notation safe update object from controller
 * @returns {Promise<Object>} Clean user object (no password, no refreshToken)
 */
const updateUser = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    {
      new: true, // Return the updated document, not the old one
      runValidators: true, // Run schema validators on the updated fields
    },
  );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    userId: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone,
    preferences: user.preferences,
  };
};

export {
  registerUser,
  loginUser,
  rotateRefreshToken,
  logoutUser,
  updateUser,
  generateAccessToken,
  generateRefreshToken,
};
