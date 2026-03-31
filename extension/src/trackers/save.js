// src/trackers/save.js
// Fires a save event whenever a file is saved.
// Sent immediately — not buffered — since saves are intentional signals.

const vscode = require("vscode");
const { sendEvent } = require("../api");

/**
 * @param {import('../sessionManager')} sessionManager
 * @returns {vscode.Disposable}
 */
const registerSaveTracker = (sessionManager) => {
  return vscode.workspace.onDidSaveTextDocument((document) => {
    // Only track actual files
    if (document.uri.scheme !== "file") return;

    sessionManager.ping();

    sendEvent({
      type: "save",
      sessionId: sessionManager.sessionId,
      projectId: sessionManager.projectId,
      timestamp: new Date().toISOString(),
      metadata: {
        file: vscode.workspace.asRelativePath(document.uri),
        language: document.languageId,
      },
    });
  });
};

module.exports = registerSaveTracker;
