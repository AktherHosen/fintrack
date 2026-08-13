import { Router, type IRouter } from "express";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@fintrack/shared";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth, COOKIE_NAME } from "../../middleware/auth.js";
import { authRateLimit } from "../../middleware/rate-limit.js";
import { success } from "../../middleware/error-handler.js";
import * as authService from "./auth.service.js";
import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcryptjs";
import { unauthorized } from "../../lib/errors.js";

export function authRouter(): IRouter {
  const router = Router();

  router.post("/register", authRateLimit, validateBody(registerSchema), async (req, res, next) => {
    try {
      const user = await authService.register(req.body);
      await authService.setSession(user.id, res);
      res.status(201);
      success(res, await authService.getMe(user.id));
    } catch (e) {
      next(e);
    }
  });

  router.post("/login", authRateLimit, validateBody(loginSchema), async (req, res, next) => {
    try {
      const user = await authService.login(req.body, res);
      success(res, user);
    } catch (e) {
      next(e);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      await authService.logout(req.cookies?.[COOKIE_NAME], res);
      success(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  router.post("/forgot-password", authRateLimit, validateBody(forgotPasswordSchema), async (req, res, next) => {
    try {
      success(res, await authService.forgotPassword(req.body.email));
    } catch (e) {
      next(e);
    }
  });

  router.post("/reset-password", authRateLimit, validateBody(resetPasswordSchema), async (req, res, next) => {
    try {
      success(res, await authService.resetPassword(req.body.token, req.body.newPassword));
    } catch (e) {
      next(e);
    }
  });

  router.post("/verify-email", authRateLimit, validateBody(verifyEmailSchema), async (req, res, next) => {
    try {
      success(res, await authService.verifyEmail(req.body.token));
    } catch (e) {
      next(e);
    }
  });

  router.post("/resend-verification", requireAuth, authRateLimit, async (req, res, next) => {
    try {
      success(res, await authService.resendVerificationEmail(req.user!.id));
    } catch (e) {
      next(e);
    }
  });

  router.get("/me", requireAuth, async (req, res, next) => {
    try {
      success(res, await authService.getMe(req.user!.id));
    } catch (e) {
      next(e);
    }
  });

  router.patch("/me", requireAuth, validateBody(updateProfileSchema), async (req, res, next) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: req.body,
      });
      success(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        currency: user.currency,
        timezone: user.timezone,
        locale: user.locale,
        avatarUrl: user.avatarUrl,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      });
    } catch (e) {
      next(e);
    }
  });

  router.post("/change-password", requireAuth, validateBody(changePasswordSchema), async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) throw unauthorized();

      const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
      if (!valid) throw unauthorized("Current password is incorrect");

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(req.body.newPassword, 12) },
      });
      success(res, { ok: true });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
