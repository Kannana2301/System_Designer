import { generateAIResponse as geminiGenerate } from "./gemini.service.js";

export type AIProvider = "gemini";

export const generateAIResponse = async (
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string> => {
  console.log('[AI Provider Debug] Using provider: gemini');
  return geminiGenerate(messages);
};

export const getCurrentProvider = (): AIProvider => {
  return "gemini";
};