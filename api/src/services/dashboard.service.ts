import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, parseDate } from "../lib/date-utils.js";
import { addMoney, subMoney } from "@fintrack/shared";
import { TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getAccountBalance, getPeriodTotals, getTotalBalance, getAllTimeTotals } from "./balance.service.js";
import { budgetStatus, percentOf } from "@fintrack/shared";

export async function getDashboard(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevStart = startOfMonth(subMonths(now, 1));
  const prevEnd = endOfMonth(subMonths(now, 1));

  const [totalBalance, current, previous, recentTxns, accounts, budgets] = await Promise.all([
    getTotalBalance(userId),
    getPeriodTotals(userId, monthStart, monthEnd),
    getPeriodTotals(userId, prevStart, prevEnd),
    prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, type: true } },
      },
      orderBy: { transactionDate: "desc" },
      take: 10,
    }),
    prisma.account.findMany({ where: { userId, isActive: true } }),
    prisma.budget.findMany({
      where: { userId, startDate: { lte: now }, endDate: { gte: now } },
      include: { category: { select: { id: true, name: true } } },
    }),
  ]);

  const netCashFlow = subMoney(current.income, current.expenses);
  const prevNet = subMoney(previous.income, previous.expenses);
  const prevNum = parseFloat(prevNet);
  const changePercent =
    prevNum === 0 ? 0 : Math.round(((parseFloat(netCashFlow) - prevNum) / Math.abs(prevNum)) * 1000) / 10;

  const days = eachDayOfInterval({ start: monthStart, end: now > monthEnd ? monthEnd : now });
  const cashFlowSeries = await Promise.all(
    days.map(async (day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayStart = new Date(dayStr);
      const dayEnd = new Date(dayStr);
      dayEnd.setHours(23, 59, 59, 999);
      const totals = await getPeriodTotals(userId, dayStart, dayEnd);
      return { date: dayStr, income: totals.income, expense: totals.expenses };
    }),
  );

  const accountBalances = await Promise.all(
    accounts.map(async (a) => ({
      id: a.id,
      name: a.name,
      balance: await getAccountBalance(a.id, userId),
    })),
  );

  const budgetProgress = await Promise.all(
    budgets.map(async (b) => {
      const spentTxns = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: b.categoryId,
          type: TransactionType.EXPENSE,
          deletedAt: null,
          transactionDate: { gte: b.startDate, lte: b.endDate },
        },
        _sum: { amount: true },
      });
      const spent = spentTxns._sum.amount?.toString() ?? "0.00";
      const limit = b.amount.toString();
      const remaining = subMoney(limit, spent);
      const percent = percentOf(spent, limit);
      return {
        id: b.id,
        name: b.name,
        categoryName: b.category.name,
        amount: limit,
        spent,
        remaining,
        percent,
        status: budgetStatus(spent, limit),
      };
    }),
  );

  return {
    totalBalance,
    income: current.income,
    expenses: current.expenses,
    netCashFlow,
    changePercent,
    recentTransactions: recentTxns.map(mapTransaction),
    cashFlowSeries,
    accountBalances,
    budgetProgress,
  };
}

function withRemaining(totals: { income: string; expenses: string }) {
  return {
    income: totals.income,
    expenses: totals.expenses,
    remaining: subMoney(totals.income, totals.expenses),
  };
}

export async function getCashflowSummary(userId: string) {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const todayStart = parseDate(todayStr);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  monthEnd.setHours(23, 59, 59, 999);

  const [today, month, total] = await Promise.all([
    getPeriodTotals(userId, todayStart, todayEnd),
    getPeriodTotals(userId, monthStart, monthEnd),
    getAllTimeTotals(userId),
  ]);

  return {
    today: withRemaining(today),
    month: withRemaining(month),
    total: withRemaining(total),
  };
}

export async function getReports(userId: string, startDate: Date, endDate: Date) {
  const totals = await getPeriodTotals(userId, startDate, endDate);

  const byCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      deletedAt: null,
      transactionDate: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  const categoryIds = byCategory.map((c) => c.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const expenseByCategory = byCategory.map((c) => ({
    categoryId: c.categoryId,
    categoryName: catMap[c.categoryId] ?? "Unknown",
    amount: c._sum.amount?.toString() ?? "0.00",
  }));

  const totalExpenses = expenseByCategory.reduce(
    (sum, c) => addMoney(sum, c.amount),
    "0.00",
  );

  const expenseBreakdown = expenseByCategory.map((c) => ({
    ...c,
    percent: parseFloat(totalExpenses) === 0 ? 0 : percentOf(c.amount, totalExpenses),
  }));

  const accounts = await prisma.account.findMany({ where: { userId, isActive: true } });
  const accountReport = await Promise.all(
    accounts.map(async (a) => ({
      id: a.id,
      name: a.name,
      balance: await getAccountBalance(a.id, userId),
    })),
  );

  return {
    income: totals.income,
    expenses: totals.expenses,
    net: subMoney(totals.income, totals.expenses),
    expenseByCategory: expenseBreakdown,
    accountReport,
  };
}

function mapTransaction(tx: {
  id: string;
  accountId: string;
  categoryId: string;
  type: string;
  amount: { toString(): string };
  currency: string;
  description: string | null;
  transactionDate: Date;
  reference: string | null;
  account: { id: string; name: string };
  category: { id: string; name: string; type: string };
}) {
  return {
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
  };
}
