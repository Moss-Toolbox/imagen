import { describe, expect, it } from "vitest";

import { extractImageFromChoices } from "../src/generators/extract-image";

describe("extractImageFromChoices", () => {
  it("extracts base64 data from markdown-wrapped data image urls", () => {
    const result = extractImageFromChoices([
      {
        message: {
          content: "![image](data:image/jpeg;base64,QUJDREVGRw==)",
        },
      },
    ]);

    expect(result).toEqual({ b64: "QUJDREVGRw==" });
  });

  it("extracts remote urls from markdown-wrapped image links", () => {
    const result = extractImageFromChoices([
      {
        message: {
          content: "![preview](https://example.com/image.png)",
        },
      },
    ]);

    expect(result).toEqual({ url: "https://example.com/image.png" });
  });

  it("falls back to returning text when no image payload is present", () => {
    const result = extractImageFromChoices([
      {
        message: {
          content: "No image could be generated for this request.",
        },
      },
    ]);

    expect(result).toEqual({ text: "No image could be generated for this request." });
  });
});
