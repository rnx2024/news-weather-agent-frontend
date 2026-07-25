// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ApiError, throwIfNotOk } from "./apiError";

describe("throwIfNotOk", () => {
  it("does not throw for an ok response", async () => {
    const res = new Response(null, { status: 200 });
    await expect(throwIfNotOk(res)).resolves.toBeUndefined();
  });

  it("throws with the JSON error message and code when provided", async () => {
    const res = new Response(
      JSON.stringify({
        error: { code: "BAD_REQUEST", message: "Place is required." },
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );

    await expect(throwIfNotOk(res)).rejects.toMatchObject({
      message: "Place is required.",
      code: "BAD_REQUEST",
      status: 400,
    });
  });

  it("falls back to a generic message when the JSON body has no error.message", async () => {
    const res = new Response(JSON.stringify({}), {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    await expect(throwIfNotOk(res)).rejects.toMatchObject({
      message: "Request failed with status 500.",
    });
  });

  it("does not leak a non-JSON response body (e.g. an HTML error page) into the message", async () => {
    const html = "<!doctype html><html><body>Service Suspended</body></html>";
    const res = new Response(html, {
      status: 503,
      headers: { "content-type": "text/html" },
    });

    const error = await throwIfNotOk(res).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Request failed with status 503.");
    expect((error as ApiError).message).not.toContain("<html>");
    expect((error as ApiError).message).not.toContain("Service Suspended");
  });
});
