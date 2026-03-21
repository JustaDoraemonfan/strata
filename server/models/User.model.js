import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },

    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      minlength: [2, "Display name must be at least 2 characters"],
      maxlength: [50, "Display name cannot exceed 50 characters"],
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    preferences: {
      interruptionThresholdMinutes: {
        type: Number,
        default: 5,
      },
      weeklyReportEnabled: {
        type: Boolean,
        default: true,
      },
    },

    refreshToken: {
      type: String,
      default: null,
      select: false, // Never returned in queries by default
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─────────────────────────────────────────────
// PASSWORD HASHING HOOK
// ─────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;

  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  } catch (error) {
    return next(error);
  }
});

// ─────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────

/**
 * Compares a plain text password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
