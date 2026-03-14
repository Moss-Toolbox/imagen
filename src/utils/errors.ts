export function toUserErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "Unknown error";
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}
