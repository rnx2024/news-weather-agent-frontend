// lib/schemas.ts
import { z } from "zod";

export const MAX_PLACE_LENGTH = 100;
export const MAX_QUESTION_LENGTH = 2_000;
export const MAX_REQUEST_BODY_BYTES = 32_000;

// Schemas are intentionally lenient (no .strict()) so additional fields the
// backend adds later don't break parsing — only the shape this app actually
// consumes is enforced. Nullable backend fields are normalized to `undefined`
// via .transform() to match this app's existing optional-field conventions,
// so no other file needs to change how it consumes these types.

export const ChatRequestSchema = z.object({
  place: z
    .string()
    .trim()
    .min(1, "place is required")
    .max(
      MAX_PLACE_LENGTH,
      `place must be ${MAX_PLACE_LENGTH} characters or fewer`
    ),
  question: z
    .string()
    .trim()
    .max(
      MAX_QUESTION_LENGTH,
      `question must be ${MAX_QUESTION_LENGTH} characters or fewer`
    )
    .optional(),
});
export const PlaceSchema = ChatRequestSchema.shape.place;

export const SessionResponseSchema = z.object({
  session_id: z.string().min(1),
  session_token: z.string().min(1),
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
