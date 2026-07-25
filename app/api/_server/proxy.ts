import { jsonError } from "./http";
import { fetchBackend, passthrough, requireServerConfig } from "./upstream";

export async function proxyPlaceGet(req: Request, endpointPath: string) {
  const { searchParams } = new URL(req.url);
  const place = searchParams.get("place");
  if (!place) {
    return jsonError(400, "BAD_REQUEST", "Missing place parameter.");
  }

  const cfg = requireServerConfig();
  if (!cfg.ok) return cfg.response;

  const url = new URL(`${cfg.value.backendUrl}/${endpointPath}`);
  url.searchParams.set("place", place);

  const upstream = await fetchBackend(cfg.value, url.toString(), {
    headers: { "x-api-key": cfg.value.apiKey },
    cache: "no-store",
  });
  if (!upstream.ok) return upstream.response;

  return passthrough(upstream.response);
}
