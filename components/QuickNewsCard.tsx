// components/QuickNewsCard.tsx
"use client";

import { useState, type FormEvent } from "react";
import { newsRequest } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { MAX_PLACE_LENGTH } from "../lib/schemas";

type NewsItem = {
  id: string; // ✅ added for stable React keys
  title: string;
  source?: string;
  date?: string;
  link?: string;
};

export default function QuickNewsCard() {
  const [place, setPlace] = useState("Vigan");
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [travelRelevance, setTravelRelevance] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestedPlace, setLastRequestedPlace] = useState<string | null>(
    null
  );

  async function loadNews(requestedPlace = place) {
    const trimmed = requestedPlace.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_PLACE_LENGTH) {
      setError(`Destination must be ${MAX_PLACE_LENGTH} characters or fewer.`);
      return;
    }

    setLoading(true);
    setError(null);
    setLastRequestedPlace(trimmed);
    setItems(null);
    setTravelRelevance(null);
    setNote(null);

    try {
      const res = await newsRequest(trimmed);
      const normalized: NewsItem[] = (res.items ?? []).map(
        (it: Omit<NewsItem, "id">) => ({
          ...it,
          id: crypto.randomUUID(),
        })
      );
      setItems(normalized);
      setTravelRelevance(res.travel_relevance ?? null);
      setNote(res.note ?? null);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "News request failed"));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void loadNews();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-sky-100 p-4 shadow-md space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
          Local Developments
        </p>
        <h2 className="mt-1 text-[1.05rem] font-medium leading-6 tracking-tight text-slate-900">
          Recent reporting relevant to travel conditions
        </h2>
        <p className="mt-1 text-[0.95rem] leading-6 text-slate-600">
          Surface recent developments that may affect transit, access, or local
          plans.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 placeholder-slate-400 focus:border-[#3399FF] focus:outline-none focus:ring-2 focus:ring-[#3399FF]/30"
          maxLength={MAX_PLACE_LENGTH}
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="e.g. Vigan"
        />
        <button
          type="submit"
          disabled={loading || !place.trim()}
          className="inline-flex items-center justify-center rounded-md px-3 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#5ba5efff" }}
        >
          {loading ? "..." : "Fetch"}
        </button>
      </form>

      <div className="min-h-[3rem] space-y-1 text-sm leading-6 text-slate-700">
        {error && (
          <div className="space-y-2">
            <p className="text-red-600">{error}</p>
            {lastRequestedPlace && (
              <button
                type="button"
                onClick={() => void loadNews(lastRequestedPlace)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {!error && items && items.length > 0 && (
          <div className="space-y-2">
            <ul className="space-y-1">
              {items.slice(0, 3).map((item) => (
                <li key={item.id} className="leading-snug">
                  <span className="font-medium text-slate-800">
                    {item.title}
                  </span>
                  {item.source && (
                    <span className="text-slate-500"> · {item.source}</span>
                  )}
                  {item.date && (
                    <span className="text-slate-400"> · {item.date}</span>
                  )}
                </li>
              ))}
            </ul>
            {travelRelevance && (
              <p className="text-[0.95rem] leading-6 text-slate-500">
                {travelRelevance}
              </p>
            )}
            {note && (
              <p className="text-[0.95rem] leading-6 text-slate-400">{note}</p>
            )}
          </div>
        )}

        {!error && items?.length === 0 && !loading && (
          <p className="text-[0.95rem] leading-6 text-slate-400">
            No recent local developments were returned.
          </p>
        )}

        {!error && !items && !loading && (
          <p className="text-[0.95rem] leading-6 text-slate-400">
            No local developments requested yet.
          </p>
        )}
      </div>
    </section>
  );
}
