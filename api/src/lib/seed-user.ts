import { CategoryType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "./prisma.js";

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: CategoryType.INCOME, icon: "💰" },
  { name: "Freelance", type: CategoryType.INCOME, icon: "💼" },
  { name: "Business", type: CategoryType.INCOME, icon: "🏢" },
  { name: "Investment", type: CategoryType.INCOME, icon: "📈" },
  { name: "Other Income", type: CategoryType.INCOME, icon: "➕" },
  { name: "Food", type: CategoryType.EXPENSE, icon: "🍔" },
  { name: "Transport", type: CategoryType.EXPENSE, icon: "🚗" },
  { name: "Rent", type: CategoryType.EXPENSE, icon: "🏠" },
  { name: "Bills", type: CategoryType.EXPENSE, icon: "📄" },
  { name: "Internet", type: CategoryType.EXPENSE, icon: "🌐" },
  { name: "Shopping", type: CategoryType.EXPENSE, icon: "🛍️" },
  { name: "Education", type: CategoryType.EXPENSE, icon: "📚" },
  { name: "Entertainment", type: CategoryType.EXPENSE, icon: "🎬" },
  { name: "Healthcare", type: CategoryType.EXPENSE, icon: "🏥" },
  { name: "Other", type: CategoryType.EXPENSE, icon: "📦" },
];

export async function seedUserDefaults(userId: string) {
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      userId,
      name: c.name,
      type: c.type,
      icon: c.icon,
      isDefault: true,
    })),
    skipDuplicates: true,
  });

  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (freePlan) {
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 100);

    await prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        startsAt: now,
        expiresAt: expires,
      },
    });
  }
}
