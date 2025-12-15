import { NextResponse } from "next/server";
import { config } from "../_server/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const place = searchParams.get("place");

  if (!place) {
    return NextResponse.json({ error: "Missing place parameter" }, { status: 400 });
  }

  const url = new URL(`${config.backendUrl}/news`);
  url.searchParams.set("place", place);

  const res = await fetch(url.toString(), {
    headers: { "x-api-key": config.apiKey },
    cache: "no-store",
  });

  return new NextResponse(await res.text(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
