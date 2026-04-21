export type ApiErrorPayload = Readonly<{
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}>;

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(args: { status: number; message: string; code?: string; details?: unknown }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
  }
}

async function tryReadJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function tryReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

export async function throwIfNotOk(res: Response) {
  if (res.ok) return;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = (await tryReadJson(res)) as ApiErrorPayload | null;
    const code = data?.error?.code;
    const message =
      data?.error?.message ??
      `Request failed with status ${res.status}.`;
    throw new ApiError({
      status: res.status,
      code,
      message,
      details: data?.error?.details,
    });
  }

  const text = await tryReadText(res);
  throw new ApiError({
    status: res.status,
    message: text ? `Request failed: ${text}` : `Request failed with status ${res.status}.`,
  });
}

