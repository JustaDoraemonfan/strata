import mongoose from "mongoose";

// A single pattern observation about the user's week
// Example: "Your error rate spiked on Wednesday afternoon"
const patternSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "peak_hour", // Best performing hour detected
        "high_error_rate", // Error rate above threshold
        "burnout_risk", // Burnout signals detected
        "focus_improvement", // Focus blocks getting longer
        "score_decline", // Stratum Score dropping over sessions
        "score_improvement", // Stratum Score improving over sessions
        "low_activity", // Very few sessions this week
      ],
      required: true,
    },
    message: {
      type: String,
      required: true, // Human readable — shown directly on frontend
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
  },
  { _id: false },
);

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      trim: true,
      index: true,
    },

    weekOf: {
      type: Date,
      required: [true, "weekOf is required"], // Always the Monday of the week
    },

    totalSessions: {
      type: Number,
      default: 0, // How many sessions this week
    },

    totalFocusTime: {
      type: Number,
      default: 0, // Total uninterrupted focus minutes across all sessions
    },

    averageStratumScore: {
      type: Number,
      default: null, // Average score across all scored sessions this week
      min: 0,
      max: 100,
    },

    peakHours: {
      type: [Number],
      default: [], // Array of hours (0-23) with highest avg Stratum Score
    },

    burnoutRiskScore: {
      type: Number,
      default: 0,
      min: [0, "Burnout risk cannot be below 0"],
      max: [100, "Burnout risk cannot exceed 100"],
    },

    burnoutRiskLevel: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      default: "low",
    },

    patterns: {
      type: [patternSchema],
      default: [], // Observations — shown as insight cards on frontend
    },

    scoreBreakdown: {
      monday: { type: Number, default: null },
      tuesday: { type: Number, default: null },
      wednesday: { type: Number, default: null },
      thursday: { type: Number, default: null },
      friday: { type: Number, default: null },
      saturday: { type: Number, default: null },
      sunday: { type: Number, default: null },
    }, // Daily average scores — powers the weekly trend chart
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// One insight document per user per week — no duplicates
insightSchema.index({ userId: 1, weekOf: -1 }, { unique: true });

const Insight = mongoose.model("Insight", insightSchema);

export default Insight;
