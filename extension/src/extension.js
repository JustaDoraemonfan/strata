// src/extension.js
// Extension entry point.
// activate() — called once when VS Code loads the extension.
// deactivate() — called when VS Code shuts down or extension is disabled.

const vscode = require("vscode");
const SessionManager = require("./sessionManager");
const EventQueue = require("./eventQueue");
const { isConfigured, getConfig } = require("./api");

const registerKeystrokeTracker = require("./trackers/keystroke");
const registerSaveTracker = require("./trackers/save");
const registerCommitTracker = require("./trackers/commit");
const registerErrorTracker = require("./trackers/error");
const registerDebugTracker = require("./trackers/debug");

// Module-level references so deactivate() can clean up
let sessionManager;
let eventQueue;
let statusBarItem;

/**
 * Called by VS Code when the extension activates.
 * @param {vscode.ExtensionContext} context
 */
const activate = (context) => {
  // ── Core services ──────────────────────────────────────────────────────────
  sessionManager = new SessionManager();
  eventQueue = new EventQueue();
  eventQueue.start();

  // ── Status bar ─────────────────────────────────────────────────────────────
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "strata.showStatus";
  updateStatusBar();
  statusBarItem.show();

  // ── Commands ───────────────────────────────────────────────────────────────

  const showStatusCmd = vscode.commands.registerCommand(
    "strata.showStatus",
    () => {
      const configured = isConfigured();
      const { apiUrl } = getConfig();

      if (!configured) {
        vscode.window
          .showWarningMessage(
            "Strata: No access token configured. Open settings to add your token.",
            "Open Settings",
          )
          .then((choice) => {
            if (choice === "Open Settings") {
              vscode.commands.executeCommand(
                "workbench.action.openSettings",
                "strata.accessToken",
              );
            }
          });
        return;
      }

      vscode.window.showInformationMessage(
        `Strata is tracking ✦  Session: ${sessionManager.sessionId}  ·  Project: ${sessionManager.projectId}  ·  API: ${apiUrl}`,
      );
    },
  );

  const newSessionCmd = vscode.commands.registerCommand(
    "strata.newSession",
    () => {
      sessionManager.forceNewSession();
      updateStatusBar();
      vscode.window.showInformationMessage(
        `Strata: New session started — ${sessionManager.sessionId}`,
      );
    },
  );

  // ── Trackers ───────────────────────────────────────────────────────────────
  const keystrokeDisposable = registerKeystrokeTracker(
    sessionManager,
    eventQueue,
  );
  const saveDisposable = registerSaveTracker(sessionManager);
  const commitDisposable = registerCommitTracker(sessionManager);
  const errorDisposable = registerErrorTracker(sessionManager);
  const debugDisposable = registerDebugTracker(sessionManager);

  // ── Settings change watcher ────────────────────────────────────────────────
  // Update status bar if the user enables/disables tracking or changes token
  const configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("strata")) {
      updateStatusBar();
    }
  });

  // ── Register all disposables ───────────────────────────────────────────────
  // VS Code calls dispose() on each of these when the extension deactivates
  const disposables = [
    showStatusCmd,
    newSessionCmd,
    keystrokeDisposable,
    saveDisposable,
    errorDisposable,
    debugDisposable,
    configWatcher,
    statusBarItem,
  ];

  // commitDisposable can be null if workspace has no .git folder
  if (commitDisposable) disposables.push(commitDisposable);

  context.subscriptions.push(...disposables);

  // ── Token check on startup ─────────────────────────────────────────────────
  if (!isConfigured()) {
    vscode.window
      .showWarningMessage(
        "Strata: Add your access token to start tracking your sessions.",
        "Open Settings",
      )
      .then((choice) => {
        if (choice === "Open Settings") {
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "strata.accessToken",
          );
        }
      });
  }
};

/**
 * Called by VS Code when the extension deactivates (shutdown or disable).
 * Flush any remaining buffered events before closing.
 */
const deactivate = async () => {
  if (eventQueue) {
    await eventQueue.dispose();
  }
};

/**
 * Updates the status bar text based on current state.
 */
const updateStatusBar = () => {
  if (!statusBarItem) return;

  const config = vscode.workspace.getConfiguration("strata");
  const enabled = config.get("enabled", true);
  const configured = isConfigured();

  if (!enabled) {
    statusBarItem.text = "$(circle-slash) Strata";
    statusBarItem.tooltip = "Strata tracking is disabled";
  } else if (!configured) {
    statusBarItem.text = "$(warning) Strata";
    statusBarItem.tooltip = "Strata: Click to configure your access token";
  } else {
    statusBarItem.text = "$(pulse) Strata";
    statusBarItem.tooltip = `Strata tracking  ·  project: ${sessionManager?.projectId ?? "—"}`;
  }
};

module.exports = { activate, deactivate };
