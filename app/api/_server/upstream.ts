import { NextResponse } from "next/server";
import { getServerConfig, type ServerConfig } from "./config";
import { fetchWithTimeout, jsonError } from "./http";

export type ConfigOrResponse =
  { ok: true; value: ServerConfig } | { ok: false; response: Response };

export function requireServerConfig(): ConfigOrResponse {
  const cfg = getServerConfig();
  if (!cfg.ok) {
    return {
      ok: false,
      response: jsonError(
        500,
        cfg.error.code,
        cfg.error.message,
        cfg.error.missing ? { missing: cfg.error.missing } : undefined
      ),
    };
  }
  return { ok: true, value: cfg.value };
}

export type FetchOrResponse =
  { ok: true; response: Response } | { ok: false; response: Response };

export async function fetchBackend(
  cfg: ServerConfig,
  input: RequestInfo | URL,
  init: RequestInit
): Promise<FetchOrResponse> {
  try {
    const res = await fetchWithTimeout(input, init, cfg.backendTimeoutMs);
    return { ok: true, response: res };
  } catch (error: unknown) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      response: jsonError(
        504,
        isAbort ? "UPSTREAM_TIMEOUT" : "UPSTREAM_FETCH_FAILED",
        "Unable to reach backend service."
      ),
    };
  }
}

export async function passthrough(upstream: Response): Promise<NextResponse> {
  const contentType = upstream.headers.get("content-type") ?? "";

  // The backend is a JSON-only API. If it (or an intermediary, e.g. a
  // suspended-host page) ever returns a non-JSON body, don't forward it
  // verbatim — normalize it into the app's own clean error shape instead.
  if (!contentType.includes("application/json")) {
    return jsonError(
      upstream.ok ? 502 : upstream.status,
      "UPSTREAM_ERROR",
      "Backend returned an unexpected response."
    );
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}
