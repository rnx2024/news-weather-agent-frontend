// lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
export const API_KEY = process.env.NEXT_PUBLIC_AGENT_KEY!;

if (!API_BASE) {
  // This will surface early during build/dev if misconfigured
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_BACKEND_URL is not set");
}
if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("NEXT_PUBLIC_AGENT_KEY is not set");
}

export async function chatRequest(place: string, question: string) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }
  if (!API_KEY) {
    throw new Error("NEXT_PUBLIC_AGENT_KEY is not set");
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ place, question }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<{ final: string }>;
}

export async function weatherRequest(place: string) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }
  if (!API_KEY) {
    throw new Error("NEXT_PUBLIC_AGENT_KEY is not set");
  }

  const url = new URL(`${API_BASE}/weather`);
  url.searchParams.set("place", place);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
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
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }
  if (!API_KEY) {
    throw new Error("NEXT_PUBLIC_AGENT_KEY is not set");
  }

  const url = new URL(`${API_BASE}/news`);
  url.searchParams.set("place", place);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<{
    place: string;
    recent_count: number;
    items: NewsItem[];
    note?: string;
  }>;
}
