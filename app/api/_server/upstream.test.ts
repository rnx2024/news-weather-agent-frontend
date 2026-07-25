// @vitest-environment node
import { describe, expect, it } from "vitest";
import { passthrough } from "./upstream";

describe("passthrough", () => {
  it("forwards a JSON upstream response as-is", async () => {
    const upstream = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const result = await passthrough(upstream);

    expect(result.status).toBe(200);
    expect(result.headers.get("content-type")).toContain("application/json");
    expect(await result.json()).toEqual({ ok: true });
  });

  it("normalizes a non-JSON body on a successful status into a 502 JSON error", async () => {
    const upstream = new Response("<html>ok?</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });

    const result = await passthrough(upstream);

    expect(result.status).toBe(502);
    const body = await result.json();
    expect(body.error.code).toBe("UPSTREAM_ERROR");
    expect(JSON.stringify(body)).not.toContain("<html>");
  });

  it("normalizes a non-JSON error body (e.g. a suspended-host HTML page) without leaking it", async () => {
    const html = "<!doctype html><html><body>Service Suspended</body></html>";
    const upstream = new Response(html, {
      status: 503,
      headers: { "content-type": "text/html" },
    });

    const result = await passthrough(upstream);

    expect(result.status).toBe(503);
    const body = await result.json();
    expect(body.error.code).toBe("UPSTREAM_ERROR");
    expect(JSON.stringify(body)).not.toContain("Service Suspended");
  });
});
