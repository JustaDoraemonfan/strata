// src/trackers/keystroke.js
// Fires a keystroke event on every document change.
// Events go into the queue — not sent immediately.
// We track one event per change, not one per character.

const vscode = require("vscode");

/**
 * @param {import('../sessionManager')} sessionManager
 * @param {import('../eventQueue')} eventQueue
 * @returns {vscode.Disposable}
 */
const registerKeystrokeTracker = (sessionManager, eventQueue) => {
  return vscode.workspace.onDidChangeTextDocument((event) => {
    // Ignore changes with no actual content (e.g. formatting, auto-save triggers)
    if (event.contentChanges.length === 0) return;

    // Ignore output channels, git internals, etc. — only track files
    if (event.document.uri.scheme !== "file") return;

    sessionManager.ping();

    const totalChars = event.contentChanges.reduce(
      (sum, change) => sum + change.text.length,
      0,
    );

    eventQueue.enqueue({
      type: "keystroke",
      sessionId: sessionManager.sessionId,
      projectId: sessionManager.projectId,
      timestamp: new Date().toISOString(),
      metadata: {
        file: vscode.workspace.asRelativePath(event.document.uri),
        language: event.document.languageId,
        changeCount: event.contentChanges.length,
        charsAdded: totalChars,
      },
    });
  });
};

module.exports = registerKeystrokeTracker;
