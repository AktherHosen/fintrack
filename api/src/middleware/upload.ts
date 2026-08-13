import fs from "node:fs";
import multer from "multer";
import {
  adBannerDir,
  ALLOWED_IMAGE_MIMES,
  buildAdBannerFilename,
  ensureAssetsRoot,
  MAX_UPLOAD_BYTES,
} from "../lib/assets.js";

ensureAssetsRoot();

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = adBannerDir(req.user!.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    try {
      cb(null, buildAdBannerFilename(file.mimetype));
    } catch (error) {
      cb(error as Error, "");
    }
  },
});

const adBannerUpload = multer({
  storage,
  limits: { files: 1, fileSize: MAX_UPLOAD_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"));
  },
}).single("image");

export function handleAdBannerUpload(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
) {
  adBannerUpload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new Error("Image must be 5 MB or smaller"));
        return;
      }
      next(new Error(error.message));
      return;
    }
    next(error);
  });
}
