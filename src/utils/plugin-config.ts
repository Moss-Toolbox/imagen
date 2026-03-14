import type { Endpoint } from "../generators/types";

export type PluginConfig = {
  endpoint?: Endpoint;
  providerId?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  size?: string;
  quality?: string;
  style?: "vivid" | "natural";
  sendMode?: "file" | "url";
  outputDir?: string;
};

type ProviderCfg = {
  baseUrl?: unknown;
  apiKey?: unknown;
};

const DALLE3_ALLOWED_SIZES = new Set(["1024x1024", "1024x1792", "1792x1024"]);

export const DEFAULT_MODELS: Record<Endpoint, string> = {
  "chat-completions": "gpt-4o",
  "openai-images": "dall-e-3",
};

export function validateOpenAIImages(model: string, size: string) {
  const m = model.trim().toLowerCase();
  const s = size.trim();
  if (m === "dall-e-3" && !DALLE3_ALLOWED_SIZES.has(s)) {
    throw new Error(
      `Invalid size for dall-e-3: ${s}. Allowed: ${Array.from(DALLE3_ALLOWED_SIZES).join(", ")}`
    );
  }
}

export function getPluginCfg(cfg: any): PluginConfig {
  const raw = cfg?.plugins?.entries?.imagen?.config;
  return (raw ?? {}) as PluginConfig;
}

export function normalizeBaseUrl(baseUrl: string, appendV1 = true): string {
  const trimmed = baseUrl.replace(/\s+/g, "").replace(/\/+$/, "");
  if (!appendV1) return trimmed;
  if (/\/v\d+$/.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
}

export function pickEndpoint(cfg: any, pluginCfg: PluginConfig): { baseUrl: string; apiKey?: string } {
  if (typeof pluginCfg.baseUrl === "string" && pluginCfg.baseUrl.trim()) {
    return {
      baseUrl: normalizeBaseUrl(pluginCfg.baseUrl.trim()),
      apiKey:
        typeof pluginCfg.apiKey === "string" && pluginCfg.apiKey.trim()
          ? pluginCfg.apiKey.trim()
          : undefined,
    };
  }

  const providerId = (pluginCfg.providerId ?? "openai").trim();
  const provider: ProviderCfg | undefined = cfg?.models?.providers?.[providerId];
  const baseFromProvider = typeof provider?.baseUrl === "string" ? provider.baseUrl : undefined;
  const keyFromProvider = typeof provider?.apiKey === "string" ? provider.apiKey : undefined;

  return {
    baseUrl: normalizeBaseUrl((baseFromProvider ?? "https://api.openai.com/v1").trim()),
    apiKey:
      (typeof pluginCfg.apiKey === "string" && pluginCfg.apiKey.trim() ? pluginCfg.apiKey.trim() : undefined) ??
      (keyFromProvider && keyFromProvider.trim() ? keyFromProvider.trim() : undefined),
  };
}

export function resolveEndpoint(pluginCfg: PluginConfig): Endpoint {
  const raw = pluginCfg.endpoint;
  if (raw === "openai-images" || raw === "chat-completions") return raw;
  return "chat-completions";
}
