import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/**/*.test.ts"],
          environment: "node",
          clearMocks: true,
          restoreMocks: true,
        },
      },
      {
        test: {
          name: "e2e",
          include: ["e2e/**/*.test.ts"],
          environment: "node",
          clearMocks: true,
          restoreMocks: true,
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
