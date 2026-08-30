import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
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
type ChatBody = z.infer<typeof ChatRequestSchema>;
const isProduction = process.env.NODE_ENV === "production";

type SessionOrResponse =
  { ok: true; value: Session } | { ok: false; response: Response };
type BodyOrResponse =
  { ok: true; value: ChatBody } | { ok: false; response: Response };
type SessionState = {
  ok: true;
  session: Session;
  setSessionOnResponse: Session | null;
};
type SessionStateOrResponse = SessionState | { ok: false; response: Response };
type ChatResult =
  | { ok: true; response: Response; setSessionOnResponse: Session | null }
  | { ok: false; response: Response };

function requestTooLargeResponse(): Response {
  return jsonError(
    413,
    "REQUEST_TOO_LARGE",
    "Request is too large. Please shorten your message."
  );
}

async function parseChatBody(req: Request): Promise<BodyOrResponse> {
  const contentLength = Number(req.headers.get("content-length") ?? "");
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_REQUEST_BODY_BYTES
  ) {
    return { ok: false, response: requestTooLargeResponse() };
  }

  try {
    const rawText = await req.text();
    if (new TextEncoder().encode(rawText).byteLength > MAX_REQUEST_BODY_BYTES) {
      return { ok: false, response: requestTooLargeResponse() };
    }

    const parsedBody = ChatRequestSchema.safeParse(JSON.parse(rawText));
    if (parsedBody.success) return { ok: true, value: parsedBody.data };

    const issue = parsedBody.error.issues[0];
    const field = issue?.path[0];
    return {
      ok: false,
      response: jsonError(
        422,
        "VALIDATION_ERROR",
        "Please correct the highlighted fields.",
        field !== undefined
          ? { [String(field)]: issue.message }
          : z.treeifyError(parsedBody.error)
      ),
    };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "BAD_REQUEST", "Invalid JSON body."),
    };
  }
}

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
  return { ok: true, value: parsed.data };
}

function readSession(jar: Awaited<ReturnType<typeof cookies>>): Session | null {
  const sessionId = jar.get("tb_sid")?.value;
  const sessionToken = jar.get("tb_stk")?.value;
  return sessionId && sessionToken
    ? { session_id: sessionId, session_token: sessionToken }
    : null;
}

async function resolveSession(
  cfg: ServerConfig,
  jar: Awaited<ReturnType<typeof cookies>>
): Promise<SessionStateOrResponse> {
  const existingSession = readSession(jar);
  if (existingSession) {
    return { ok: true, session: existingSession, setSessionOnResponse: null };
  }

  const created = await createSession(cfg);
  if (!created.ok) return created;
  return {
    ok: true,
    session: created.value,
    setSessionOnResponse: created.value,
  };
}

async function sendChat(
  cfg: ServerConfig,
  body: ChatBody,
  session: Session
): Promise<FetchOrResponse> {
  return fetchBackend(cfg, `${cfg.backendUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "x-session-id": session.session_id,
      "x-session-token": session.session_token,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function executeChat(
  cfg: ServerConfig,
  body: ChatBody,
  sessionState: SessionState
): Promise<ChatResult> {
  let upstream = await sendChat(cfg, body, sessionState.session);
  if (!upstream.ok) return upstream;
  if (upstream.response.status !== 401) {
    return {
      ok: true,
      response: upstream.response,
      setSessionOnResponse: sessionState.setSessionOnResponse,
    };
  }

  const refreshed = await createSession(cfg);
  if (!refreshed.ok) return refreshed;
  upstream = await sendChat(cfg, body, refreshed.value);
  if (!upstream.ok) return upstream;
  return {
    ok: true,
    response: upstream.response,
    setSessionOnResponse: refreshed.value,
  };
}

function setSessionCookies(resp: NextResponse, session: Session): void {
  resp.cookies.set("tb_sid", session.session_id, {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
    path: "/",
  });
  resp.cookies.set("tb_stk", session.session_token, {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
    path: "/",
  });
}

export async function POST(req: Request) {
  const cfg = requireServerConfig();
  if (!cfg.ok) return cfg.response;

  const parsedBody = await parseChatBody(req);
  if (!parsedBody.ok) return parsedBody.response;

  const jar = await cookies();
  const sessionState = await resolveSession(cfg.value, jar);
  if (!sessionState.ok) return sessionState.response;

  const result = await executeChat(cfg.value, parsedBody.value, sessionState);
  if (!result.ok) return result.response;

  const resp = await passthrough(result.response);
  if (result.setSessionOnResponse) {
    setSessionCookies(resp, result.setSessionOnResponse);
  }

  return resp;
}
