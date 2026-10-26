import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";

export const isGeminiConfigured = (): boolean => Boolean(env.geminiApiKey);

if (!isGeminiConfigured()) {
  console.warn(
    "GEMINI_API_KEY is not configured. AI generation endpoints will return a configuration error."
  );
}

// The SDK requires a string; keep the client lazily usable even when the key is
// missing so the rest of the API (auth, projects, health) still starts.
export const genAI = new GoogleGenerativeAI(env.geminiApiKey || "missing-api-key");
