// src/api.js
// Handles all HTTP communication with the Strata backend.
// Reads token and API URL from VS Code settings on every call —
// so changes to settings take effect immediately without restart.

const vscode = require("vscode");
const https = require("https");
const http = require("http");
const { URL } = require("url");

/**
 * Returns the current config values.
 * Called fresh on every request so settings changes are always picked up.
 */
const getConfig = () => {
  const config = vscode.workspace.getConfiguration("strata");
  return {
    accessToken: config.get("accessToken", ""),
    apiUrl: config.get("apiUrl", "http://localhost:5000"),
    enabled: config.get("enabled", true),
  };
};

/**
 * Makes a POST request to the Strata API.
 * Uses Node's built-in http/https — no external dependencies needed.
 *
 * @param {string} path - e.g. "/api/events"
 * @param {Object} body - JSON payload
 * @returns {Promise<Object>} Parsed response body
 */
const post = (path, body) => {
  return new Promise((resolve, reject) => {
    const { accessToken, apiUrl } = getConfig();

    if (!accessToken) {
      // Silently skip — user hasn't configured their token yet
      return resolve(null);
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(path, apiUrl);
    } catch {
      return reject(new Error(`Invalid API URL: ${apiUrl}`));
    }

    const payload = JSON.stringify(body);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const transport = parsedUrl.protocol === "https:" ? https : http;

    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", (err) => {
      // Network errors are silent — don't interrupt coding with popups
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Sends a single event to the backend.
 * @param {Object} event - { type, sessionId, projectId, timestamp, metadata }
 */
const sendEvent = async (event) => {
  try {
    await post("/api/events", event);
  } catch {
    // Silently discard — tracking should never interrupt the developer
  }
};

/**
 * Sends a batch of events. Fires them in parallel — fast, fire-and-forget.
 * @param {Array} events
 */
const sendEventBatch = async (events) => {
  if (!events || events.length === 0) return;
  await Promise.allSettled(events.map((e) => sendEvent(e)));
};

/**
 * Returns true if the extension has a valid token configured.
 */
const isConfigured = () => {
  const { accessToken } = getConfig();
  return accessToken.length > 0;
};

module.exports = { sendEvent, sendEventBatch, isConfigured, getConfig };
