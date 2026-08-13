const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Cannot reach the API. Make sure the API server is running (pnpm dev) and you are using http://localhost:3000.",
      0,
    );
  }

  let json: { success?: boolean; data?: T; error?: { code?: string; message?: string } };
  try {
    json = await res.json();
  } catch {
    throw new ApiError("PARSE_ERROR", "Unexpected response from API", res.status);
  }

  if (!json.success) {
    throw new ApiError(json.error?.code ?? "ERROR", json.error?.message ?? "Request failed", res.status);
  }
  return json.data as T;
}

export async function apiRaw(path: string, options: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: options.headers,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Cannot reach the API. Make sure the API server is running (pnpm dev).",
      0,
    );
  }
}
