import { Router, type IRouter, type Request } from "express";
import { TransactionType, CategoryType, PaymentProvider, PaymentMethod, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import {
  createAccountSchema,
  updateAccountSchema,
  createCategorySchema,
  createTransactionSchema,
  updateTransactionSchema,
  createTransferSchema,
  createBudgetSchema,
  updateBudgetSchema,
  reportQuerySchema,
  transactionFilterSchema,
  manualPaymentSchema,
} from "@fintrack/shared";
import { FeatureKey } from "@fintrack/shared";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { paymentRateLimit } from "../../middleware/rate-limit.js";
import { success } from "../../middleware/error-handler.js";
import { prisma } from "../../lib/prisma.js";
import { notFound, badRequest, forbidden } from "../../lib/errors.js";
import { getAccountBalance } from "../../services/balance.service.js";
import { getDashboard, getReports, getCashflowSummary } from "../../services/dashboard.service.js";
import { checkLimit, getActiveSubscription, getUsage, checkFeature, getUsageWithLimits } from "../../services/entitlements.service.js";
import { exportTransactionsCsv, exportTransactionsPdf, exportAccountsCsv } from "../../services/export.service.js";
import { createRecurringSchema, updateRecurringSchema } from "@fintrack/shared";
import { parseDate } from "../../lib/date-utils.js";
import { writeAuditLog } from "../../lib/audit.js";
import { budgetStatus, percentOf, subMoney } from "@fintrack/shared";
import { env } from "../../lib/env.js";

function paramId(id: string | string[]): string {
  return Array.isArray(id) ? id[0] : id;
}

export const financeRouter: IRouter = Router();
financeRouter.use(requireAuth);

function uid(req: Request) {
  return req.user!.id;
}

// --- Dashboard ---
financeRouter.get("/reports/dashboard", async (req, res, next) => {
  try {
    success(res, await getDashboard(uid(req)));
  } catch (e) {
    next(e);
  }
});

financeRouter.get("/reports/cashflow-summary", async (req, res, next) => {
  try {
    success(res, await getCashflowSummary(uid(req)));
  } catch (e) {
    next(e);
  }
});

// --- Accounts ---
financeRouter.get("/accounts", async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: uid(req) },
      orderBy: { name: "asc" },
    });
    const result = await Promise.all(
      accounts.map(async (a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        openingBalance: a.openingBalance.toString(),
        balance: await getAccountBalance(a.id, uid(req)),
        isActive: a.isActive,
      })),
    );
    success(res, result);
  } catch (e) {
    next(e);
  }
});

financeRouter.post("/accounts", validateBody(createAccountSchema), async (req, res, next) => {
  try {
    const count = await prisma.account.count({ where: { userId: uid(req), isActive: true } });
    await checkLimit(uid(req), FeatureKey.ACCOUNTS_LIMIT, count);

    const user = await prisma.user.findUnique({ where: { id: uid(req) } });
    const currency = req.body.currency ?? user?.currency ?? "BDT";
    if (currency !== user?.currency) {
      const allowed = await checkFeature(uid(req), FeatureKey.MULTIPLE_CURRENCIES);
      if (!allowed) throw forbidden("Multiple currencies require a Pro plan");
    }

    const account = await prisma.account.create({
      data: {
        userId: uid(req),
        name: req.body.name,
        type: req.body.type,
        currency,
        openingBalance: req.body.openingBalance,
      },
    });
    res.status(201);
    success(res, {
      ...account,
      openingBalance: account.openingBalance.toString(),
      balance: account.openingBalance.toString(),
    });
  } catch (e) {
    next(e);
  }
});

financeRouter.patch("/accounts/:id", validateBody(updateAccountSchema), async (req, res, next) => {
  try {
    const existing = await prisma.account.findFirst({ where: { id: paramId(req.params.id), userId: uid(req) } });
    if (!existing) throw notFound("Account not found");

    const account = await prisma.account.update({
      where: { id: existing.id },
      data: req.body,
    });
    success(res, {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      openingBalance: account.openingBalance.toString(),
      balance: await getAccountBalance(account.id, uid(req)),
      isActive: account.isActive,
    });
  } catch (e) {
    next(e);
  }
});

financeRouter.get("/accounts/:id", async (req, res, next) => {
  try {
    const account = await prisma.account.findFirst({ where: { id: paramId(req.params.id), userId: uid(req) } });
    if (!account) throw notFound("Account not found");
    success(res, {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      openingBalance: account.openingBalance.toString(),
      balance: await getAccountBalance(account.id, uid(req)),
      isActive: account.isActive,
    });
  } catch (e) {
    next(e);
  }
});

// --- Categories ---
financeRouter.get("/categories", async (req, res, next) => {
  try {
    const type = req.query.type as CategoryType | undefined;
    const categories = await prisma.category.findMany({
      where: { userId: uid(req), isActive: true, ...(type ? { type } : {}) },
      orderBy: { name: "asc" },
    });
    success(res, categories);
  } catch (e) {
    next(e);
  }
});

financeRouter.post("/categories", validateBody(createCategorySchema), async (req, res, next) => {
  try {
    const count = await prisma.category.count({
      where: { userId: uid(req), isActive: true, isDefault: false },
    });
    await checkLimit(uid(req), FeatureKey.CATEGORIES_LIMIT, count);

    const category = await prisma.category.create({
      data: { userId: uid(req), ...req.body },
    });
    res.status(201);
    success(res, category);
  } catch (e) {
    next(e);
  }
});

// --- Transactions ---
financeRouter.get("/transactions", validateQuery(transactionFilterSchema), async (req, res, next) => {
  try {
    const { page, limit, type, accountId, categoryId, search, startDate, endDate } = req.query as unknown as {
      page: number;
      limit: number;
      type?: TransactionType;
      accountId?: string;
      categoryId?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    };

    const where = {
      userId: uid(req),
      deletedAt: null,
      ...(type ? { type } : {}),
      ...(accountId ? { accountId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(startDate && endDate
        ? { transactionDate: { gte: parseDate(startDate), lte: parseDate(endDate) } }
        : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" as const } },
              { reference: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, type: true } },
        },
        orderBy: { transactionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    success(res, {
      items: items.map((tx) => ({
        id: tx.id,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        type: tx.type,
        amount: tx.amount.toString(),
        currency: tx.currency,
        description: tx.description,
        transactionDate: tx.transactionDate.toISOString().slice(0, 10),
        reference: tx.reference,
        account: tx.account,
        category: tx.category,
      })),
      total,
      page,
      limit,
    });
  } catch (e) {
    next(e);
  }
});

financeRouter.post("/transactions", validateBody(createTransactionSchema), async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const count = await prisma.transaction.count({
      where: { userId: uid(req), deletedAt: null, createdAt: { gte: monthStart } },
    });
    await checkLimit(uid(req), FeatureKey.TRANSACTIONS_LIMIT, count);

    const [account, category] = await Promise.all([
      prisma.account.findFirst({ where: { id: req.body.accountId, userId: uid(req) } }),
      prisma.category.findFirst({ where: { id: req.body.categoryId, userId: uid(req) } }),
    ]);
    if (!account) throw notFound("Account not found");
    if (!category) throw notFound("Category not found");
    if (category.type !== req.body.type) throw badRequest("Category type must match transaction type");

    const tx = await prisma.transaction.create({
      data: {
        userId: uid(req),
        accountId: req.body.accountId,
        categoryId: req.body.categoryId,
        type: req.body.type,
        amount: req.body.amount,
        description: req.body.description,
        transactionDate: parseDate(req.body.transactionDate),
        reference: req.body.reference,
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
    });
    res.status(201);
    success(res, {
      id: tx.id,
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      type: tx.type,
      amount: tx.amount.toString(),
      currency: tx.currency,
      description: tx.description,
      transactionDate: tx.transactionDate.toISOString().slice(0, 10),
      reference: tx.reference,
      account: tx.account,
      category: tx.category,
    });
  } catch (e) {
    next(e);
  }
});

financeRouter.patch("/transactions/:id", validateBody(updateTransactionSchema), async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: paramId(req.params.id), userId: uid(req), deletedAt: null },
    });
    if (!existing) throw notFound("Transaction not found");

    const tx = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        ...req.body,
        ...(req.body.transactionDate ? { transactionDate: parseDate(req.body.transactionDate) } : {}),
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
    });

    await writeAuditLog({
      actorUserId: uid(req),
      action: "TRANSACTION_UPDATED",
      entityType: "transaction",
      entityId: tx.id,
      req,
    });

    success(res, {
      id: tx.id,
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      type: tx.type,
      amount: tx.amount.toString(),
      currency: tx.currency,
      description: tx.description,
      transactionDate: tx.transactionDate.toISOString().slice(0, 10),
      reference: tx.reference,
      account: tx.account,
      category: tx.category,
    });
  } catch (e) {
    next(e);
  }
});

financeRouter.delete("/transactions/:id", async (req, res, next) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: paramId(req.params.id), userId: uid(req), deletedAt: null },
    });
    if (!existing) throw notFound("Transaction not found");

    await prisma.transaction.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog({
      actorUserId: uid(req),
      action: "TRANSACTION_DELETED",
      entityType: "transaction",
      entityId: existing.id,
      req,
    });

    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

// --- Transfers ---
financeRouter.get("/transfers", async (req, res, next) => {
  try {
    const transfers = await prisma.transfer.findMany({
      where: { userId: uid(req) },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
      orderBy: { transferDate: "desc" },
      take: 100,
    });
    success(res, transfers.map(mapTransfer));
  } catch (e) {
    next(e);
  }
});

financeRouter.post("/transfers", validateBody(createTransferSchema), async (req, res, next) => {
  try {
    const [from, to] = await Promise.all([
      prisma.account.findFirst({ where: { id: req.body.fromAccountId, userId: uid(req), isActive: true } }),
      prisma.account.findFirst({ where: { id: req.body.toAccountId, userId: uid(req), isActive: true } }),
    ]);
    if (!from || !to) throw notFound("Account not found");

    const transfer = await prisma.transfer.create({
      data: {
        userId: uid(req),
        fromAccountId: req.body.fromAccountId,
        toAccountId: req.body.toAccountId,
        amount: req.body.amount,
        transferDate: parseDate(req.body.transferDate),
        note: req.body.note,
      },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
    });
    res.status(201);
    success(res, mapTransfer(transfer));
  } catch (e) {
    next(e);
  }
});

// --- Budgets ---
financeRouter.get("/budgets", async (req, res, next) => {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: uid(req) },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { startDate: "desc" },
    });
    const result = await Promise.all(budgets.map((b) => mapBudget(b, uid(req))));
    success(res, result);
  } catch (e) {
    next(e);
  }
});

financeRouter.post("/budgets", validateBody(createBudgetSchema), async (req, res, next) => {
  try {
    const count = await prisma.budget.count({ where: { userId: uid(req) } });
    await checkLimit(uid(req), FeatureKey.BUDGETS_LIMIT, count);

    const category = await prisma.category.findFirst({
      where: { id: req.body.categoryId, userId: uid(req), type: CategoryType.EXPENSE },
    });
    if (!category) throw notFound("Expense category not found");

    const budget = await prisma.budget.create({
      data: {
        userId: uid(req),
        categoryId: req.body.categoryId,
        name: req.body.name,
        amount: req.body.amount,
        period: req.body.period,
        startDate: parseDate(req.body.startDate),
        endDate: parseDate(req.body.endDate),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201);
    success(res, await mapBudget(budget, uid(req)));
  } catch (e) {
    next(e);
  }
});

financeRouter.patch("/budgets/:id", validateBody(updateBudgetSchema), async (req, res, next) => {
  try {
    const existing = await prisma.budget.findFirst({ where: { id: paramId(req.params.id), userId: uid(req) } });
    if (!existing) throw notFound("Budget not found");

    const budget = await prisma.budget.update({
      where: { id: existing.id },
      data: {
        ...req.body,
        ...(req.body.startDate ? { startDate: parseDate(req.body.startDate) } : {}),
        ...(req.body.endDate ? { endDate: parseDate(req.body.endDate) } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    success(res, await mapBudget(budget, uid(req)));
  } catch (e) {
    next(e);
  }
});

financeRouter.delete("/budgets/:id", async (req, res, next) => {
  try {
    const existing = await prisma.budget.findFirst({ where: { id: paramId(req.params.id), userId: uid(req) } });
    if (!existing) throw notFound("Budget not found");
    await prisma.budget.delete({ where: { id: existing.id } });
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

// --- Reports ---
financeRouter.get("/reports/summary", validateQuery(reportQuerySchema), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    success(res, await getReports(uid(req), parseDate(startDate), parseDate(endDate)));
  } catch (e) {
    next(e);
  }
});

// --- CSV Export ---
financeRouter.get("/reports/export.csv", validateQuery(reportQuerySchema), async (req, res, next) => {
  try {
    const allowed = await checkFeature(uid(req), FeatureKey.CSV_EXPORT);
    if (!allowed) throw forbidden("CSV export requires a Pro plan");

    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    const csv = await exportTransactionsCsv(uid(req), parseDate(startDate), parseDate(endDate));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="transactions-${startDate}-${endDate}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

financeRouter.get("/reports/export.pdf", validateQuery(reportQuerySchema), async (req, res, next) => {
  try {
    const allowed = await checkFeature(uid(req), FeatureKey.PDF_EXPORT);
    if (!allowed) throw forbidden("PDF export requires a Pro plan");

    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    const pdf = await exportTransactionsPdf(uid(req), parseDate(startDate), parseDate(endDate));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="transactions-${startDate}-${endDate}.pdf"`);
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});

financeRouter.get("/reports/export-accounts.csv", async (req, res, next) => {
  try {
    const allowed = await checkFeature(uid(req), FeatureKey.CSV_EXPORT);
    if (!allowed) throw forbidden("CSV export requires a Pro plan");

    const csv = await exportAccountsCsv(uid(req));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="accounts.csv"');
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

// --- Recurring Transactions ---
financeRouter.get("/recurring-transactions", async (req, res, next) => {
  try {
    const items = await prisma.recurringTransaction.findMany({
      where: { userId: uid(req) },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: { nextRunAt: "asc" },
    });
    success(res, items.map((r) => ({
      id: r.id,
      accountId: r.accountId,
      categoryId: r.categoryId,
      type: r.type,
      amount: r.amount.toString(),
      currency: r.currency,
      description: r.description,
      frequency: r.frequency,
      nextRunAt: r.nextRunAt.toISOString(),
      lastRunAt: r.lastRunAt?.toISOString() ?? null,
      isActive: r.isActive,
      account: r.account,
      category: r.category,
    })));
  } catch (e) {
    next(e);
  }
});

financeRouter.post("/recurring-transactions", validateBody(createRecurringSchema), async (req, res, next) => {
  try {
    const allowed = await checkFeature(uid(req), FeatureKey.RECURRING_TRANSACTIONS);
    if (!allowed) throw forbidden("Recurring transactions require a Pro plan");

    const [account, category] = await Promise.all([
      prisma.account.findFirst({ where: { id: req.body.accountId, userId: uid(req) } }),
      prisma.category.findFirst({ where: { id: req.body.categoryId, userId: uid(req) } }),
    ]);
    if (!account || !category) throw notFound("Account or category not found");
    if (category.type !== req.body.type) throw badRequest("Category type must match transaction type");

    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId: uid(req),
        accountId: req.body.accountId,
        categoryId: req.body.categoryId,
        type: req.body.type,
        amount: req.body.amount,
        description: req.body.description,
        frequency: req.body.frequency,
        nextRunAt: new Date(req.body.nextRunAt),
      },
    });
    res.status(201);
    success(res, { id: recurring.id, nextRunAt: recurring.nextRunAt.toISOString() });
  } catch (e) {
    next(e);
  }
});

financeRouter.delete("/recurring-transactions/:id", async (req, res, next) => {
  try {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: paramId(req.params.id), userId: uid(req) },
    });
    if (!existing) throw notFound("Recurring transaction not found");
    await prisma.recurringTransaction.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    success(res, { ok: true });
  } catch (e) {
    next(e);
  }
});

financeRouter.patch("/recurring-transactions/:id", validateBody(updateRecurringSchema), async (req, res, next) => {
  try {
    const allowed = await checkFeature(uid(req), FeatureKey.RECURRING_TRANSACTIONS);
    if (!allowed) throw forbidden("Recurring transactions require a Pro plan");

    const existing = await prisma.recurringTransaction.findFirst({
      where: { id: paramId(req.params.id), userId: uid(req) },
    });
    if (!existing) throw notFound("Recurring transaction not found");

    const recurring = await prisma.recurringTransaction.update({
      where: { id: existing.id },
      data: {
        ...req.body,
        ...(req.body.nextRunAt ? { nextRunAt: new Date(req.body.nextRunAt) } : {}),
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
    });

    success(res, {
      id: recurring.id,
      accountId: recurring.accountId,
      categoryId: recurring.categoryId,
      type: recurring.type,
      amount: recurring.amount.toString(),
      currency: recurring.currency,
      description: recurring.description,
      frequency: recurring.frequency,
      nextRunAt: recurring.nextRunAt.toISOString(),
      lastRunAt: recurring.lastRunAt?.toISOString() ?? null,
      isActive: recurring.isActive,
      account: recurring.account,
      category: recurring.category,
    });
  } catch (e) {
    next(e);
  }
});

// --- Subscription & Plans ---
financeRouter.get("/plans", async (_req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } });
    success(res, plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price.toString(),
      currency: p.currency,
      billingInterval: p.billingInterval,
      features: p.features,
    })));
  } catch (e) {
    next(e);
  }
});

financeRouter.get("/subscription", async (req, res, next) => {
  try {
    const sub = await getActiveSubscription(uid(req));
    const { usage, limits } = await getUsageWithLimits(uid(req));
    if (!sub) {
      success(res, null);
      return;
    }
    success(res, {
      id: sub.id,
      status: sub.status,
      startsAt: sub.startsAt.toISOString(),
      expiresAt: sub.expiresAt.toISOString(),
      plan: {
        id: sub.plan.id,
        name: sub.plan.name,
        slug: sub.plan.slug,
        price: sub.plan.price.toString(),
        currency: sub.plan.currency,
        billingInterval: sub.plan.billingInterval,
        features: sub.plan.features,
      },
      usage,
      limits,
    });
  } catch (e) {
    next(e);
  }
});

// --- Payments ---
financeRouter.get("/payments/config", async (_req, res, next) => {
  try {
    success(res, { bkashNumber: env.BKASH_PAYMENT_NUMBER ?? null });
  } catch (e) {
    next(e);
  }
});

financeRouter.get("/payments", async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: uid(req) },
      include: { subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
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
      plan: p.subscription?.plan
        ? { name: p.subscription.plan.name, slug: p.subscription.plan.slug }
        : undefined,
    })));
  } catch (e) {
    next(e);
  }
});

financeRouter.post("/payments", paymentRateLimit, validateBody(manualPaymentSchema), async (req, res, next) => {
  try {
    const plan = await prisma.plan.findFirst({ where: { slug: req.body.planSlug, isActive: true } });
    if (!plan) throw notFound("Plan not found");
    if (parseFloat(plan.price.toString()) === 0) throw badRequest("Cannot pay for free plan");

    const payment = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.create({
        data: {
          userId: uid(req),
          planId: plan.id,
          status: SubscriptionStatus.EXPIRED,
          startsAt: new Date(),
          expiresAt: new Date(),
        },
      });

      return tx.payment.create({
        data: {
          userId: uid(req),
          subscriptionId: sub.id,
          provider: PaymentProvider.BKASH,
          method: PaymentMethod.MANUAL_SEND_MONEY,
          amount: plan.price,
          currency: plan.currency,
          transactionId: req.body.transactionId,
          senderNumber: req.body.senderNumber,
          status: PaymentStatus.PENDING,
        },
      });
    });

    res.status(201);
    success(res, {
      id: payment.id,
      status: payment.status,
      message: "Payment submitted. Awaiting verification.",
      bkashNumber: env.BKASH_PAYMENT_NUMBER ?? null,
    });
  } catch (e) {
    next(e);
  }
});

async function mapBudget(
  b: {
    id: string;
    categoryId: string;
    name: string;
    amount: { toString(): string };
    period: string;
    startDate: Date;
    endDate: Date;
    category: { id: string; name: string };
  },
  userId: string,
) {
  const spentAgg = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId: b.categoryId,
      type: TransactionType.EXPENSE,
      deletedAt: null,
      transactionDate: { gte: b.startDate, lte: b.endDate },
    },
    _sum: { amount: true },
  });
  const spent = spentAgg._sum.amount?.toString() ?? "0.00";
  const limit = b.amount.toString();
  return {
    id: b.id,
    categoryId: b.categoryId,
    name: b.name,
    amount: limit,
    period: b.period,
    startDate: b.startDate.toISOString().slice(0, 10),
    endDate: b.endDate.toISOString().slice(0, 10),
    spent,
    remaining: subMoney(limit, spent),
    percent: percentOf(spent, limit),
    status: budgetStatus(spent, limit),
    category: b.category,
  };
}

function mapTransfer(t: {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: { toString(): string };
  currency: string;
  transferDate: Date;
  note: string | null;
  fromAccount?: { id: string; name: string };
  toAccount?: { id: string; name: string };
}) {
  return {
    id: t.id,
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId,
    amount: t.amount.toString(),
    currency: t.currency,
    transferDate: t.transferDate.toISOString().slice(0, 10),
    note: t.note,
    fromAccount: t.fromAccount,
    toAccount: t.toAccount,
  };
}
