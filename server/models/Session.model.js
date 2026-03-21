import mongoose from "mongoose";

const focusBlockSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
  },
  { _id: false }, // Sub-documents don't need their own _id
);

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      trim: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: [true, "sessionId is required"],
      trim: true,
      unique: true, // One session document per sessionId — no duplicates
    },

    projectId: {
      type: String,
      required: [true, "projectId is required"],
      trim: true,
    },

    startTime: {
      type: Date,
      required: [true, "startTime is required"],
    },

    endTime: {
      type: Date,
      required: [true, "endTime is required"],
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: [0, "Duration cannot be negative"],
    },

    stratumScore: {
      type: Number,
      default: null, // Null until scoring service computes it
      min: [0, "Stratum score cannot be below 0"],
      max: [100, "Stratum score cannot exceed 100"],
    },

    focusBlocks: {
      type: [focusBlockSchema],
      default: [], // Array of uninterrupted coding blocks
    },

    interruptionCount: {
      type: Number,
      default: 0, // Number of times coding flow was broken
      min: [0, "Interruption count cannot be negative"],
    },

    totalEvents: {
      type: Number,
      default: 0, // Total raw events that built this session
    },

    eventBreakdown: {
      keystroke: { type: Number, default: 0 },
      save: { type: Number, default: 0 },
      commit: { type: Number, default: 0 },
      error: { type: Number, default: 0 },
      debug: { type: Number, default: 0 },
    }, // Count per event type — feeds Stratum Score computation

    scored: {
      type: Boolean,
      default: false, // Flag — has the scoring service processed this session yet?
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Primary query pattern — "give me all sessions for this user in this time range"
sessionSchema.index({ userId: 1, startTime: -1 });

// Scoring service query — "give me all unscored sessions"
sessionSchema.index({ scored: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
