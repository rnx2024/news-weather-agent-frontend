// lib/api.ts
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
  const res = await fetch(`/api/weather?place=${encodeURIComponent(place)}`, {
    method: "GET",
  });

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
  const res = await fetch(`/api/news?place=${encodeURIComponent(place)}`, {
    method: "GET",
  });

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
