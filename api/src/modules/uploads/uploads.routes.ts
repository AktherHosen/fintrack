import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { handleAdBannerUpload } from "../../middleware/upload.js";
import { success } from "../../middleware/error-handler.js";
import { badRequest } from "../../lib/errors.js";
import { publicAssetPath } from "../../lib/assets.js";
import { globalRateLimit } from "../../middleware/rate-limit.js";

export const uploadsRouter: IRouter = Router();
uploadsRouter.use(requireAuth);

uploadsRouter.post(
  "/uploads/ad-banner",
  globalRateLimit,
  handleAdBannerUpload,
  async (req, res, next) => {
    try {
      if (!req.file) throw badRequest("Image file is required");

      const url = publicAssetPath(req.user!.id, req.file.filename);
      success(
        res,
        {
          url,
          filename: req.file.filename,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        201,
      );
    } catch (error) {
      next(error);
    }
  },
);
