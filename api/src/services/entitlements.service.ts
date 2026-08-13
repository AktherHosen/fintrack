import type { PlanFeatures, FeatureKey } from "@fintrack/shared";
import { FeatureKey as FK } from "@fintrack/shared";
import { prisma } from "../lib/prisma.js";
import { forbidden } from "../lib/errors.js";

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlanFeatures(userId: string): Promise<PlanFeatures> {
  const sub = await getActiveSubscription(userId);
  if (!sub) {
    const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
    return (freePlan?.features as PlanFeatures) ?? {};
  }
  return sub.plan.features as PlanFeatures;
}

export async function checkFeature(userId: string, feature: FeatureKey): Promise<boolean> {
  const features = await getPlanFeatures(userId);
  const value = features[feature as keyof PlanFeatures];
  if (typeof value === "boolean") return value;
  return true;
}

export async function checkLimit(
  userId: string,
  feature: FeatureKey,
  currentCount: number,
): Promise<void> {
  const features = await getPlanFeatures(userId);
  const limit = features[feature as keyof PlanFeatures];
  if (typeof limit === "number" && currentCount >= limit) {
    throw forbidden(`Plan limit reached for ${feature}`);
  }
}

export async function getUsage(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [transactions, accounts, customCategories, budgets, loans] = await Promise.all([
    prisma.transaction.count({
      where: { userId, deletedAt: null, createdAt: { gte: monthStart } },
    }),
    prisma.account.count({ where: { userId, isActive: true } }),
    prisma.category.count({ where: { userId, isActive: true, isDefault: false } }),
    prisma.budget.count({ where: { userId } }),
    prisma.loan.count({ where: { userId, status: { not: "CLOSED" } } }),
  ]);

  return { transactions, accounts, categories: customCategories, budgets, loans };
}

export async function getPlanLimits(userId: string) {
  const features = await getPlanFeatures(userId);
  return {
    transactions: features[FK.TRANSACTIONS_LIMIT] ?? null,
    accounts: features[FK.ACCOUNTS_LIMIT] ?? null,
    categories: features[FK.CATEGORIES_LIMIT] ?? null,
    budgets: features[FK.BUDGETS_LIMIT] ?? null,
    loans: features[FK.LOANS_LIMIT] ?? null,
  };
}

export async function getUsageWithLimits(userId: string) {
  const [usage, limits] = await Promise.all([getUsage(userId), getPlanLimits(userId)]);
  return { usage, limits };
}

export { FK };
