import dotenv from "dotenv";

dotenv.config();

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const toList = (value?: string): string[] =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(trimTrailingSlash);

const clientURL = trimTrailingSlash(
  process.env.CLIENT_URL || "http://localhost:3000"
);

const clientURLs = Array.from(
  new Set([
    clientURL,
    ...toList(process.env.CLIENT_URLS),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ])
);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 8000,
  mongoURI: process.env.MONGODB_URI?.trim() || "",
  dbName: process.env.MONGODB_DB_NAME || "system_designer",
  jwtSecret: process.env.JWT_SECRET || "",
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || "",
  geminiModels: toList(process.env.GEMINI_MODEL || process.env.GEMINI_MODELS),
  clientURL,
  clientURLs,
  aiProvider: process.env.AI_PROVIDER || "gemini",
};

/**
 * Fail fast with actionable messages instead of crashing later on the first
 * login attempt or database query.
 */
export const validateEnv = (): void => {
  const missing: string[] = [];

  if (!env.mongoURI) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Set them in Render -> Environment (or in backend/.env for local development)."
    );
  }

  if (env.jwtSecret.length < 32 && env.isProduction) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long in production. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
  }

  if (!env.geminiApiKey) {
    console.warn(
      "GEMINI_API_KEY is not configured. Authentication and project CRUD will work, but AI generation endpoints will fail."
    );
  }
};
