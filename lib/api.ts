// lib/api.ts
import { throwIfNotOk } from "./apiError";

export type ChatSource = {
  type: string;
};

export type ChatResponse = {
  place: string;
  final: string;
  risk_level: string;
  travel_advice: string[];
  sources: ChatSource[];
};

export async function chatRequest(place: string, question: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ place, question }),
  });

  await throwIfNotOk(res);

  return res.json() as Promise<ChatResponse>;
}

export async function weatherRequest(place: string) {
  const res = await fetch(`/api/weather?place=${encodeURIComponent(place)}`, {
    method: "GET",
  });

  await throwIfNotOk(res);

  return res.json() as Promise<{
    place: string;
    summary: string;
    travel_relevance: string;
    travel_advice: string[];
  }>;
}

type NewsItem = {
  title: string;
  source?: string;
  date?: string;
  link?: string;
};

export async function newsRequest(place: string) {
  const res = await fetch(`/api/news?place=${encodeURIComponent(place)}`, {
    method: "GET",
  });

  await throwIfNotOk(res);

  return res.json() as Promise<{
    place: string;
    recent_count: number;
    items: NewsItem[];
    travel_relevance?: string;
    note?: string;
  }>;
}
