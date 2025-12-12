// lib/api.ts
// Frontend must NOT read server env vars (BACKEND_URL / EXTERNAL_API_KEY).
// It should call the Next.js proxy routes: /api/chat, /api/weather, /api/news.

export async function chatRequest(place: string, question: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ place, question }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<{ final: string }>;
}

export async function weatherRequest(place: string) {
  const url = new URL("/api/weather", window.location.origin);
  url.searchParams.set("place", place);

  const res = await fetch(url.toString(), { method: "GET" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<{ place: string; summary: string }>;
}

type NewsItem = {
  title: string;
  source?: string;
  date?: string;
  link?: string;
};

export async function newsRequest(place: string) {
  const url = new URL("/api/news", window.location.origin);
  url.searchParams.set("place", place);

  const res = await fetch(url.toString(), { method: "GET" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<{
    place: string;
    recent_count: number;
    items: NewsItem[];
    note?: string;
  }>;
}
