import { imageGeneratorRegistry } from "../generators/registry";
import { resolveOutputDir } from "../utils/paths";
import {
  DEFAULT_MODELS,
  getPluginCfg,
  pickEndpoint,
  resolveEndpoint,
  type PluginConfig,
  validateOpenAIImages,
} from "../utils/plugin-config";
import type { GenerateImageUseCaseInput, GenerateImageUseCaseResult } from "./types";

export class GenerateImageUseCase {
  async execute({ hostConfig, command }: GenerateImageUseCaseInput): Promise<GenerateImageUseCaseResult> {
    const basePluginCfg = getPluginCfg(hostConfig);

    const pluginCfg: PluginConfig = {
      ...basePluginCfg,
      endpoint: command.endpoint ?? basePluginCfg.endpoint,
      model: command.model ?? basePluginCfg.model,
      size: command.size ?? basePluginCfg.size,
      quality: command.quality ?? basePluginCfg.quality,
      style: command.style ?? basePluginCfg.style,
      sendMode: "file",
    };

    const endpoint = resolveEndpoint(pluginCfg);
    const { baseUrl, apiKey } = pickEndpoint(hostConfig, pluginCfg);
    const model = (pluginCfg.model ?? DEFAULT_MODELS[endpoint]).trim();
    const size = (pluginCfg.size ?? "1024x1024").trim();
    const quality = (pluginCfg.quality ?? "standard").trim();
    const sendMode = pluginCfg.sendMode ?? "file";
    const style = pluginCfg.style;
    const outputDir = resolveOutputDir(hostConfig, pluginCfg);

    if (endpoint === "openai-images") {
      validateOpenAIImages(model, size);
    }

    return await imageGeneratorRegistry.generate({
      endpoint,
      baseUrl,
      apiKey,
      prompt: command.prompt,
      model,
      size,
      quality,
      style,
      sendMode,
      outputDir,
    });
  }
}

export const generateImageUseCase = new GenerateImageUseCase();
