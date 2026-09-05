import { isTransientApiError } from "./apiError";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isTransientApiError(error)) {
    return "The backend is waking up or temporarily unavailable. Please try again in a moment.";
  }
  return fallback;
}
