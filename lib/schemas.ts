// lib/schemas.ts
import { z } from "zod";

// Schemas are intentionally lenient (no .strict()) so additional fields the
// backend adds later don't break parsing — only the shape this app actually
// consumes is enforced. Nullable backend fields are normalized to `undefined`
// via .transform() to match this app's existing optional-field conventions,
// so no other file needs to change how it consumes these types.

export const ChatRequestSchema = z.object({
  place: z.string().min(1, "place is required"),
  question: z.string().optional(),
});

const nullableToOptional = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined);

export const ChatSourceSchema = z.object({
  type: z.string(),
});

export const ChatResponseSchema = z.object({
  place: z.string(),
  final: z.string(),
  risk_level: nullableToOptional(z.string()),
  travel_advice: z.array(z.string()),
  sources: z.array(ChatSourceSchema),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const WeatherResponseSchema = z.object({
  place: z.string(),
  summary: z.string(),
  travel_relevance: z.string(),
  travel_advice: z.array(z.string()),
});
export type WeatherResponse = z.infer<typeof WeatherResponseSchema>;

export const NewsItemSchema = z.object({
  title: z.string(),
  source: nullableToOptional(z.string()),
  date: nullableToOptional(z.string()),
  link: nullableToOptional(z.string()),
});

export const NewsResponseSchema = z.object({
  place: z.string(),
  recent_count: z.number(),
  items: z.array(NewsItemSchema),
  travel_relevance: z.string(),
  note: z.string(),
});
export type NewsResponse = z.infer<typeof NewsResponseSchema>;
