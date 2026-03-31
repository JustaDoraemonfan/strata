// src/eventQueue.js
// Buffers events and flushes them in batches.
// Keystroke events are buffered and sent every 10 seconds.
// High-signal events (save, commit, error, debug) bypass the buffer
// and are sent immediately via the api directly.

const { sendEventBatch } = require("./api");

const FLUSH_INTERVAL_MS = 10 * 1000; // 10 seconds

class EventQueue {
  constructor() {
    this._queue = [];
    this._flushTimer = null;
  }

  /**
   * Starts the automatic flush interval.
   * Call this in extension activate().
   */
  start() {
    this._flushTimer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  /**
   * Adds an event to the buffer.
   * @param {Object} event
   */
  enqueue(event) {
    this._queue.push(event);
  }

  /**
   * Flushes all buffered events to the API immediately.
   * Called on interval and on extension deactivate.
   */
  async flush() {
    if (this._queue.length === 0) return;

    // Drain the queue atomically — take what's there, clear, then send.
    // If the send fails, we don't re-queue — silently discard.
    // Losing a few keystrokes is fine; blocking the developer is not.
    const batch = this._queue.splice(0, this._queue.length);
    await sendEventBatch(batch);
  }

  /**
   * Stops the flush timer and sends any remaining buffered events.
   * Call this in extension deactivate().
   */
  async dispose() {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }
    await this.flush();
  }
}

module.exports = EventQueue;
