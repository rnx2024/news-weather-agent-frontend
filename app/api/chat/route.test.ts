// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_QUESTION_LENGTH } from "../../../lib/schemas";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubConfig() {
  vi.stubEnv("BACKEND_URL", "http://backend.test");
  vi.stubEnv("EXTERNAL_API_KEY", "test-key");
  vi.stubEnv("BACKEND_TIMEOUT_MS", "5000");
}

describe("POST /api/chat", () => {
  it("rejects an overlong question before creating a session", async () => {
    stubConfig();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://frontend.test/api/chat", {
        method: "POST",
        body: JSON.stringify({
          place: "Vigan",
          question: "x".repeat(MAX_QUESTION_LENGTH + 1),
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    stubConfig();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://frontend.test/api/chat", {
        method: "POST",
        body: "not-json",
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "BAD_REQUEST", message: "Invalid JSON body." },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 413 for a body over the configured byte limit", async () => {
    stubConfig();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://frontend.test/api/chat", {
        method: "POST",
        body: "x".repeat(32_001),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: { code: "REQUEST_TOO_LARGE" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
