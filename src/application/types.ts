import type { Endpoint, GenerateResult } from "../generators/types";

export type GenerateImageCommand = {
  prompt: string;
  endpoint?: Endpoint;
  model?: string;
  size?: string;
  quality?: string;
  style?: "vivid" | "natural";
};

export type GenerateImageUseCaseInput = {
  hostConfig: unknown;
  command: GenerateImageCommand;
};

export type GenerateImageUseCaseResult = GenerateResult;
