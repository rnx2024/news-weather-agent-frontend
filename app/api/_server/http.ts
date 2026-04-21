import { NextResponse } from "next/server";

export type ApiErrorBody = Readonly<{
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}>;

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };

  return NextResponse.json(body, { status });
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
