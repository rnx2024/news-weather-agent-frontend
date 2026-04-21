import { proxyPlaceGet } from "../_server/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return proxyPlaceGet(req, "weather");
}
