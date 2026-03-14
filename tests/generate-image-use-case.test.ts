import { afterEach, describe, expect, it, vi } from "vitest";

const { generateMock } = vi.hoisted(() => ({
  generateMock: vi.fn(),
}));

vi.mock("../src/generators/registry", () => ({
  imageGeneratorRegistry: {
    generate: generateMock,
  },
}));

import { GenerateImageUseCase } from "../src/application/generate-image-use-case";

describe("GenerateImageUseCase", () => {
  afterEach(() => {
    generateMock.mockReset();
  });

  it("builds generator input from defaults and resolved host config", async () => {
    generateMock.mockResolvedValue({ kind: "file", value: "/tmp/image.png" });

    const useCase = new GenerateImageUseCase();

    const result = await useCase.execute({
      hostConfig: {
        agents: { defaults: { workspace: "/workspace" } },
        models: {
          providers: {
            openai: {
              baseUrl: "https://provider.example.com/",
              apiKey: " provider-key ",
            },
          },
        },
        plugins: {
          entries: {
            imagen: {
              config: {
                endpoint: "openai-images",
                size: "1792x1024",
                style: "natural",
              },
            },
          },
        },
      },
      command: {
        prompt: "Draw a fox",
      },
    });

    expect(result).toEqual({ kind: "file", value: "/tmp/image.png" });
    expect(generateMock).toHaveBeenCalledWith({
      endpoint: "openai-images",
      baseUrl: "https://provider.example.com/v1",
      apiKey: "provider-key",
      prompt: "Draw a fox",
      model: "dall-e-3",
      size: "1792x1024",
      quality: "standard",
      style: "natural",
      sendMode: "file",
      outputDir: "/workspace/media/imagine",
    });
  });

  it("lets command overrides win over plugin config", async () => {
    generateMock.mockResolvedValue({ kind: "url", value: "https://example.com/image.png" });

    const useCase = new GenerateImageUseCase();

    await useCase.execute({
      hostConfig: {
        plugins: {
          entries: {
            imagen: {
              config: {
                endpoint: "chat-completions",
                model: "gpt-4o",
                quality: "standard",
                style: "natural",
              },
            },
          },
        },
      },
      command: {
        prompt: "Draw a city",
        endpoint: "openai-images",
        model: "gpt-image-1",
        size: "1024x1024",
        quality: "high",
        style: "vivid",
      },
    });

    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "openai-images",
        model: "gpt-image-1",
        size: "1024x1024",
        quality: "high",
        style: "vivid",
      })
    );
  });

  it("rejects invalid dall-e-3 size combinations before calling a generator", async () => {
    const useCase = new GenerateImageUseCase();

    await expect(
      useCase.execute({
        hostConfig: {
          plugins: {
            entries: {
              imagen: {
                config: {
                  endpoint: "openai-images",
                },
              },
            },
          },
        },
        command: {
          prompt: "Draw a spaceship",
          size: "512x512",
        },
      })
    ).rejects.toThrow(/Invalid size for dall-e-3: 512x512/);

    expect(generateMock).not.toHaveBeenCalled();
  });
});
