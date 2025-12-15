import "server-only";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const config = {
  backendUrl: requireEnv("BACKEND_URL"),
  apiKey: requireEnv("EXTERNAL_API_KEY"),
  // tune as needed
  backendTimeoutMs: Number(process.env.BACKEND_TIMEOUT_MS ?? "15000"),
};
