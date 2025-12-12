import { NextResponse } from "next/server";

// Force module + force runtime behavior (also avoids static caching surprises)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const backend = process.env.BACKEND_URL;
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!backend || !apiKey) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const place = searchParams.get("place") ?? "";

  if (!place) {
    return NextResponse.json(
      { error: "Missing place parameter" },
      { status: 400 }
    );
  }

  const url = new URL(`${backend}/weather`);
  url.searchParams.set("place", place);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type":
        res.headers.get("content-type") ?? "application/json",
    },
  });
}
