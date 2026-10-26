import { env } from "../../config/env.js";
import { genAI, isGeminiConfigured } from "../../config/gemini.js";

// GEMINI_MODEL / GEMINI_MODELS can add overrides (comma separated). Configured
// models are tried first, then the stable defaults, so a typo or a retired
// model name does not take every AI feature down.
const DEFAULT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
];

const MODELS = Array.from(new Set([...env.geminiModels, ...DEFAULT_MODELS]));

export const generateAIResponse = async (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string> => {
  if (!isGeminiConfigured()) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to the Render environment variables."
    );
  }

  const systemMessage = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const contents = chatMessages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  let lastError: any = null;

  for (const modelName of MODELS) {
    try {
      console.log(`[Gemini Service] Attempting generation with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemMessage?.content,
      });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();
      if (text) {
        return text;
      }
    } catch (error: any) {
      console.warn(
        `[Gemini Service] Model ${modelName} failed:`,
        error.message || error
      );
      lastError = error;
    }
  }

  const message =
    lastError?.message || "All Gemini models failed to generate a response.";
  throw new Error(
    `AI generation failed. Check GEMINI_API_KEY and GEMINI_MODEL. Last error: ${message}`
  );
};
