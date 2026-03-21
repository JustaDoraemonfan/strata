import dotenv from "dotenv";
dotenv.config();

const REQUIRED_VARS = ["PORT", "MONGO_URI", "NODE_ENV"];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[env] ❌ Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;
export const NODE_ENV = process.env.NODE_ENV;
