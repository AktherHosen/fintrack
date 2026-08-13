import { Router, type IRouter, type Request } from "express";
import { createAdCampaignSchema } from "@fintrack/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { paymentRateLimit } from "../../middleware/rate-limit.js";
import { success } from "../../middleware/error-handler.js";
import { env } from "../../lib/env.js";
import {
  createAdCampaign,
  listActiveAds,
  listAdPlans,
  listUserAdCampaigns,
} from "../../services/ad.service.js";

export const adsRouter: IRouter = Router();
adsRouter.use(requireAuth);

function uid(req: Request): string {
  return req.user!.id;
}

adsRouter.get("/ad-plans", async (_req, res, next) => {
  try {
    success(res, await listAdPlans());
  } catch (e) {
    next(e);
  }
});

adsRouter.get("/ads/active", async (_req, res, next) => {
  try {
    success(res, await listActiveAds());
  } catch (e) {
    next(e);
  }
});

adsRouter.get("/ads/mine", async (req, res, next) => {
  try {
    success(res, await listUserAdCampaigns(uid(req)));
  } catch (e) {
    next(e);
  }
});

adsRouter.post("/ads", paymentRateLimit, validateBody(createAdCampaignSchema), async (req, res, next) => {
  try {
    const campaign = await createAdCampaign(uid(req), req.body);
    res.status(201);
    success(res, {
      ...campaign,
      message: "Ad submitted. It will appear after payment verification.",
      bkashNumber: env.BKASH_PAYMENT_NUMBER ?? null,
    });
  } catch (e) {
    next(e);
  }
});
