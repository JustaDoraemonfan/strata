// src/trackers/commit.js
// Detects git commits by watching the .git/HEAD and .git/COMMIT_EDITMSG files.
// When COMMIT_EDITMSG changes, a commit just happened.
// Sent immediately — commits are high-signal events.

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { sendEvent } = require("../api");

/**
 * @param {import('../sessionManager')} sessionManager
 * @returns {vscode.Disposable | null}
 */
const registerCommitTracker = (sessionManager) => {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return null;

  const workspaceRoot = folders[0].uri.fsPath;
  const commitMsgPath = path.join(workspaceRoot, ".git", "COMMIT_EDITMSG");

  // If there's no .git folder, this workspace isn't a git repo — skip
  if (!fs.existsSync(path.join(workspaceRoot, ".git"))) return null;

  // Watch for changes to COMMIT_EDITMSG — this file is rewritten on every commit
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.Uri.file(path.join(workspaceRoot, ".git")),
      "COMMIT_EDITMSG",
    ),
  );

  const handleCommit = () => {
    sessionManager.ping();

    // Try to read the commit message for metadata
    let commitMessage = "";
    try {
      commitMessage = fs.readFileSync(commitMsgPath, "utf8").trim();
      // Strip comment lines (lines starting with #)
      commitMessage = commitMessage
        .split("\n")
        .filter((line) => !line.startsWith("#"))
        .join("\n")
        .trim();
    } catch {
      // Can't read the message — that's fine, we still fire the event
    }

    sendEvent({
      type: "commit",
      sessionId: sessionManager.sessionId,
      projectId: sessionManager.projectId,
      timestamp: new Date().toISOString(),
      metadata: {
        message: commitMessage.slice(0, 200), // Cap at 200 chars
      },
    });
  };

  watcher.onDidChange(handleCommit);
  watcher.onDidCreate(handleCommit);

  return watcher;
};

module.exports = registerCommitTracker;
