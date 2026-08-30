import { cookies } from "next/headers";
import { z } from "zod";
import type { ServerConfig } from "../_server/config";
import { jsonError } from "../_server/http";
import {
  fetchBackend,
  passthrough,
  requireServerConfig,
  type FetchOrResponse,
} from "../_server/upstream";
import {
  ChatRequestSchema,
  MAX_REQUEST_BODY_BYTES,
  SessionResponseSchema,
} from "../../../lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Session = { session_id: string; session_token: string };
const isProduction = process.env.NODE_ENV === "production";

type SessionOrResponse =
  { ok: true; value: Session } | { ok: false; response: Response };

async function createSession(cfg: ServerConfig): Promise<SessionOrResponse> {
  const upstream = await fetchBackend(cfg, `${cfg.backendUrl}/session`, {
    method: "POST",
    headers: { "x-api-key": cfg.apiKey },
    cache: "no-store",
  });
  if (!upstream.ok) return upstream;

  if (!upstream.response.ok) {
    return {
      ok: false,
      response: jsonError(
        502,
        "UPSTREAM_SESSION_FAILED",
        `Backend session endpoint returned ${upstream.response.status}.`
      ),
    };
  }

  const data = await upstream.response.json();
  const parsed = SessionResponseSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(
        502,
        "UPSTREAM_SESSION_INVALID",
        "Backend returned an invalid session response."
      ),
    };
  }
  return {
    ok: true,
    value: parsed.data,
  };
}

export async function POST(req: Request) {
  const cfg = requireServerConfig();
  if (!cfg.ok) return cfg.response;

  const contentLength = Number(req.headers.get("content-length") ?? "");
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_REQUEST_BODY_BYTES
  ) {
    return jsonError(
      413,
      "REQUEST_TOO_LARGE",
      "Request is too large. Please shorten your message."
    );
  }

  let rawBody: unknown;
  try {
    const rawText = await req.text();
    if (new TextEncoder().encode(rawText).byteLength > MAX_REQUEST_BODY_BYTES) {
      return jsonError(
        413,
        "REQUEST_TOO_LARGE",
        "Request is too large. Please shorten your message."
      );
    }
    rawBody = JSON.parse(rawText) as unknown;
  } catch {
    return jsonError(400, "BAD_REQUEST", "Invalid JSON body.");
  }

  const parsedBody = ChatRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    const issue = parsedBody.error.issues[0];
    const field = issue?.path[0];
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      field
        ? { [String(field)]: issue.message }
        : z.treeifyError(parsedBody.error)
    );
  }
  const body = parsedBody.data;

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
    const created = await createSession(cfg.value);
    if (!created.ok) return created.response;
    session = created.value;
    setSessionOnResponse = session;
  }

  const send = () =>
    fetchBackend(cfg.value, `${cfg.value.backendUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.value.apiKey,
        "x-session-id": session!.session_id,
        "x-session-token": session!.session_token,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

  // ---- call backend; if unauthorized, refresh session and retry once
  let upstream: FetchOrResponse = await send();
  if (!upstream.ok) return upstream.response;

  if (upstream.response.status === 401) {
    const refreshed = await createSession(cfg.value);
    if (!refreshed.ok) return refreshed.response;
    session = refreshed.value;
    setSessionOnResponse = session; // set new cookies on the final response

    upstream = await send();
    if (!upstream.ok) return upstream.response;
  }

  const resp = await passthrough(upstream.response);

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
