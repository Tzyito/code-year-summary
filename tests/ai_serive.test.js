import { describe, it, expect } from "vitest";
import AIService from "../src/services/ai-service.js";
import dotenv from "dotenv";
dotenv.config();

describe(
  "AIService with Multiple Models",
  () => {
    it("should generate review using OpenAI", async () => {
      let aiService = new AIService({
        type: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4o-mini",
      });
      const prompt = "Say Hello!";
      const response = await aiService.generateReview(prompt);
      expect(response).toBeDefined();
    });
    it("should generate review using Claude", async () => {
      let aiService = new AIService({
        type: "claude",
        apiKey: process.env.CLAUDE_API_KEY,
        model: "claude-3-5-sonnet-20241022",
      });
      const prompt = "Say Hello!";
      const response = await aiService.generateReview(prompt);
      expect(response).toBeDefined();
    });
  },
  {
    timeout: 1000000,
  },
);
