import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// POST /api/auth/register   → create a new account
router.post("/register", register);

// POST /api/auth/login      → login and receive tokens
router.post("/login", login);

// POST /api/auth/refresh    → get a new access token via refresh token cookie
router.post("/refresh", refresh);

// POST /api/auth/logout     → invalidate refresh token (protected)
router.post("/logout", authenticate, logout);

// GET  /api/auth/me         → get current user profile (protected)
router.get("/me", authenticate, getMe);

// PATCH /api/auth/me        → update display name, timezone, preferences (protected)
router.patch("/me", authenticate, updateMe);

export default router;
