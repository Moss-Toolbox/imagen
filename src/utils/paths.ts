import os from "node:os";
import path from "node:path";
import type { PluginConfig } from "./plugin-config";

export function getWorkspaceDir(cfg: any): string | undefined {
  const raw = cfg?.agents?.defaults?.workspace;
  if (typeof raw !== "string") return undefined;
  const v = raw.trim();
  if (!v) return undefined;
  if (v === "~") return os.homedir();
  if (v.startsWith("~/") || v.startsWith("~\\")) return path.join(os.homedir(), v.slice(2));
  return v;
}

export function getDefaultOutputDir(cfg: any): string {
  const workspace = getWorkspaceDir(cfg);
  if (workspace) return path.join(workspace, "media", "imagine");
  return path.join(os.homedir(), ".openclaw", "media", "imagine");
}

export function resolveOutputDir(cfg: any, pluginCfg: PluginConfig): string {
  const raw = pluginCfg.outputDir;
  if (typeof raw !== "string" || !raw.trim()) return getDefaultOutputDir(cfg);
  let v = raw.trim();
  if (v === "~") v = os.homedir();
  else if (v.startsWith("~/") || v.startsWith("~\\")) v = path.join(os.homedir(), v.slice(2));
  if (path.isAbsolute(v)) return v;
  const base = getWorkspaceDir(cfg) ?? path.join(os.homedir(), ".openclaw");
  return path.resolve(base, v);
}
