// app/api/_server/config.ts

export type ServerConfig = Readonly<{
  backendUrl: string;
  apiKey: string;
  backendTimeoutMs: number;
}>;

export type ConfigError = Readonly<{
  code: "CONFIG_MISSING" | "CONFIG_INVALID";
  message: string;
  missing?: string[];
}>;

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function isValidPositiveInt(value: number) {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

export function getServerConfig(): Result<ServerConfig, ConfigError> {
  const backendUrl = process.env.BACKEND_URL ?? "";
  const apiKey = process.env.EXTERNAL_API_KEY ?? "";
  const backendTimeoutMsRaw = Number(process.env.BACKEND_TIMEOUT_MS ?? "15000");

  const missing: string[] = [];
  if (!backendUrl) missing.push("BACKEND_URL");
  if (!apiKey) missing.push("EXTERNAL_API_KEY");
  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        code: "CONFIG_MISSING",
        message: "Missing required server configuration.",
        missing,
      },
    };
  }

  if (!isValidPositiveInt(backendTimeoutMsRaw)) {
    return {
      ok: false,
      error: {
        code: "CONFIG_INVALID",
        message: "BACKEND_TIMEOUT_MS must be a positive integer.",
      },
    };
  }

  try {
    // Ensures we have an absolute URL (e.g. http://localhost:8000)
    // Throws for invalid values.
    new URL(backendUrl);
  } catch {
    return {
      ok: false,
      error: {
        code: "CONFIG_INVALID",
        message: "BACKEND_URL must be a valid absolute URL.",
      },
    };
  }

  return {
    ok: true,
    value: {
      backendUrl,
      apiKey,
      backendTimeoutMs: backendTimeoutMsRaw,
    },
  };
}
