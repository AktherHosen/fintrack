import { Router, type IRouter } from "express";
import { PaymentStatus, SubscriptionStatus, UserStatus, AdCampaignStatus } from "@prisma/client";
import { rejectPaymentSchema, updateUserStatusSchema, createPlanSchema, updatePlanSchema, updateAdPlanSchema, adminSwitchPlanSchema, adminUpdateSubscriptionSchema, updatePaymentSettingsSchema } from "@fintrack/shared";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { success } from "../../middleware/error-handler.js";
import { prisma } from "../../lib/prisma.js";
import { notFound, badRequest } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { subscriptionExpiryFromPlan } from "../../lib/date-utils.js";
import { addMoney } from "@fintrack/shared";
import { rejectAdCampaign } from "../../services/ad.service.js";
import { getPaymentConfig, updatePaymentSettings } from "../../services/platform-settings.service.js";
import { getUsageWithLimits } from "../../services/entitlements.service.js";

function paramId(id: string | string[]): string {
  return Array.isArray(id) ? id[0] : id;
}

function mapAdminSubscription(sub: {
  id: string;
  status: SubscriptionStatus;
  startsAt: Date;
  expiresAt: Date;
  canceledAt: Date | null;
  createdAt: Date;
  user: { id: string; name: string; email: string; status: string };
  plan: {
    id: string;
    name: string;
    slug: string;
    price: { toString(): string };
    currency: string;
    billingInterval: string;
  };
}) {
  return {
    id: sub.id,
    status: sub.status,
    startsAt: sub.startsAt.toISOString(),
    expiresAt: sub.expiresAt.toISOString(),
    canceledAt: sub.canceledAt?.toISOString() ?? null,
    createdAt: sub.createdAt.toISOString(),
    user: sub.user,
    plan: {
      id: sub.plan.id,
      name: sub.plan.name,
      slug: sub.plan.slug,
      price: sub.plan.price.toString(),
      currency: sub.plan.currency,
      billingInterval: sub.plan.billingInterval,
    },
  };
}

export const adminRouter: IRouter = Router();
adminRouter.use(requireAuth, requireSuperAdmin);

adminRouter.get("/settings/payment", async (_req, res, next) => {
  try {
    success(res, await getPaymentConfig());
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/settings/payment", validateBody(updatePaymentSettingsSchema), async (req, res, next) => {
  try {
    const config = await updatePaymentSettings(req.body);
    await writeAuditLog({
      actorUserId: req.user!.id,
      action: "PAYMENT_SETTINGS_UPDATED",
      entityType: "platform_setting",
      entityId: "bkash_payment_number",
      metadata: { bkashNumber: config.bkashNumber },
      req,
    });
    success(res, config);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, suspendedUsers, pendingPayments, activeSubscriptions, paidThisMonth] =
      await Promise.all([
        prisma.user.count({ where: { role: "USER" } }),
        prisma.user.count({ where: { role: "USER", status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { role: "USER", status: UserStatus.SUSPENDED } }),
        prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
        prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE, expiresAt: { gt: now } } }),
        prisma.payment.findMany({
          where: { status: PaymentStatus.PAID, verifiedAt: { gte: monthStart } },
          select: { amount: true },
        }),
      ]);

    const monthlyRevenue = paidThisMonth.reduce(
      (sum, p) => addMoney(sum, p.amount.toString()),
      "0.00",
    );

    success(res, {
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingPayments,
      activeSubscriptions,
      monthlyRevenue,
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/users", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "25"), 10)));
    const search = String(req.query.search ?? "");

    const where = {
      role: "USER" as const,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const result = await Promise.all(
      users.map(async (u) => {
        const sub = await prisma.subscription.findFirst({
          where: { userId: u.id, status: SubscriptionStatus.ACTIVE },
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        });
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.status,
          role: u.role,
          plan: sub?.plan.name ?? "Free",
          joinedAt: u.createdAt.toISOString(),
          subscriptionExpiry: sub?.expiresAt.toISOString() ?? null,
        };
      }),
    );

    success(res, { items: result, total, page, limit });
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/users/:id/status", validateBody(updateUserStatusSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({ where: { id: paramId(req.params.id), role: "USER" } });
    if (!user) throw notFound("User not found");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { status: req.body.status },
    });

    await writeAuditLog({
      actorUserId: req.user!.id,
      action: req.body.status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
      entityType: "user",
      entityId: user.id,
      req,
    });

    success(res, { id: updated.id, status: updated.status });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/plans", async (_req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } });
    success(res, plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price.toString(),
      currency: p.currency,
      billingInterval: p.billingInterval,
      features: p.features,
      isActive: p.isActive,
    })));
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/plans", validateBody(createPlanSchema), async (req, res, next) => {
  try {
    const plan = await prisma.plan.create({ data: req.body });
    res.status(201);
    success(res, plan);
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/plans/:id", validateBody(updatePlanSchema), async (req, res, next) => {
  try {
    const plan = await prisma.plan.update({ where: { id: paramId(req.params.id) }, data: req.body });
    success(res, plan);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/ad-plans", async (_req, res, next) => {
  try {
    const plans = await prisma.adPlan.findMany({ orderBy: { durationDays: "asc" } });
    success(res, plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price.toString(),
      currency: p.currency,
      durationDays: p.durationDays,
      isActive: p.isActive,
    })));
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/ad-plans/:id", validateBody(updateAdPlanSchema), async (req, res, next) => {
  try {
    const plan = await prisma.adPlan.update({
      where: { id: paramId(req.params.id) },
      data: req.body,
    });
    success(res, {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: plan.price.toString(),
      currency: plan.currency,
      durationDays: plan.durationDays,
      isActive: plan.isActive,
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/me/switch-plan", validateBody(adminSwitchPlanSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const plan = await prisma.plan.findFirst({ where: { slug: req.body.planSlug } });
    if (!plan) throw notFound("Plan not found");

    const now = new Date();
    const expiresAt =
      plan.slug === "free"
        ? new Date(now.getFullYear() + 100, now.getMonth(), now.getDate())
        : subscriptionExpiryFromPlan(now, plan.billingInterval);

    await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.CANCELED, canceledAt: now },
      });
      await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          startsAt: now,
          expiresAt,
        },
      });
    });

    await writeAuditLog({
      actorUserId: userId,
      action: "ADMIN_PLAN_SWITCH",
      entityType: "subscription",
      entityId: plan.id,
      metadata: { planSlug: plan.slug },
      req,
    });

    success(res, { planSlug: plan.slug, planName: plan.name });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/payments", async (req, res, next) => {
  try {
    const status = req.query.status as PaymentStatus | undefined;
    const payments = await prisma.payment.findMany({
      where: status ? { status } : {},
      include: {
        subscription: { include: { plan: true } },
        adCampaign: { include: { adPlan: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    success(res, payments.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      currency: p.currency,
      transactionId: p.transactionId,
      senderNumber: p.senderNumber,
      status: p.status,
      adminNote: p.adminNote,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
      plan: p.subscription?.plan ? { name: p.subscription.plan.name, slug: p.subscription.plan.slug } : null,
      adCampaign: p.adCampaign
        ? {
            id: p.adCampaign.id,
            title: p.adCampaign.title,
            subtitle: p.adCampaign.subtitle,
            adPlan: {
              name: p.adCampaign.adPlan.name,
              slug: p.adCampaign.adPlan.slug,
              durationDays: p.adCampaign.adPlan.durationDays,
            },
          }
        : null,
    })));
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/payments/:id/approve", async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        subscription: { include: { plan: true } },
        adCampaign: { include: { adPlan: true } },
      },
    });
    if (!payment) throw notFound("Payment not found");
    if (payment.status !== PaymentStatus.PENDING) throw notFound("Payment not pending");

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          verifiedBy: req.user!.id,
          verifiedAt: now,
        },
      });

      if (payment.adCampaignId && payment.adCampaign) {
        const endsAt = new Date(now);
        endsAt.setDate(endsAt.getDate() + payment.adCampaign.adPlan.durationDays);
        await tx.adCampaign.update({
          where: { id: payment.adCampaignId },
          data: {
            status: AdCampaignStatus.ACTIVE,
            startsAt: now,
            endsAt,
            adminNote: null,
          },
        });
      } else if (payment.subscriptionId) {
        const billingInterval = payment.subscription?.plan.billingInterval ?? "MONTHLY";
        const expiresAt = subscriptionExpiryFromPlan(now, billingInterval);

        await tx.subscription.updateMany({
          where: {
            userId: payment.userId,
            status: SubscriptionStatus.ACTIVE,
            id: { not: payment.subscriptionId },
          },
          data: { status: SubscriptionStatus.CANCELED, canceledAt: now },
        });

        await tx.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: SubscriptionStatus.ACTIVE,
            startsAt: now,
            expiresAt,
          },
        });
      }
    });

    await writeAuditLog({
      actorUserId: req.user!.id,
      action: payment.adCampaignId ? "AD_PAYMENT_APPROVED" : "PAYMENT_APPROVED",
      entityType: "payment",
      entityId: payment.id,
      req,
    });

    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/payments/:id/reject", validateBody(rejectPaymentSchema), async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: paramId(req.params.id) } });
    if (!payment) throw notFound("Payment not found");
    if (payment.status !== PaymentStatus.PENDING) throw notFound("Payment not pending");

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REJECTED,
        adminNote: req.body.adminNote,
        verifiedBy: req.user!.id,
        verifiedAt: new Date(),
      },
    });

    if (payment.adCampaignId) {
      await rejectAdCampaign(payment.adCampaignId, req.body.adminNote);
    }

    await writeAuditLog({
      actorUserId: req.user!.id,
      action: payment.adCampaignId ? "AD_PAYMENT_REJECTED" : "PAYMENT_REJECTED",
      entityType: "payment",
      entityId: payment.id,
      metadata: { adminNote: req.body.adminNote },
      req,
    });

    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/audit-logs", async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { id: true, name: true, email: true } } },
    });
    success(res, logs);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/subscriptions", async (req, res, next) => {
  try {
    const status = req.query.status as SubscriptionStatus | undefined;
    const search = String(req.query.search ?? "").trim();

    const subs = await prisma.subscription.findMany({
      where: {
        ...(status ? { status } : {}),
        user: {
          role: "USER",
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { email: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
      },
      include: {
        plan: true,
        user: { select: { id: true, name: true, email: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    success(res, subs.map(mapAdminSubscription));
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/subscriptions/:id", async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        plan: true,
        user: { select: { id: true, name: true, email: true, status: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, amount: true, currency: true, status: true, createdAt: true },
        },
      },
    });
    if (!sub) throw notFound("Subscription not found");

    const { usage, limits } = await getUsageWithLimits(sub.userId);

    success(res, {
      ...mapAdminSubscription(sub),
      usage,
      limits,
      recentPayments: sub.payments.map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

adminRouter.patch(
  "/subscriptions/:id",
  validateBody(adminUpdateSubscriptionSchema),
  async (req, res, next) => {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { id: paramId(req.params.id) },
        include: { plan: true, user: { select: { id: true, name: true, email: true, status: true } } },
      });
      if (!sub) throw notFound("Subscription not found");

      const now = new Date();
      const nextStatus = req.body.status as SubscriptionStatus;

      if (nextStatus === SubscriptionStatus.ACTIVE) {
        if (sub.status !== SubscriptionStatus.PAUSED) {
          throw badRequest("Only paused subscriptions can be resumed");
        }
        if (sub.expiresAt <= now) {
          throw badRequest("Subscription has expired — user needs a new payment");
        }
      } else if (nextStatus === SubscriptionStatus.PAUSED) {
        if (sub.status !== SubscriptionStatus.ACTIVE) {
          throw badRequest("Only active subscriptions can be paused");
        }
        if (sub.expiresAt <= now) {
          throw badRequest("Subscription is already expired");
        }
      } else if (nextStatus === SubscriptionStatus.CANCELED) {
        if (sub.status !== SubscriptionStatus.ACTIVE && sub.status !== SubscriptionStatus.PAUSED) {
          throw badRequest("Subscription cannot be canceled");
        }
      }

      const updated = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: nextStatus,
          canceledAt: nextStatus === SubscriptionStatus.CANCELED ? now : null,
        },
        include: {
          plan: true,
          user: { select: { id: true, name: true, email: true, status: true } },
        },
      });

      const action =
        nextStatus === SubscriptionStatus.PAUSED
          ? "SUBSCRIPTION_PAUSED"
          : nextStatus === SubscriptionStatus.ACTIVE
            ? "SUBSCRIPTION_RESUMED"
            : "SUBSCRIPTION_CANCELED";

      await writeAuditLog({
        actorUserId: req.user!.id,
        action,
        entityType: "subscription",
        entityId: sub.id,
        metadata: { userId: sub.userId, planSlug: sub.plan.slug, status: nextStatus },
        req,
      });

      success(res, mapAdminSubscription(updated));
    } catch (e) {
      next(e);
    }
  },
);
