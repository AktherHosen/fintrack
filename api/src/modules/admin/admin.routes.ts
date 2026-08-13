import { Router, type IRouter } from "express";
import { PaymentStatus, SubscriptionStatus, UserStatus } from "@prisma/client";
import { rejectPaymentSchema, updateUserStatusSchema, createPlanSchema, updatePlanSchema } from "@fintrack/shared";
import { requireAuth, requireSuperAdmin } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { success } from "../../middleware/error-handler.js";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/errors.js";
import { writeAuditLog } from "../../lib/audit.js";
import { subscriptionExpiryFromPlan } from "../../lib/date-utils.js";
import { addMoney } from "@fintrack/shared";

function paramId(id: string | string[]): string {
  return Array.isArray(id) ? id[0] : id;
}

export const adminRouter: IRouter = Router();
adminRouter.use(requireAuth, requireSuperAdmin);

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

adminRouter.get("/payments", async (req, res, next) => {
  try {
    const status = req.query.status as PaymentStatus | undefined;
    const payments = await prisma.payment.findMany({
      where: status ? { status } : {},
      include: {
        subscription: { include: { plan: true } },
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
    })));
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/payments/:id/approve", async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paramId(req.params.id) },
      include: { subscription: { include: { plan: true } } },
    });
    if (!payment) throw notFound("Payment not found");
    if (payment.status !== PaymentStatus.PENDING) throw notFound("Payment not pending");

    const now = new Date();
    const billingInterval = payment.subscription?.plan.billingInterval ?? "MONTHLY";
    const expiresAt = subscriptionExpiryFromPlan(now, billingInterval);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          verifiedBy: req.user!.id,
          verifiedAt: now,
        },
      });

      if (payment.subscriptionId) {
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
      action: "PAYMENT_APPROVED",
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

    await writeAuditLog({
      actorUserId: req.user!.id,
      action: "PAYMENT_REJECTED",
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

adminRouter.get("/subscriptions", async (_req, res, next) => {
  try {
    const subs = await prisma.subscription.findMany({
      include: { plan: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    success(res, subs);
  } catch (e) {
    next(e);
  }
});
