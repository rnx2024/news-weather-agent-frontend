// lib/api.ts
import { ApiError, throwIfNotOk } from "./apiError";
import {
  ChatResponseSchema,
  NewsResponseSchema,
  WeatherResponseSchema,
  type ChatResponse,
  type NewsResponse,
  type WeatherResponse,
} from "./schemas";
import { z } from "zod";

export type { ChatResponse, NewsResponse, WeatherResponse };
export type ChatSource = ChatResponse["sources"][number];

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError({
        status: 502,
        message: "Received an unexpected response from the backend.",
      });
    }
    throw error;
  }
}

export async function chatRequest(place: string, question: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ place, question }),
  });

  await throwIfNotOk(res);

  return parseOrThrow(ChatResponseSchema, await res.json());
}

export async function weatherRequest(place: string) {
  const res = await fetch(`/api/weather?place=${encodeURIComponent(place)}`, {
    method: "GET",
  });

  await throwIfNotOk(res);

  return parseOrThrow(WeatherResponseSchema, await res.json());
}

export async function newsRequest(place: string) {
  const res = await fetch(`/api/news?place=${encodeURIComponent(place)}`, {
    method: "GET",
  });

  await throwIfNotOk(res);

  return parseOrThrow(NewsResponseSchema, await res.json());
}
