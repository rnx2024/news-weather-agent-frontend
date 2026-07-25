// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerConfig } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getServerConfig", () => {
  it("returns CONFIG_MISSING listing every missing required var", () => {
    vi.stubEnv("BACKEND_URL", "");
    vi.stubEnv("EXTERNAL_API_KEY", "");

    const result = getServerConfig();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONFIG_MISSING");
      expect(result.error.missing).toEqual(["BACKEND_URL", "EXTERNAL_API_KEY"]);
    }
  });

  it("returns CONFIG_INVALID when BACKEND_TIMEOUT_MS is not a positive integer", () => {
    vi.stubEnv("BACKEND_URL", "http://localhost:8000");
    vi.stubEnv("EXTERNAL_API_KEY", "test-key");
    vi.stubEnv("BACKEND_TIMEOUT_MS", "not-a-number");

    const result = getServerConfig();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONFIG_INVALID");
    }
  });

  it("returns CONFIG_INVALID when BACKEND_URL is not a valid absolute URL", () => {
    vi.stubEnv("BACKEND_URL", "not-a-url");
    vi.stubEnv("EXTERNAL_API_KEY", "test-key");

    const result = getServerConfig();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONFIG_INVALID");
    }
  });

  it("returns ok:true with the parsed config when everything is valid", () => {
    vi.stubEnv("BACKEND_URL", "http://localhost:8000");
    vi.stubEnv("EXTERNAL_API_KEY", "test-key");
    vi.stubEnv("BACKEND_TIMEOUT_MS", "5000");

    const result = getServerConfig();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        backendUrl: "http://localhost:8000",
        apiKey: "test-key",
        backendTimeoutMs: 5000,
      });
    }
  });
});
