import { jsonError } from "./http";
import { fetchBackend, passthrough, requireServerConfig } from "./upstream";
import { PlaceSchema } from "../../../lib/schemas";

export async function proxyPlaceGet(req: Request, endpointPath: string) {
  const { searchParams } = new URL(req.url);
  const rawPlace = searchParams.get("place");
  if (!rawPlace) {
    return jsonError(400, "BAD_REQUEST", "Missing place parameter.");
  }

  const parsedPlace = PlaceSchema.safeParse(rawPlace);
  if (!parsedPlace.success) {
    return jsonError(
      422,
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      {
        place: parsedPlace.error.issues[0]?.message ?? "Invalid place.",
      }
    );
  }
  const place = parsedPlace.data;

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
