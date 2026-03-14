import fs from "node:fs/promises";
import path from "node:path";

export async function saveImage(b64: string, outputDir: string): Promise<string> {
  const buf = Buffer.from(b64, "base64");
  const fileName = `openclaw-imagen-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, buf);
  return filePath;
}

export async function saveRemoteImage(url: string, outputDir: string): Promise<string> {
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Failed to download image from URL (HTTP ${imgRes.status})`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const fileName = `openclaw-imagen-${Date.now()}-${Math.random().toString(16).slice(2)}.png`;
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, buf);
  return filePath;
}
