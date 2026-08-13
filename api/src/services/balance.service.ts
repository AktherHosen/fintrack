import { TransactionType } from "@prisma/client";
import { addMoney, subMoney, toMoney } from "@fintrack/shared";
import { prisma } from "../lib/prisma.js";

export async function getAccountBalance(accountId: string, userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) return "0.00";

  let balance = toMoney(account.openingBalance.toString());

  const transactions = await prisma.transaction.findMany({
    where: { accountId, userId, deletedAt: null },
    select: { type: true, amount: true },
  });

  for (const tx of transactions) {
    const amt = tx.amount.toString();
    balance =
      tx.type === TransactionType.INCOME ? addMoney(balance, amt) : subMoney(balance, amt);
  }

  const transfersIn = await prisma.transfer.findMany({
    where: { toAccountId: accountId, userId },
    select: { amount: true },
  });
  for (const t of transfersIn) {
    balance = addMoney(balance, t.amount.toString());
  }

  const transfersOut = await prisma.transfer.findMany({
    where: { fromAccountId: accountId, userId },
    select: { amount: true },
  });
  for (const t of transfersOut) {
    balance = subMoney(balance, t.amount.toString());
  }

  return balance;
}

export async function getTotalBalance(userId: string): Promise<string> {
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    select: { id: true },
  });

  let total = "0.00";
  for (const acc of accounts) {
    total = addMoney(total, await getAccountBalance(acc.id, userId));
  }
  return total;
}

export async function getPeriodTotals(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<{ income: string; expenses: string }> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      transactionDate: { gte: startDate, lte: endDate },
    },
    select: { type: true, amount: true },
  });

  let income = "0.00";
  let expenses = "0.00";

  for (const tx of transactions) {
    const amt = tx.amount.toString();
    if (tx.type === TransactionType.INCOME) income = addMoney(income, amt);
    else expenses = addMoney(expenses, amt);
  }

  return { income, expenses };
}

export async function getAllTimeTotals(userId: string): Promise<{ income: string; expenses: string }> {
  const transactions = await prisma.transaction.findMany({
    where: { userId, deletedAt: null },
    select: { type: true, amount: true },
  });

  let income = "0.00";
  let expenses = "0.00";

  for (const tx of transactions) {
    const amt = tx.amount.toString();
    if (tx.type === TransactionType.INCOME) income = addMoney(income, amt);
    else expenses = addMoney(expenses, amt);
  }

  return { income, expenses };
}
