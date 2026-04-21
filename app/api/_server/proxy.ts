import { NextResponse } from "next/server";
import { getServerConfig } from "./config";
import { fetchWithTimeout, jsonError } from "./http";

export async function proxyPlaceGet(req: Request, endpointPath: string) {
  const { searchParams } = new URL(req.url);
  const place = searchParams.get("place");
  if (!place) {
    return jsonError(400, "BAD_REQUEST", "Missing place parameter.");
  }

  const cfg = getServerConfig();
  if (!cfg.ok) {
    return jsonError(
      500,
      cfg.error.code,
      cfg.error.message,
      cfg.error.missing ? { missing: cfg.error.missing } : undefined
    );
  }

  const url = new URL(`${cfg.value.backendUrl}/${endpointPath}`);
  url.searchParams.set("place", place);

  let res: Response;
  try {
    res = await fetchWithTimeout(
      url.toString(),
      {
        headers: { "x-api-key": cfg.value.apiKey },
        cache: "no-store",
      },
      cfg.value.backendTimeoutMs
    );
  } catch (error: unknown) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return jsonError(
      504,
      isAbort ? "UPSTREAM_TIMEOUT" : "UPSTREAM_FETCH_FAILED",
      "Unable to reach backend service."
    );
  }

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

