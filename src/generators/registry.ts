import { ChatCompletionsGenerator } from "./chat-completions";
import { OpenAIImagesGenerator } from "./openai-images";
import type { Endpoint, GenerateOpts, GenerateResult, ImageGenerator } from "./types";

export class ImageGeneratorRegistry implements ImageGenerator {
  constructor(private readonly generators: Record<Endpoint, ImageGenerator>) {}

  async generate(opts: GenerateOpts & { endpoint: Endpoint }): Promise<GenerateResult> {
    const generator = this.generators[opts.endpoint];
    if (!generator) {
      throw new Error(`Unsupported endpoint: ${opts.endpoint}`);
    }
    return generator.generate(opts);
  }
}

export const imageGeneratorRegistry = new ImageGeneratorRegistry({
  "openai-images": new OpenAIImagesGenerator(),
  "chat-completions": new ChatCompletionsGenerator(),
});
