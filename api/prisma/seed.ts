import {
  PrismaClient,
  UserRole,
  SubscriptionStatus,
  AccountType,
  TransactionType,
  CategoryType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { FeatureKey } from "@fintrack/shared";
import { seedUserDefaults } from "../src/lib/seed-user.js";

const prisma = new PrismaClient();

const FREE_FEATURES = {
  [FeatureKey.TRANSACTIONS_LIMIT]: 100,
  [FeatureKey.ACCOUNTS_LIMIT]: 2,
  [FeatureKey.CATEGORIES_LIMIT]: 5,
  [FeatureKey.BUDGETS_LIMIT]: 2,
  [FeatureKey.ADVANCED_REPORTS]: false,
  [FeatureKey.RECURRING_TRANSACTIONS]: false,
  [FeatureKey.CSV_EXPORT]: false,
  [FeatureKey.LOANS_LIMIT]: 2,
};

const PRO_FEATURES = {
  [FeatureKey.TRANSACTIONS_LIMIT]: null,
  [FeatureKey.ACCOUNTS_LIMIT]: null,
  [FeatureKey.CATEGORIES_LIMIT]: null,
  [FeatureKey.BUDGETS_LIMIT]: null,
  [FeatureKey.ADVANCED_REPORTS]: true,
  [FeatureKey.RECURRING_TRANSACTIONS]: true,
  [FeatureKey.CSV_EXPORT]: true,
  [FeatureKey.PDF_EXPORT]: true,
  [FeatureKey.MULTIPLE_CURRENCIES]: true,
  [FeatureKey.LOANS_LIMIT]: null,
};

const TEST_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? "Test123!";

async function ensureUserOnPlan(userId: string, planSlug: "free" | "pro-monthly") {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { slug: planSlug } });
  const now = new Date();
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + (planSlug === "free" ? 100 : 1));

  await prisma.subscription.updateMany({
    where: { userId, status: SubscriptionStatus.ACTIVE },
    data: { status: SubscriptionStatus.EXPIRED },
  });

  await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startsAt: now,
      expiresAt: expires,
    },
  });
}

async function seedDemoData(userId: string, opts: { multiCurrency?: boolean }) {
  const existingAccounts = await prisma.account.count({ where: { userId } });
  if (existingAccounts > 0) return;

  const cash = await prisma.account.create({
    data: {
      userId,
      name: "Cash",
      type: AccountType.CASH,
      currency: "BDT",
      openingBalance: "5000",
    },
  });

  const wallet = await prisma.account.create({
    data: {
      userId,
      name: "bKash",
      type: AccountType.MOBILE_WALLET,
      currency: "BDT",
      openingBalance: "12000",
    },
  });

  if (opts.multiCurrency) {
    await prisma.account.create({
      data: {
        userId,
        name: "USD Savings",
        type: AccountType.SAVINGS,
        currency: "USD",
        openingBalance: "500",
      },
    });
  }

  const salary = await prisma.category.findFirst({
    where: { userId, name: "Salary", type: CategoryType.INCOME },
  });
  const food = await prisma.category.findFirst({
    where: { userId, name: "Food", type: CategoryType.EXPENSE },
  });
  if (!salary || !food) return;

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  await prisma.transaction.createMany({
    data: [
      {
        userId,
        accountId: wallet.id,
        categoryId: salary.id,
        type: TransactionType.INCOME,
        amount: "45000",
        description: "Monthly salary",
        transactionDate: new Date(dateStr),
      },
      {
        userId,
        accountId: cash.id,
        categoryId: food.id,
        type: TransactionType.EXPENSE,
        amount: "850",
        description: "Groceries",
        transactionDate: new Date(dateStr),
      },
    ],
  });

  if (opts.multiCurrency) {
    const rent = await prisma.category.findFirst({
      where: { userId, name: "Rent", type: CategoryType.EXPENSE },
    });
    if (rent) {
      await prisma.recurringTransaction.create({
        data: {
          userId,
          accountId: wallet.id,
          categoryId: rent.id,
          type: TransactionType.EXPENSE,
          amount: "15000",
          frequency: "MONTHLY",
          description: "Apartment rent",
          nextRunAt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
        },
      });
    }

    const loanCount = await prisma.loan.count({ where: { userId } });
    if (loanCount === 0) {
      const loan = await prisma.loan.create({
        data: {
          userId,
          name: "Personal loan",
          type: "BORROWED",
          principal: "100000",
          interestRate: "12",
          currency: "BDT",
          accountId: wallet.id,
          counterparty: "City Bank",
          startDate: new Date(dateStr),
          termMonths: 24,
          monthlyPayment: "5000",
        },
      });
      await prisma.loanPayment.create({
        data: {
          userId,
          loanId: loan.id,
          amount: "5000",
          principalAmount: "4200",
          interestAmount: "800",
          paymentDate: new Date(dateStr),
          note: "First installment",
        },
      });
    }
  }
}

async function upsertTestUser(email: string, name: string, planSlug: "free" | "pro-monthly") {
  const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 12);
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.USER,
        emailVerifiedAt: new Date(),
      },
    });
    await seedUserDefaults(user.id);
    console.log(`Created test user: ${email}`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
    });
    console.log(`Updated test user: ${email}`);
  }

  await ensureUserOnPlan(user.id, planSlug);
  await seedDemoData(user.id, { multiCurrency: planSlug !== "free" });
  console.log(`  → ${planSlug.toUpperCase()} plan · password: ${TEST_USER_PASSWORD}`);
}

async function main() {
  await prisma.plan.upsert({
    where: { slug: "free" },
    update: { features: FREE_FEATURES, isActive: true },
    create: {
      name: "Free",
      slug: "free",
      price: 0,
      currency: "BDT",
      billingInterval: "MONTHLY",
      features: FREE_FEATURES,
    },
  });

  await prisma.plan.upsert({
    where: { slug: "pro-monthly" },
    update: { features: PRO_FEATURES, isActive: true, name: "Pro Monthly" },
    create: {
      name: "Pro Monthly",
      slug: "pro-monthly",
      price: 499,
      currency: "BDT",
      billingInterval: "MONTHLY",
      features: PRO_FEATURES,
    },
  });

  await prisma.plan.upsert({
    where: { slug: "pro-yearly" },
    update: { features: PRO_FEATURES, isActive: true, name: "Pro Yearly" },
    create: {
      name: "Pro Yearly",
      slug: "pro-yearly",
      price: 4990,
      currency: "BDT",
      billingInterval: "YEARLY",
      features: PRO_FEATURES,
    },
  });

  await prisma.adPlan.upsert({
    where: { slug: "ad-7d" },
    update: { isActive: true, name: "Banner · 7 days", price: 299, durationDays: 7 },
    create: {
      name: "Banner · 7 days",
      slug: "ad-7d",
      price: 299,
      currency: "BDT",
      durationDays: 7,
    },
  });

  await prisma.adPlan.upsert({
    where: { slug: "ad-30d" },
    update: { isActive: true, name: "Banner · 30 days", price: 999, durationDays: 30 },
    create: {
      name: "Banner · 30 days",
      slug: "ad-30d",
      price: 999,
      currency: "BDT",
      durationDays: 30,
    },
  });

  // Migrate legacy single "pro" plan
  const legacyPro = await prisma.plan.findUnique({ where: { slug: "pro" } });
  const proMonthly = await prisma.plan.findUnique({ where: { slug: "pro-monthly" } });
  if (legacyPro && proMonthly) {
    await prisma.subscription.updateMany({
      where: { planId: legacyPro.id },
      data: { planId: proMonthly.id },
    });
    await prisma.plan.update({
      where: { id: legacyPro.id },
      data: { isActive: false },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@fintrack.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: UserRole.SUPER_ADMIN,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Created SUPER_ADMIN: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`SUPER_ADMIN already exists: ${adminEmail}`);
  }

  console.log("\nTest accounts:");
  await upsertTestUser("free@fintrack.local", "Free User", "free");
  await upsertTestUser("pro@fintrack.local", "Pro User", "pro-monthly");

  console.log("\nSeed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
