import type { Endpoint } from "../generators/types";
import { stringOrUndefined } from "../utils/strings";
import type { GenerateImageCommand } from "./types";

function parseEndpoint(value: unknown): Endpoint | undefined {
  return value === "chat-completions" || value === "openai-images" ? value : undefined;
}

function parseStyle(value: unknown): "vivid" | "natural" | undefined {
  return value === "vivid" || value === "natural" ? value : undefined;
}

export function parseCommand(params: unknown): GenerateImageCommand {
  const prompt =
    (typeof params === "string" ? params : undefined) ??
    (typeof params === "object" && params !== null && typeof (params as { prompt?: unknown }).prompt === "string"
      ? (params as { prompt: string }).prompt
      : undefined) ??
    (typeof params === "object" && params !== null && typeof (params as { raw?: unknown }).raw === "string"
      ? (params as { raw: string }).raw
      : undefined) ??
    "";

  const promptTrimmed = prompt.trim();
  if (!promptTrimmed) {
    throw new Error("Missing required field: prompt");
  }

  const objectParams = typeof params === "object" && params !== null ? params as Record<string, unknown> : undefined;

  return {
    prompt: promptTrimmed,
    endpoint: parseEndpoint(objectParams?.endpoint),
    model: stringOrUndefined(objectParams?.model),
    size: stringOrUndefined(objectParams?.size),
    quality: stringOrUndefined(objectParams?.quality),
    style: parseStyle(objectParams?.style),
  };
}
