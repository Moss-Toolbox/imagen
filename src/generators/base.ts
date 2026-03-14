import OpenAI from "openai";
import { createOpenAIClient } from "./openai-client";
import { saveRemoteImage } from "./image-file";
import type { GenerateOpts, GenerateResult, ImageGenerator } from "./types";

export abstract class BaseImageGenerator implements ImageGenerator {
  protected createClient(opts: GenerateOpts): OpenAI {
    return createOpenAIClient(opts);
  }

  protected async saveRemoteImage(url: string, outputDir: string): Promise<string> {
    return saveRemoteImage(url, outputDir);
  }

  abstract generate(opts: GenerateOpts): Promise<GenerateResult>;
}
