import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerConfig, type ServerConfig } from "../_server/config";
import { fetchWithTimeout, jsonError } from "../_server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Session = { session_id: string; session_token: string };
const isProduction = process.env.NODE_ENV === "production";

async function createSession(cfg: ServerConfig): Promise<Session> {
  const r = await fetchWithTimeout(
    `${cfg.backendUrl}/session`,
    {
      method: "POST",
      headers: { "x-api-key": cfg.apiKey },
      cache: "no-store",
    },
    cfg.backendTimeoutMs
  );
  if (!r.ok) throw new Error(`session ${r.status}`);
  const data = await r.json();
  return { session_id: data.session_id, session_token: data.session_token };
}

export async function POST(req: Request) {
  const cfg = getServerConfig();
  if (!cfg.ok) {
    return jsonError(
      500,
      cfg.error.code,
      cfg.error.message,
      cfg.error.missing ? { missing: cfg.error.missing } : undefined
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_REQUEST", "Invalid JSON body.");
  }

  // ---- read session from request cookies (await cookies())
  const jar = await cookies();
  let session: Session | null = null;
  const sid = jar.get("tb_sid")?.value;
  const stk = jar.get("tb_stk")?.value;
  if (sid && stk) {
    session = { session_id: sid, session_token: stk };
  }

  // ---- ensure session; remember if we must set new cookies on the response
  let setSessionOnResponse: Session | null = null;
  if (!session) {
    try {
      session = await createSession(cfg.value);
      setSessionOnResponse = session;
    } catch {
      return jsonError(502, "UPSTREAM_SESSION_FAILED", "Unable to create session.");
    }
  }

  const send = () =>
    fetchWithTimeout(
      `${cfg.value.backendUrl}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cfg.value.apiKey,
          "x-session-id": session!.session_id,
          "x-session-token": session!.session_token,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
      cfg.value.backendTimeoutMs
    );

  // ---- call backend; if unauthorized, refresh session and retry once
  let upstream: Response;
  try {
    upstream = await send();
  } catch (error: unknown) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    return jsonError(
      504,
      isAbort ? "UPSTREAM_TIMEOUT" : "UPSTREAM_FETCH_FAILED",
      "Unable to reach backend service."
    );
  }
  if (upstream.status === 401) {
    try {
      session = await createSession(cfg.value);
      setSessionOnResponse = session; // set new cookies on the final response
    } catch {
      return jsonError(502, "UPSTREAM_SESSION_FAILED", "Unable to refresh session.");
    }

    try {
      upstream = await send();
    } catch (error: unknown) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      return jsonError(
        504,
        isAbort ? "UPSTREAM_TIMEOUT" : "UPSTREAM_FETCH_FAILED",
        "Unable to reach backend service."
      );
    }
  }

  const text = await upstream.text();
  const resp = new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });

  // ---- write cookies on the outgoing response
  if (setSessionOnResponse) {
    resp.cookies.set("tb_sid", setSessionOnResponse.session_id, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      path: "/",
    });
    resp.cookies.set("tb_stk", setSessionOnResponse.session_token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProduction,
      path: "/",
    });
  }

  return resp;
}
