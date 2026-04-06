// src/trackers/debug.js
// Fires a debug event when a debug session starts.
// Sent immediately — launching the debugger is a meaningful signal.

const vscode = require("vscode");
const { sendEvent } = require("../api");

/**
 * @param {import('../sessionManager')} sessionManager
 * @returns {vscode.Disposable}
 */
const registerDebugTracker = (sessionManager) => {
  return vscode.debug.onDidStartDebugSession((session) => {
    sessionManager.ping();

    sendEvent({
      type: "debug",
      sessionId: sessionManager.sessionId,
      projectId: sessionManager.projectId,
      timestamp: new Date().toISOString(),
      metadata: {
        debugType: session.type, // e.g. "node", "python", "chrome"
      },
    });
  });
};

module.exports = registerDebugTracker;
