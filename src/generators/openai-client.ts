import OpenAI from "openai";
import type { GenerateOpts } from "./types";

export function createOpenAIClient(opts: Pick<GenerateOpts, "baseUrl" | "apiKey">): OpenAI {
  return new OpenAI({
    baseURL: opts.baseUrl,
    apiKey: opts.apiKey || "missing-api-key",
    timeout: 90_000,
  });
}
