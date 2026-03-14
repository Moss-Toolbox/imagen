function parseImageUrl(url: string): { b64?: string; url?: string } {
  const dataUrlMatch = url.match(/^data:image\/[^;]+;base64,(.+)$/s);
  if (dataUrlMatch) {
    return { b64: dataUrlMatch[1] };
  }

  return { url };
}

function extractImageFromTextContent(text: string): { b64?: string; url?: string; text?: string } {
  const markdownImageMatch = text.match(/!\[[^\]]*\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/i);
  if (markdownImageMatch) {
    return parseImageUrl(markdownImageMatch[1]);
  }

  const inlineDataUrlMatch = text.match(/(data:image\/[^;]+;base64,[A-Za-z0-9+/=\s]+)/i);
  if (inlineDataUrlMatch) {
    return parseImageUrl(inlineDataUrlMatch[1].replace(/\s+/g, ""));
  }

  return { text };
}

export function extractImageFromChoices(choices: any[]): { b64?: string; url?: string; text?: string } {
  for (const choice of choices) {
    const msg = choice?.message;
    if (!msg) continue;

    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part?.type === "image_url" && typeof part?.image_url?.url === "string") {
          return parseImageUrl(part.image_url.url);
        }
        if (part?.type === "image" && typeof part?.source?.data === "string") {
          return { b64: part.source.data };
        }
        if (part?.type === "image" && typeof part?.image?.url === "string") {
          return parseImageUrl(part.image.url);
        }
      }
    }

    if (typeof msg.content === "string") {
      return extractImageFromTextContent(msg.content);
    }
  }
  return {};
}
