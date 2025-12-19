import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { config } from "../_server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Session = { session_id: string; session_token: string };

async function createSession(): Promise<Session> {
  const r = await fetch(`${config.backendUrl}/session`, {
    method: "POST",
    headers: { "x-api-key": config.apiKey },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`session ${r.status}`);
  const data = await r.json();
  return { session_id: data.session_id, session_token: data.session_token };
}

export async function POST(req: Request) {
  const body = await req.json();

  // ---- read session from request cookies (await cookies())
  const jar = await cookies();
  let session: Session | null = null;
  const sid = jar.get("sn_sid")?.value;
  const stk = jar.get("sn_stk")?.value;
  if (sid && stk) {
    session = { session_id: sid, session_token: stk };
  }

  // ---- ensure session; remember if we must set new cookies on the response
  let setSessionOnResponse: Session | null = null;
  if (!session) {
    session = await createSession();
    setSessionOnResponse = session;
  }

  const send = () =>
    fetch(`${config.backendUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "x-session-id": session!.session_id,
        "x-session-token": session!.session_token,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

  // ---- call backend; if unauthorized, refresh session and retry once
  let upstream = await send();
  if (upstream.status === 401) {
    session = await createSession();
    setSessionOnResponse = session; // set new cookies on the final response
    upstream = await send();
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
    resp.cookies.set("sn_sid", setSessionOnResponse.session_id, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
    });
    resp.cookies.set("sn_stk", setSessionOnResponse.session_token, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      path: "/",
    });
  }

  return resp;
}
