import { BaseImageGenerator } from "./base";
import { saveImage } from "./image-file";
import type { GenerateOpts, GenerateResult } from "./types";

export class OpenAIImagesGenerator extends BaseImageGenerator {
  async generate(opts: GenerateOpts): Promise<GenerateResult> {
    const client = this.createClient(opts);
    const result = await client.images.generate({
      model: opts.model,
      prompt: opts.prompt,
      size: opts.size,
      quality: opts.quality,
      n: 1,
      ...(opts.style ? { style: opts.style } : {}),
      response_format: opts.sendMode === "file" ? "b64_json" : "url",
    } as any);

    const item = Array.isArray(result.data) ? result.data[0] : undefined;
    const revisedPrompt = typeof item?.revised_prompt === "string" ? item.revised_prompt : undefined;
    const b64 = typeof item?.b64_json === "string" ? item.b64_json : undefined;
    const outUrl = typeof item?.url === "string" ? item.url : undefined;

    if (opts.sendMode === "file") {
      if (!b64) throw new Error("Images API response did not include b64_json");
      const filePath = await saveImage(b64, opts.outputDir);
      return { kind: "file", value: filePath, revisedPrompt };
    }

    if (outUrl) return { kind: "url", value: outUrl, revisedPrompt };
    if (b64) {
      const filePath = await saveImage(b64, opts.outputDir);
      return { kind: "file", value: filePath, revisedPrompt };
    }

    throw new Error("Images API response did not include a usable image");
  }
}
