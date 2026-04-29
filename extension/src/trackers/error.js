// src/trackers/error.js
// Fires an error event when new errors appear in the problems panel.
// Uses onDidChangeDiagnostics — fires whenever VS Code's language servers
// update their error/warning list for any file.
// Sent immediately — errors are high-signal.

const vscode = require("vscode");
const { sendEvent } = require("../api");

/**
 * @param {import('../sessionManager')} sessionManager
 * @returns {vscode.Disposable}
 */
const registerErrorTracker = (sessionManager) => {
  return vscode.languages.onDidChangeDiagnostics((event) => {
    for (const uri of event.uris) {
      // Only track actual files
      if (uri.scheme !== "file") continue;

      const diagnostics = vscode.languages.getDiagnostics(uri);

      // Only care about errors — not warnings, hints, or info
      const errors = diagnostics.filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Error,
      );

      if (errors.length === 0) continue;

      sessionManager.ping();

      sendEvent({
        type: "error",
        sessionId: sessionManager.sessionId,
        projectId: sessionManager.projectId,
        timestamp: new Date().toISOString(),
        metadata: {
          file: vscode.workspace.asRelativePath(uri),
          errorCount: errors.length,
          // Send first error message for context — capped for safety
          firstError: errors[0].message.slice(0, 200),
          source: errors[0].source ?? "unknown",
        },
      });

      
      break;
    }
  });
};

module.exports = registerErrorTracker;
