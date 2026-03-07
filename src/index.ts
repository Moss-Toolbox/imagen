import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

type PluginConfig = {
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

function validateModelAndSize(model: string, size: string) {
  const m = model.trim().toLowerCase();
  const s = size.trim();
  if (m === "dall-e-3" && !DALLE3_ALLOWED_SIZES.has(s)) {
    throw new Error(
      `Invalid size for dall-e-3: ${s}. Allowed: ${Array.from(DALLE3_ALLOWED_SIZES).join(", ")}`
    );
  }
}

function stringOrUndefined(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

function getPluginCfg(cfg: any): PluginConfig {
  const raw = cfg?.plugins?.entries?.imagen?.config;
  return (raw ?? {}) as PluginConfig;
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\s+/g, "").replace(/\/+$/, "");
  if (/\/v1$/.test(trimmed)) return trimmed;
  return `${trimmed}/v1`;
}

function getWorkspaceDir(cfg: any): string | undefined {
  const raw = cfg?.agents?.defaults?.workspace;
  if (typeof raw !== "string") return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (v === "~") return os.homedir();
  if (v.startsWith("~/") || v.startsWith("~\\")) return path.join(os.homedir(), v.slice(2));
  return v;
}

function getDefaultOutputDir(cfg: any): string {
  const workspace = getWorkspaceDir(cfg);
  if (workspace) return path.join(workspace, "media", "imagine");
  return path.join(os.homedir(), ".openclaw", "media", "imagine");
}

function resolveOutputDir(cfg: any, pluginCfg: PluginConfig): string {
  const raw = pluginCfg.outputDir;
  if (typeof raw !== "string" || !raw.trim()) return getDefaultOutputDir(cfg);
  let v = raw.trim();
  if (v === "~") v = os.homedir();
  else if (v.startsWith("~/") || v.startsWith("~\\")) v = path.join(os.homedir(), v.slice(2));
  if (path.isAbsolute(v)) return v;
  const base = getWorkspaceDir(cfg) ?? path.join(os.homedir(), ".openclaw");
  return path.resolve(base, v);
}

function pickEndpoint(cfg: any, pluginCfg: PluginConfig): { baseUrl: string; apiKey?: string } {
  if (typeof pluginCfg.baseUrl === "string" && pluginCfg.baseUrl.trim()) {
    return {
      baseUrl: normalizeBaseUrl(pluginCfg.baseUrl.trim()),
      apiKey: typeof pluginCfg.apiKey === "string" && pluginCfg.apiKey.trim() ? pluginCfg.apiKey.trim() : undefined,
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

function toUserErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "Unknown error";
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

async function callImagesApi(opts: {
  baseUrl: string;
  apiKey?: string;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  style?: "vivid" | "natural";
  sendMode: "file" | "url";
  outputDir: string;
}): Promise<{ kind: "file" | "url"; value: string; revisedPrompt?: string }>
{
  const url = `${opts.baseUrl}/images/generations`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (opts.apiKey) headers.authorization = `Bearer ${opts.apiKey}`;

  const body: any = {
    model: opts.model,
    prompt: opts.prompt,
    size: opts.size,
    quality: opts.quality,
    n: 1,
  };
  if (opts.style) body.style = opts.style;
  body.response_format = opts.sendMode === "file" ? "b64_json" : "url";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  let res: Response;
  try {
    // eslint-disable-next-line no-undef
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const apiMsg = json?.error?.message || json?.message;
    const reason = apiMsg ? `: ${String(apiMsg)}` : "";
    throw new Error(`Images API request failed (HTTP ${res.status})${reason}`);
  }

  const item = Array.isArray(json?.data) ? json.data[0] : undefined;
  const revisedPrompt = typeof item?.revised_prompt === "string" ? item.revised_prompt : undefined;

  const b64 = typeof item?.b64_json === "string" ? item.b64_json : undefined;
  const outUrl = typeof item?.url === "string" ? item.url : undefined;

  if (opts.sendMode === "file") {
    if (!b64) {
      throw new Error(
        "Images API response did not include b64_json (sendMode=file requires response_format=b64_json)"
      );
    }
    const buf = Buffer.from(b64, "base64");
    const fileName = `openclaw-imagen-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
    await fs.mkdir(opts.outputDir, { recursive: true });
    const filePath = path.join(opts.outputDir, fileName);
    await fs.writeFile(filePath, buf);
    return { kind: "file", value: filePath, revisedPrompt };
  }

  if (outUrl) return { kind: "url", value: outUrl, revisedPrompt };
  if (b64) {
    const buf = Buffer.from(b64, "base64");
    const fileName = `openclaw-imagen-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
    await fs.mkdir(opts.outputDir, { recursive: true });
    const filePath = path.join(opts.outputDir, fileName);
    await fs.writeFile(filePath, buf);
    return { kind: "file", value: filePath, revisedPrompt };
  }

  throw new Error("Images API response did not include a usable image (expected data[0].b64_json or data[0].url)");
}

async function generateFromText(cfg: any, prompt: string, overrides?: Partial<PluginConfig>) {
  const pluginCfg = { ...getPluginCfg(cfg), ...(overrides ?? {}) };
  const { baseUrl, apiKey } = pickEndpoint(cfg, pluginCfg);

  const model = (pluginCfg.model ?? "dall-e-3").trim();
  const size = (pluginCfg.size ?? "1024x1024").trim();
  const quality = (pluginCfg.quality ?? "standard").trim();
  const sendMode = pluginCfg.sendMode ?? "file";
  const style = pluginCfg.style;
  const outputDir = resolveOutputDir(cfg, pluginCfg);

  validateModelAndSize(model, size);

  return await callImagesApi({
    baseUrl,
    apiKey,
    prompt,
    model,
    size,
    quality,
    style,
    sendMode,
    outputDir,
  });
}

export default function register(api: any) {
  api.registerTool({
    name: "image_generate",
    description: "Generate an image from a text prompt (writes a local file; requests b64_json)",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        prompt: { type: "string", description: "Text prompt for the image" },
        model: { type: "string", description: "Override model (defaults to plugin config)" },
        size: { type: "string", description: "Override size (defaults to plugin config)" },
        quality: { type: "string", description: "Override quality (defaults to plugin config)" },
        style: { type: "string", enum: ["vivid", "natural"], description: "Optional style" },
        raw: { type: "string", description: "Raw command args (alternate input for prompt)" }
      },
      required: []
    },
    async execute(_id: string, params: any, toolCtx?: any) {
      const prompt =
        (typeof params === "string" ? params : undefined) ??
        (typeof params?.prompt === "string" ? params.prompt : undefined) ??
        (typeof params?.raw === "string" ? params.raw : undefined) ??
        "";

      const promptTrimmed = prompt.trim();
      if (!promptTrimmed) {
        return { content: [{ type: "text", text: "Missing required field: prompt" }] };
      }

      try {
        const cfg = toolCtx?.config ?? api.config;
        const out = await generateFromText(cfg, promptTrimmed, {
          model: stringOrUndefined(params?.model),
          size: stringOrUndefined(params?.size),
          quality: stringOrUndefined(params?.quality),
          style: params?.style === "vivid" || params?.style === "natural" ? params.style : undefined,
          sendMode: "file",
        });

        const lines: string[] = [];
        lines.push(out.revisedPrompt ? `Prompt: ${out.revisedPrompt}` : `Prompt: ${promptTrimmed}`);
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
