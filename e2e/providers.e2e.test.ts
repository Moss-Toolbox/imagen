import fs from "node:fs/promises";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { beforeAll, describe, expect, it } from "vitest";

import { GenerateImageUseCase } from "../src/application/generate-image-use-case";

loadEnv({ path: ".env.e2e.local", override: false });

type E2ETarget = {
  name: string;
  endpoint: "chat-completions" | "openai-images";
  providerId: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  size?: string;
};

const prompt = process.env.IMAGEN_E2E_PROMPT?.trim() || "A small watercolor fox sitting on a mossy rock";
const outputDir = process.env.IMAGEN_E2E_OUTPUT_DIR?.trim() || ".tmp/imagen-e2e";
const enabled = process.env.IMAGEN_E2E === "1" && process.env.CI !== "true";

const targets = [
  {
    name: "chat-completions",
    endpoint: "chat-completions" as const,
    providerId: process.env.IMAGEN_E2E_CHAT_PROVIDER_ID?.trim() || "e2e-chat",
    baseUrl: process.env.IMAGEN_E2E_CHAT_BASE_URL?.trim() || "",
    apiKey: process.env.IMAGEN_E2E_CHAT_API_KEY?.trim() || undefined,
    model: process.env.IMAGEN_E2E_CHAT_MODEL?.trim() || "gpt-4o",
    size: "1024x1024",
  },
  {
    name: "openai-images",
    endpoint: "openai-images" as const,
    providerId: process.env.IMAGEN_E2E_IMAGES_PROVIDER_ID?.trim() || "e2e-images",
    baseUrl: process.env.IMAGEN_E2E_IMAGES_BASE_URL?.trim() || "",
    apiKey: process.env.IMAGEN_E2E_IMAGES_API_KEY?.trim() || undefined,
    model: process.env.IMAGEN_E2E_IMAGES_MODEL?.trim() || "dall-e-3",
    size: "1024x1024",
  },
] satisfies E2ETarget[];

const configuredTargets = targets.filter((target) => Boolean(target.baseUrl));

const testSuite = enabled ? describe : describe.skip;

testSuite("provider-backed e2e image generation", () => {
  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  it("requires at least one configured e2e target", () => {
    expect(configuredTargets.length).toBeGreaterThan(0);
  });

  for (const target of configuredTargets) {
    it(`generates an image via ${target.name}`, async () => {
      const useCase = new GenerateImageUseCase();

      const result = await useCase.execute({
        hostConfig: {
          agents: {
            defaults: {
              workspace: process.cwd(),
            },
          },
          models: {
            providers: {
              [target.providerId]: {
                baseUrl: target.baseUrl,
                apiKey: target.apiKey,
              },
            },
          },
          plugins: {
            entries: {
              imagen: {
                config: {
                  providerId: target.providerId,
                  endpoint: target.endpoint,
                  model: target.model,
                  outputDir,
                },
              },
            },
          },
        },
        command: {
          prompt,
          endpoint: target.endpoint,
          model: target.model,
          ...(target.size ? { size: target.size } : {}),
        },
      });

      expect(["file", "url"]).toContain(result.kind);

      if (result.kind === "file") {
        const stats = await fs.stat(result.value);
        expect(stats.size).toBeGreaterThan(0);
        expect(path.dirname(result.value)).toContain(path.basename(outputDir));
        return;
      }

      expect(result.value).toMatch(/^https?:\/\//);
    }, 120_000);
  }
});
