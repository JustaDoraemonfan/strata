import mongoose from "mongoose";
import { MONGO_URI, NODE_ENV } from "./env.js";

// Log every connection state change — critical for debugging Atlas drops
const registerConnectionEvents = () => {
  mongoose.connection.on("connected", () =>
    console.log("[db] ✅ MongoDB connected"),
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("[db] ⚠️  MongoDB disconnected"),
  );
  mongoose.connection.on("reconnected", () =>
    console.log("[db] 🔄 MongoDB reconnected"),
  );
  mongoose.connection.on("error", (err) =>
    console.error(`[db] ❌ MongoDB error: ${err.message}`),
  );
};

const connectDB = async () => {
  registerConnectionEvents();

  await mongoose.connect(MONGO_URI, {
    // Suppress Mongoose deprecation warnings — these are the right defaults
    serverSelectionTimeoutMS: 5000, // Fail fast if Atlas is unreachable (5s)
    socketTimeoutMS: 45000, // Drop slow queries after 45s
  });

  // Extra info in development — don't need this noise in production
  if (NODE_ENV === "development") {
    console.log(`[db] 📡 Host: ${mongoose.connection.host}`);
    console.log(`[db] 🗄️  Database: ${mongoose.connection.name}`);
  }
};

export default connectDB;
