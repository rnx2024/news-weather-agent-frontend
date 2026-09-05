// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { chatRequest, newsRequest, weatherRequest } from "./api";
import { ApiError } from "./apiError";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chatRequest", () => {
  it("posts to /api/chat with the place and question, and parses a valid response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        place: "Cebu",
        final: "Looks fine for travel today.",
        risk_level: "low",
        travel_advice: ["Carry an umbrella"],
        sources: [{ type: "weather" }],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await chatRequest("Cebu", "Any disruptions?");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place: "Cebu", question: "Any disruptions?" }),
      })
    );
    expect(result.place).toBe("Cebu");
    expect(result.risk_level).toBe("low");
  });

  it("normalizes a null risk_level to undefined", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          place: "Cebu",
          final: "...",
          risk_level: null,
          travel_advice: [],
          sources: [],
        })
      )
    );

    const result = await chatRequest("Cebu", "");
    expect(result.risk_level).toBeUndefined();
  });

  it("throws an ApiError for a non-ok response instead of resolving", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Nope" } }), {
          status: 400,
          headers: { "content-type": "application/json" },
        })
      )
    );

    await expect(chatRequest("Cebu", "")).rejects.toMatchObject({
      message: "Nope",
    });
  });

  it("throws a clean ApiError when the response doesn't match the expected shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ unexpected: true }))
    );

    const error = await chatRequest("Cebu", "").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe(
      "Received an unexpected response from the backend."
    );
  });
});

describe("weatherRequest", () => {
  it("gets /api/weather with the place query param and parses a valid response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        place: "Vigan",
        summary: "Sunny, 28C",
        travel_relevance: "Good day for walking tours.",
        travel_advice: ["Bring sunscreen"],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await weatherRequest("Vigan");

    expect(fetchMock).toHaveBeenCalledWith("/api/weather?place=Vigan", {
      method: "GET",
    });
    expect(result.summary).toBe("Sunny, 28C");
  });

  it("retries a transient backend response once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "UPSTREAM_TIMEOUT" } }, 504)
      )
      .mockResolvedValueOnce(
        jsonResponse({
          place: "Vigan",
          summary: "Sunny, 28C",
          travel_relevance: "Good day for walking tours.",
          travel_advice: [],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(weatherRequest("Vigan")).resolves.toMatchObject({
      summary: "Sunny, 28C",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("newsRequest", () => {
  it("gets /api/news with the place query param and parses a valid response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        place: "Manila",
        recent_count: 1,
        items: [
          { title: "Local update", source: null, date: null, link: null },
        ],
        travel_relevance: "May affect transit.",
        note: "Showing up to 3 recent items.",
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await newsRequest("Manila");

    expect(fetchMock).toHaveBeenCalledWith("/api/news?place=Manila", {
      method: "GET",
    });
    expect(result.items[0].title).toBe("Local update");
    expect(result.items[0].source).toBeUndefined();
  });
});
