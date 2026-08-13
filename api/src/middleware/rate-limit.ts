import rateLimit from "express-rate-limit";

const noop = (_req: unknown, _res: unknown, next: () => void) => next();

const isTest = process.env.NODE_ENV === "test";

export const globalRateLimit = isTest
  ? noop
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const authRateLimit = isTest
  ? noop
  : rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      message: { success: false, error: { code: "RATE_LIMIT", message: "Too many attempts" } },
    });

export const paymentRateLimit = isTest
  ? noop
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: { success: false, error: { code: "RATE_LIMIT", message: "Too many payment submissions" } },
    });
