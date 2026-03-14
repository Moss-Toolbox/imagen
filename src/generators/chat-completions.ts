import { BaseImageGenerator } from "./base";
import { extractImageFromChoices } from "./extract-image";
import { saveImage } from "./image-file";
import type { GenerateOpts, GenerateResult } from "./types";

export class ChatCompletionsGenerator extends BaseImageGenerator {
  async generate(opts: GenerateOpts): Promise<GenerateResult> {
    const client = this.createClient(opts);
    const completion = await client.chat.completions.create({
      model: opts.model,
      messages: [
        {
          role: "user",
          content: `Generate an image: ${opts.prompt}`,
        },
      ],
      max_tokens: 4096,
      ...(opts.size ? { size: opts.size } : {}),
      ...(opts.quality ? { quality: opts.quality } : {}),
    } as any);

    const choices = Array.isArray(completion?.choices) ? completion.choices : [];
    if (choices.length === 0) {
      throw new Error("Chat completions response contained no choices");
    }

    const extracted = extractImageFromChoices(choices);

    if (extracted.b64) {
      const filePath = await saveImage(extracted.b64, opts.outputDir);
      return { kind: "file", value: filePath };
    }

    if (extracted.url) {
      if (opts.sendMode === "file") {
        const filePath = await this.saveRemoteImage(extracted.url, opts.outputDir);
        return { kind: "file", value: filePath };
      }
      return { kind: "url", value: extracted.url };
    }

    if (extracted.text) {
      throw new Error(`Model did not return an image. Response: ${extracted.text.slice(0, 300)}`);
    }

    throw new Error("Chat completions response did not include a usable image");
  }
}
