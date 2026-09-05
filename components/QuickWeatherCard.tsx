// components/QuickWeatherCard.tsx
"use client";

import { useState, type FormEvent } from "react";
import { weatherRequest } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { MAX_PLACE_LENGTH } from "../lib/schemas";

export default function QuickWeatherCard() {
  const [place, setPlace] = useState("Vigan");
  const [summary, setSummary] = useState<string | null>(null);
  const [travelRelevance, setTravelRelevance] = useState<string | null>(null);
  const [travelAdvice, setTravelAdvice] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestedPlace, setLastRequestedPlace] = useState<string | null>(
    null
  );

  async function loadWeather(requestedPlace = place) {
    const trimmed = requestedPlace.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_PLACE_LENGTH) {
      setError(`Destination must be ${MAX_PLACE_LENGTH} characters or fewer.`);
      return;
    }

    setLoading(true);
    setError(null);
    setLastRequestedPlace(trimmed);
    setSummary(null);
    setTravelRelevance(null);
    setTravelAdvice([]);

    try {
      const res = await weatherRequest(trimmed);
      setSummary(res.summary);
      setTravelRelevance(res.travel_relevance);
      setTravelAdvice(res.travel_advice ?? []);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Weather request failed"));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void loadWeather();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-sky-100 p-4 shadow-md space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
          Weather Outlook
        </p>
        <h2 className="mt-1 text-[1.05rem] font-medium leading-6 tracking-tight text-slate-900">
          Near-term conditions for local movement
        </h2>
        <p className="mt-1 text-[0.95rem] leading-6 text-slate-600">
          Review weather conditions that may affect transfers, outdoor plans,
          and short day trips.
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
          {loading ? "..." : "Check"}
        </button>
      </form>

      <div className="min-h-[2rem] text-sm leading-6 text-slate-700">
        {error && (
          <div className="space-y-2">
            <p className="text-red-600">{error}</p>
            {lastRequestedPlace && (
              <button
                type="button"
                onClick={() => void loadWeather(lastRequestedPlace)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {!error && summary && (
          <div className="space-y-2">
            <p className="whitespace-pre-line">{summary}</p>
            {travelRelevance && (
              <p className="text-[0.95rem] leading-6 text-slate-500">
                {travelRelevance}
              </p>
            )}
            {travelAdvice.length > 0 && (
              <ul className="space-y-1 text-[0.95rem] leading-6 text-slate-600">
                {travelAdvice.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!error && !summary && !loading && (
          <p className="text-[0.95rem] leading-6 text-slate-400">
            No weather outlook requested yet.
          </p>
        )}
      </div>
    </section>
  );
}
