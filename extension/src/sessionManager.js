// src/sessionManager.js
// Manages the current coding session.
// A session starts on first activity and resets after idle timeout.
// sessionId is a UUID generated fresh for each new session.

const vscode = require("vscode");
const crypto = require("crypto");

class SessionManager {
  constructor() {
    this._sessionId = this._generateId();
    this._projectId = this._getProjectId();
    this._lastActivityAt = Date.now();
    this._idleTimer = null;
  }

  /**
   * Returns the current sessionId.
   * Call this before building any event — always use the current session.
   */
  get sessionId() {
    return this._sessionId;
  }

  /**
   * Returns the current projectId (workspace folder name).
   */
  get projectId() {
    return this._projectId;
  }

  /**
   * Called on every tracked activity (keystroke, save, etc.).
   * Checks if idle timeout has elapsed — if so, starts a fresh session.
   * Returns true if a new session was started.
   */
  ping() {
    const config = vscode.workspace.getConfiguration("strata");
    const idleTimeoutMs = config.get("idleTimeoutMinutes", 30) * 60 * 1000;
    const now = Date.now();
    const elapsed = now - this._lastActivityAt;

    this._lastActivityAt = now;

    if (elapsed > idleTimeoutMs) {
      // Developer was idle long enough — this is a new session
      this._sessionId = this._generateId();
      this._projectId = this._getProjectId(); // Re-read in case workspace changed
      return true; // New session started
    }

    return false; // Same session continues
  }

  /**
   * Forces a new session immediately.
   * Triggered by the "Strata: Start New Session" command.
   */
  forceNewSession() {
    this._sessionId = this._generateId();
    this._projectId = this._getProjectId();
    this._lastActivityAt = Date.now();
  }

  /**
   * Derives a stable project identifier from the workspace folder name.
   * Falls back to "unknown" if no workspace is open.
   */
  _getProjectId() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return "unknown";

    // Use the first workspace folder name — simple and predictable
    const name = folders[0].name;
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-") // Sanitize for use as an ID
      .replace(/-+/g, "-") // Collapse multiple dashes
      .replace(/^-|-$/g, ""); // Trim leading/trailing dashes
  }

  /**
   * Generates a short unique session ID.
   * Format: sess_{timestamp}_{randomhex} — readable and sortable.
   */
  _generateId() {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const random = crypto.randomBytes(4).toString("hex");
    return `sess_${timestamp}_${random}`;
  }
}

module.exports = SessionManager;
