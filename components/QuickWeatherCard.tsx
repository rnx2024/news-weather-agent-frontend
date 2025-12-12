// components/QuickWeatherCard.tsx
"use client";

import { useState, type FormEvent } from "react";
import { weatherRequest } from "../lib/api";

export default function QuickWeatherCard() {
  const [place, setPlace] = useState("Vigan");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = place.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await weatherRequest(trimmed);
      setSummary(res.summary);
    } catch (err: any) {
      setError(err?.message ?? "Weather request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-sky-100 p-4 shadow-md space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">
          Quick Weather
        </h2>
        <p className="text-xs text-slate-500">
          Get a short weather line for a city.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs placeholder-slate-400 focus:border-[#3399FF] focus:outline-none focus:ring-2 focus:ring-[#3399FF]/30"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="e.g. Vigan"
        />
        <button
          type="submit"
          disabled={loading || !place.trim()}
          className="inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#5ba5efff" }}
        >
          {loading ? "..." : "Check"}
        </button>
      </form>

      <div className="min-h-[2rem] text-xs text-slate-700">
        {error && <p className="text-red-600">{error}</p>}
        {!error && summary && (
          <p className="whitespace-pre-line">{summary}</p>
        )}
        {!error && !summary && !loading && (
          <p className="text-slate-400">No weather queried yet.</p>
        )}
      </div>
    </section>
  );
}
