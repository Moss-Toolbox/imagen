import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getPluginCfg,
  normalizeBaseUrl,
  pickEndpoint,
  resolveEndpoint,
  validateOpenAIImages,
} from "../src/utils/plugin-config";
import { getDefaultOutputDir, getWorkspaceDir, resolveOutputDir } from "../src/utils/paths";
import { stringOrUndefined } from "../src/utils/strings";

describe("utility helpers", () => {
  it("stringOrUndefined trims strings and rejects blank or non-string values", () => {
    expect(stringOrUndefined("  hello  ")).toBe("hello");
    expect(stringOrUndefined("   ")).toBeUndefined();
    expect(stringOrUndefined(123)).toBeUndefined();
  });

  it("validateOpenAIImages accepts supported dall-e-3 sizes and rejects unsupported ones", () => {
    expect(() => validateOpenAIImages("dall-e-3", "1024x1024")).not.toThrow();
    expect(() => validateOpenAIImages("gpt-image-1", "512x512")).not.toThrow();
    expect(() => validateOpenAIImages("dall-e-3", "512x512")).toThrow(/Invalid size for dall-e-3: 512x512/);
  });

  it("getPluginCfg returns nested imagen config or an empty object", () => {
    expect(getPluginCfg({ plugins: { entries: { imagen: { config: { endpoint: "openai-images" } } } } })).toEqual({
      endpoint: "openai-images",
    });
    expect(getPluginCfg({})).toEqual({});
  });

  it("normalizeBaseUrl trims whitespace, strips trailing slashes, and appends /v1", () => {
    expect(normalizeBaseUrl(" https://api.example.com/ ")).toBe("https://api.example.com/v1");
    expect(normalizeBaseUrl("https://api.example.com/v1///")).toBe("https://api.example.com/v1");
    expect(normalizeBaseUrl(" https://api.example.com/custom/ ", false)).toBe("https://api.example.com/custom");
  });

  it("pickEndpoint prefers explicit plugin baseUrl and plugin apiKey", () => {
    expect(
      pickEndpoint(
        {
          models: {
            providers: {
              openai: { baseUrl: "https://provider.example.com", apiKey: "provider-key" },
            },
          },
        },
        { baseUrl: " https://plugin.example.com/ ", apiKey: " plugin-key " }
      )
    ).toEqual({
      baseUrl: "https://plugin.example.com/v1",
      apiKey: "plugin-key",
    });
  });

  it("pickEndpoint falls back to provider config and default provider settings", () => {
    expect(
      pickEndpoint(
        {
          models: {
            providers: {
              custom: { baseUrl: "https://custom.example.com/", apiKey: " custom-key " },
            },
          },
        },
        { providerId: "custom" }
      )
    ).toEqual({
      baseUrl: "https://custom.example.com/v1",
      apiKey: "custom-key",
    });

    expect(pickEndpoint({}, {})).toEqual({
      baseUrl: "https://api.openai.com/v1",
      apiKey: undefined,
    });
  });

  it("resolveEndpoint defaults to chat-completions", () => {
    expect(resolveEndpoint({ endpoint: "openai-images" })).toBe("openai-images");
    expect(resolveEndpoint({ endpoint: "chat-completions" })).toBe("chat-completions");
    expect(resolveEndpoint({})).toBe("chat-completions");
  });

  it("getWorkspaceDir resolves configured workspace values", () => {
    expect(getWorkspaceDir({})).toBeUndefined();
    expect(getWorkspaceDir({ agents: { defaults: { workspace: "  /tmp/project  " } } })).toBe("/tmp/project");
    expect(getWorkspaceDir({ agents: { defaults: { workspace: "~" } } })).toBe(os.homedir());
    expect(getWorkspaceDir({ agents: { defaults: { workspace: "~/project" } } })).toBe(path.join(os.homedir(), "project"));
  });

  it("getDefaultOutputDir and resolveOutputDir build paths from workspace and home", () => {
    expect(getDefaultOutputDir({ agents: { defaults: { workspace: "/workspace" } } })).toBe(
      path.join("/workspace", "media", "imagine")
    );

    expect(resolveOutputDir({ agents: { defaults: { workspace: "/workspace" } } }, {})).toBe(
      path.join("/workspace", "media", "imagine")
    );

    expect(resolveOutputDir({}, { outputDir: "~/images" })).toBe(path.join(os.homedir(), "images"));
    expect(resolveOutputDir({}, { outputDir: "/tmp/images" })).toBe("/tmp/images");
    expect(resolveOutputDir({ agents: { defaults: { workspace: "/workspace" } } }, { outputDir: "renders" })).toBe(
      path.resolve("/workspace", "renders")
    );
  });
});
