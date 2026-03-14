import { describe, expect, it } from "vitest";

import { parseCommand } from "../src/application/command-parser";

describe("parseCommand", () => {
  it("trims a string prompt", () => {
    expect(parseCommand("  draw a lighthouse  ")).toEqual({
      prompt: "draw a lighthouse",
      endpoint: undefined,
      model: undefined,
      size: undefined,
      quality: undefined,
      style: undefined,
    });
  });

  it("reads object fields and normalizes optional strings", () => {
    expect(
      parseCommand({
        prompt: "  forest trail  ",
        endpoint: "openai-images",
        model: "  dall-e-3  ",
        size: " 1024x1024 ",
        quality: " high ",
        style: "vivid",
      })
    ).toEqual({
      prompt: "forest trail",
      endpoint: "openai-images",
      model: "dall-e-3",
      size: "1024x1024",
      quality: "high",
      style: "vivid",
    });
  });

  it("falls back to raw and ignores unsupported enum values", () => {
    expect(
      parseCommand({
        raw: "  skyline at sunset  ",
        endpoint: "unknown-endpoint",
        style: "cinematic",
      })
    ).toEqual({
      prompt: "skyline at sunset",
      endpoint: undefined,
      model: undefined,
      size: undefined,
      quality: undefined,
      style: undefined,
    });
  });

  it("throws when prompt is missing or blank", () => {
    expect(() => parseCommand({ prompt: "   " })).toThrow(/Missing required field: prompt/);
    expect(() => parseCommand({})).toThrow(/Missing required field: prompt/);
  });
});
