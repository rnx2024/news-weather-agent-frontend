import { NextResponse } from "next/server";
import { config } from "@/server/config";

// Keep as-is per your original code
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const place = searchParams.get("place") ?? "";

  if (!place) {
    return NextResponse.json(
      { error: "Missing place parameter" },
      { status: 400 }
    );
  }

  const url = new URL(`${config.backendUrl}/news`);
  url.searchParams.set("place", place);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": config.apiKey,
    },
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
