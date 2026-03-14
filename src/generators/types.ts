export type Endpoint = "chat-completions" | "openai-images";

export type GenerateOpts = {
  baseUrl: string;
  apiKey?: string;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  style?: "vivid" | "natural";
  sendMode: "file" | "url";
  outputDir: string;
};

export type GenerateResult = { kind: "file" | "url"; value: string; revisedPrompt?: string };

export interface ImageGenerator {
  generate(opts: GenerateOpts): Promise<GenerateResult>;
}
