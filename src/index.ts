import { generateImageUseCase } from "./application/generate-image-use-case";
import { parseCommand } from "./application/command-parser";
import { toUserErrorMessage } from "./utils/errors";

export default function register(api: any) {
  api.registerTool({
    name: "image_generate",
    description: "Generate an image from a text prompt using chat completions (default) or OpenAI Images API",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: { type: "string", description: "Text prompt for the image" },
        model: { type: "string", description: "Override model (defaults to plugin config)" },
        size: { type: "string", description: "Override size (defaults to plugin config)" },
        quality: { type: "string", description: "Override quality (defaults to plugin config)" },
        style: { type: "string", enum: ["vivid", "natural"], description: "Optional style (openai-images endpoint)" },
        endpoint: { type: "string", enum: ["chat-completions", "openai-images"], description: "Override endpoint strategy" },
        raw: { type: "string", description: "Raw command args (alternate input for prompt)" }
      },
      required: []
    },
    async execute(_id: string, params: unknown, toolCtx?: any) {
      try {
        const command = parseCommand(params);
        const cfg = toolCtx?.config ?? api.config;
        const out = await generateImageUseCase.execute({
          hostConfig: cfg,
          command,
        });

        const lines: string[] = [];
        lines.push(out.revisedPrompt ? `Prompt: ${out.revisedPrompt}` : `Prompt: ${command.prompt}`);
        lines.push(`Image file: ${out.value}`);

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Image generation failed: ${toUserErrorMessage(err)}`,
            },
          ],
        };
      }
    }
  });
}
