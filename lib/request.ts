const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

type RequestOptions = RequestInit & {
  maxAttempts?: number;
  retryDelayMs?: number;
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchWithGetRetry(
  input: RequestInfo | URL,
  { maxAttempts = 2, retryDelayMs = 1000, ...init }: RequestOptions = {}
): Promise<Response> {
  let response: Response | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      response = await fetch(input, { ...init, method: "GET" });
    } catch (error: unknown) {
      if (attempt === maxAttempts) throw error;
      await delay(retryDelayMs * attempt);
      continue;
    }

    if (
      !RETRYABLE_STATUS_CODES.has(response.status) ||
      attempt === maxAttempts
    ) {
      return response;
    }
    await delay(retryDelayMs * attempt);
  }

  throw new Error("Request retry did not produce a response.");
}
