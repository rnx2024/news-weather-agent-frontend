// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { proxyPlaceGet } from "./proxy";
import { MAX_PLACE_LENGTH } from "../../../lib/schemas";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubConfig() {
  vi.stubEnv("BACKEND_URL", "http://backend.test");
  vi.stubEnv("EXTERNAL_API_KEY", "test-key");
  vi.stubEnv("BACKEND_TIMEOUT_MS", "5000");
}

describe("proxyPlaceGet", () => {
  it("rejects a blank place without calling the backend", async () => {
    stubConfig();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyPlaceGet(
      new Request("http://frontend.test/api/weather?place=%20%20%20"),
      "weather"
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an overlong place without calling the backend", async () => {
    stubConfig();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyPlaceGet(
      new Request(
        `http://frontend.test/api/weather?place=${"x".repeat(MAX_PLACE_LENGTH + 1)}`
      ),
      "weather"
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims a valid place before forwarding it", async () => {
    stubConfig();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    const response = await proxyPlaceGet(
      new Request("http://frontend.test/api/weather?place=%20Vigan%20"),
      "weather"
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "http://backend.test/weather?place=Vigan",
      expect.objectContaining({
        headers: { "x-api-key": "test-key" },
      })
    );
  });
});
