import { NextResponse } from "next/server";
// Force module + force runtime behavior (also avoids static caching surprises)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const backend = process.env.BACKEND_URL;
  const apiKey = process.env.EXTERNAL_API_KEY;



  if (!backend || !apiKey) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();

  const res = await fetch(`${backend}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}