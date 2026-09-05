// @vitest-environment node
import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next security headers", () => {
  it("defines baseline browser security headers for every route", async () => {
    const rules = await nextConfig.headers?.();
    const headers = rules?.[0]?.headers ?? [];

    expect(rules?.[0]?.source).toBe("/:path*");
    expect(headers).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ])
    );
  });
});
