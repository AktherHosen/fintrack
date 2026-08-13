import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, getAllowedOrigins } from "./lib/env.js";
import { ASSETS_ROOT, ensureAssetsRoot } from "./lib/assets.js";
import { errorHandler } from "./middleware/error-handler.js";
import { globalRateLimit } from "./middleware/rate-limit.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { financeRouter } from "./modules/finance/finance.routes.js";
import { loansRouter } from "./modules/loans/loans.routes.js";
import { adsRouter } from "./modules/ads/ads.routes.js";
import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

import { startRecurringJob } from "./jobs/recurring-runner.js";

export function createApp(): Express {
  const app = express();

  ensureAssetsRoot();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        const allowed = getAllowedOrigins();
        if (!origin || allowed.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(globalRateLimit);

  app.use("/assets", express.static(ASSETS_ROOT, { maxAge: env.NODE_ENV === "production" ? "7d" : 0 }));

  app.get("/api/v1/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  app.use("/api/v1/auth", authRouter());
  app.use("/api/v1", financeRouter);
  app.use("/api/v1", loansRouter);
  app.use("/api/v1", adsRouter);
  app.use("/api/v1", uploadsRouter);
  app.use("/api/v1/admin", adminRouter);

  app.use(errorHandler);

  return app;
}

export function startServer(): Express {
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Finance Tracker API running on http://localhost:${env.PORT}`);
    startRecurringJob();
  });
  return app;
}
