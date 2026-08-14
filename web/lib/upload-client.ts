import { ApiError } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function uploadAdBanner(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("image", file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/uploads/ad-banner`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Cannot reach the API. Make sure the API server is running.",
      0,
    );
  }

  const json: {
    success?: boolean;
    data?: UploadResult;
    error?: { code?: string; message?: string };
  } = await res.json();

  if (!json.success || !json.data) {
    throw new ApiError(
      json.error?.code ?? "UPLOAD_ERROR",
      json.error?.message ?? "Upload failed",
      res.status,
    );
  }

  return json.data;
}
