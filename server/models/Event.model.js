import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      trim: true,
      index: true,
    },

    type: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: ["keystroke", "save", "commit", "error", "debug"],
        message: "{VALUE} is not a valid event type",
      },
    },

    timestamp: {
      type: Date,
      required: [true, "Timestamp is required"],
      default: Date.now,
    },

    sessionId: {
      type: String,
      required: [true, "sessionId is required"],
      trim: true,
      index: true,
    },

    projectId: {
      type: String,
      required: [true, "projectId is required"],
      trim: true,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
    versionKey: false, // Removes __v field — we don't need it
  },
);

// Compound index — the most common query pattern:
// "give me all events for this user in this time range"
eventSchema.index({ userId: 1, timestamp: -1 });

// Secondary compound — for session aggregation:
// "give me all events belonging to this session"
eventSchema.index({ sessionId: 1, timestamp: 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
