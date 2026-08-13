import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import { badRequest } from "./errors.js";

const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ASSETS_ROOT = path.join(API_ROOT, "assets");

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ALLOWED_IMAGE_MIMES = Object.keys(MIME_TO_EXT);
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export function ensureAssetsRoot(): void {
  fs.mkdirSync(ASSETS_ROOT, { recursive: true });
}

export function adBannerDir(userId: string): string {
  return path.join(ASSETS_ROOT, "ad-banners", userId);
}

export function extensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function buildAdBannerFilename(mime: string): string {
  const ext = extensionForMime(mime);
  if (!ext) throw badRequest("Unsupported image type");
  return `${nanoid()}.${ext}`;
}

/** Public path served by Express and proxied through Next.js */
export function publicAssetPath(userId: string, filename: string): string {
  return `/assets/ad-banners/${userId}/${filename}`;
}

export function isAllowedAssetPath(publicPath: string, userId?: string): boolean {
  if (!publicPath.startsWith("/assets/ad-banners/")) return false;
  const parts = publicPath.split("/").filter(Boolean);
  if (parts.length !== 4) return false;
  if (userId && parts[2] !== userId) return false;
  return /^[a-zA-Z0-9._-]+$/.test(parts[3] ?? "");
}
