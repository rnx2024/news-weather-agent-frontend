// app/api/_server/config.ts

export const config = {
  backendUrl: process.env.BACKEND_URL ?? "",
  apiKey: process.env.EXTERNAL_API_KEY ?? "",
  backendTimeoutMs: Number(process.env.BACKEND_TIMEOUT_MS ?? "15000"),
} as const;

if (!config.backendUrl || !config.apiKey) {
  // Fail fast during build/runtime if misconfigured
  throw new Error("Missing BACKEND_URL or EXTERNAL_API_KEY");
}
