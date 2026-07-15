import { describe, expect, it } from "vitest";
import { modelName, shortModelName } from "./models";

describe("model display names", () => {
  it("omits Anthropic and OpenAI from compact chat labels", () => {
    expect(shortModelName("anthropic.claude-sonnet-4-5")).toBe("Claude Sonnet 4.5");
    expect(shortModelName("openai.gpt-5-2")).toBe("GPT 5.2");
    expect(shortModelName("eu.anthropic.claude-sonnet-4-5-20251001")).toBe("Claude Sonnet 4.5");
  });

  it("keeps full names and unrelated vendors unchanged", () => {
    expect(modelName("anthropic.claude-sonnet-4-5")).toBe("Anthropic Claude Sonnet 4.5");
    expect(shortModelName("google.gemini-3-pro")).toBe("Google Gemini 3 Pro");
  });
});
