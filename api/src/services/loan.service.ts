import { LoanStatus, TransactionType } from "@prisma/client";
import { addMoney, subMoney, compareMoney, percentOf } from "@fintrack/shared";
import { prisma } from "../lib/prisma.js";
import { parseDate } from "../lib/date-utils.js";
import { notFound, badRequest } from "../lib/errors.js";
import type { CreateLoanInput, RecordLoanPaymentInput, UpdateLoanInput } from "@fintrack/shared";

type LoanRecord = {
  id: string;
  name: string;
  type: string;
  status: string;
  principal: { toString(): string };
  interestRate: { toString(): string };
  currency: string;
  accountId: string | null;
  counterparty: string | null;
  startDate: Date;
  termMonths: number | null;
  monthlyPayment: { toString(): string } | null;
  notes: string | null;
  account?: { id: string; name: string } | null;
  payments?: { principalAmount: { toString(): string } }[];
};

function sumPrincipalPaid(payments: { principalAmount: { toString(): string } }[]): string {
  return payments.reduce((sum, p) => addMoney(sum, p.principalAmount.toString()), "0.00");
}

export function mapLoan(loan: LoanRecord) {
  const payments = loan.payments ?? [];
  const totalPaid = sumPrincipalPaid(payments);
  const remainingBalance = subMoney(loan.principal.toString(), totalPaid);
  const percentPaid = percentOf(totalPaid, loan.principal.toString());
  const isPaidOff = compareMoney(remainingBalance, "0") <= 0;

  return {
    id: loan.id,
    name: loan.name,
    type: loan.type,
    status: isPaidOff && loan.status === LoanStatus.ACTIVE ? LoanStatus.PAID_OFF : loan.status,
    principal: loan.principal.toString(),
    interestRate: loan.interestRate.toString(),
    currency: loan.currency,
    accountId: loan.accountId,
    counterparty: loan.counterparty,
    startDate: loan.startDate.toISOString().slice(0, 10),
    termMonths: loan.termMonths,
    monthlyPayment: loan.monthlyPayment?.toString() ?? null,
    notes: loan.notes,
    totalPaid,
    remainingBalance: compareMoney(remainingBalance, "0") < 0 ? "0.00" : remainingBalance,
    percentPaid,
    account: loan.account ?? null,
  };
}

export async function listLoans(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId, status: { not: LoanStatus.CLOSED } },
    include: {
      account: { select: { id: true, name: true } },
      payments: { select: { principalAmount: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return loans.map(mapLoan);
}

export async function getLoan(userId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId },
    include: {
      account: { select: { id: true, name: true } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
  if (!loan) throw notFound("Loan not found");

  const mapped = mapLoan(loan);
  return {
    ...mapped,
    payments: loan.payments.map((p: { id: string; loanId: string; amount: { toString(): string }; principalAmount: { toString(): string }; interestAmount: { toString(): string }; paymentDate: Date; note: string | null; transactionId: string | null }) => ({
      id: p.id,
      loanId: p.loanId,
      amount: p.amount.toString(),
      principalAmount: p.principalAmount.toString(),
      interestAmount: p.interestAmount.toString(),
      paymentDate: p.paymentDate.toISOString().slice(0, 10),
      note: p.note,
      transactionId: p.transactionId,
    })),
  };
}

export async function createLoan(userId: string, input: CreateLoanInput) {
  if (input.accountId) {
    const account = await prisma.account.findFirst({
      where: { id: input.accountId, userId, isActive: true },
    });
    if (!account) throw notFound("Account not found");
  }

  const loan = await prisma.loan.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      principal: input.principal,
      interestRate: input.interestRate ?? "0",
      currency: input.currency ?? "BDT",
      accountId: input.accountId,
      counterparty: input.counterparty,
      startDate: parseDate(input.startDate),
      termMonths: input.termMonths,
      monthlyPayment: input.monthlyPayment,
      notes: input.notes,
    },
    include: {
      account: { select: { id: true, name: true } },
      payments: { select: { principalAmount: true } },
    },
  });

  return mapLoan(loan);
}

export async function updateLoan(userId: string, loanId: string, input: UpdateLoanInput) {
  const existing = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!existing) throw notFound("Loan not found");

  if (input.accountId) {
    const account = await prisma.account.findFirst({
      where: { id: input.accountId, userId, isActive: true },
    });
    if (!account) throw notFound("Account not found");
  }

  const loan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      ...input,
      ...(input.startDate ? { startDate: parseDate(input.startDate) } : {}),
    },
    include: {
      account: { select: { id: true, name: true } },
      payments: { select: { principalAmount: true } },
    },
  });

  return mapLoan(loan);
}

export async function closeLoan(userId: string, loanId: string) {
  const existing = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!existing) throw notFound("Loan not found");

  await prisma.loan.update({
    where: { id: loanId },
    data: { status: LoanStatus.CLOSED },
  });

  return { ok: true };
}

export async function recordLoanPayment(
  userId: string,
  loanId: string,
  input: RecordLoanPaymentInput,
) {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId, status: LoanStatus.ACTIVE },
    include: { payments: { select: { principalAmount: true } } },
  });
  if (!loan) throw notFound("Active loan not found");

  const totalPaid = sumPrincipalPaid(loan.payments);
  const remaining = subMoney(loan.principal.toString(), totalPaid);
  const interestAmount = input.interestAmount ?? "0";
  const principalAmount = input.principalAmount ?? subMoney(input.amount, interestAmount);

  if (compareMoney(principalAmount, remaining) > 0) {
    throw badRequest("Payment exceeds remaining balance");
  }

  let transactionId: string | undefined;

  if (input.createTransaction) {
    if (!loan.accountId) throw badRequest("Loan has no linked account for transaction");
    if (!input.categoryId) throw badRequest("Category required when creating transaction");

    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, userId },
    });
    if (!category) throw notFound("Category not found");

    const txType =
      loan.type === "BORROWED" ? TransactionType.EXPENSE : TransactionType.INCOME;
    if (category.type !== txType) throw badRequest("Category type must match loan payment type");

    const tx = await prisma.transaction.create({
      data: {
        userId,
        accountId: loan.accountId,
        categoryId: input.categoryId,
        type: txType,
        amount: input.amount,
        currency: loan.currency,
        description: `Loan payment: ${loan.name}`,
        transactionDate: parseDate(input.paymentDate),
        reference: `loan:${loan.id}`,
      },
    });
    transactionId = tx.id;
  }

  const payment = await prisma.loanPayment.create({
    data: {
      userId,
      loanId,
      amount: input.amount,
      principalAmount,
      interestAmount,
      paymentDate: parseDate(input.paymentDate),
      note: input.note,
      transactionId,
    },
  });

  const newRemaining = subMoney(remaining, principalAmount);
  if (compareMoney(newRemaining, "0") <= 0) {
    await prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.PAID_OFF },
    });
  }

  return {
    id: payment.id,
    loanId: payment.loanId,
    amount: payment.amount.toString(),
    principalAmount: payment.principalAmount.toString(),
    interestAmount: payment.interestAmount.toString(),
    paymentDate: payment.paymentDate.toISOString().slice(0, 10),
    note: payment.note,
    transactionId: payment.transactionId,
  };
}

export async function getLoanSummary(userId: string) {
  const loans = await listLoans(userId);
  let borrowedRemaining = "0.00";
  let lentRemaining = "0.00";

  for (const loan of loans) {
    if (loan.status === LoanStatus.CLOSED) continue;
    if (loan.type === "BORROWED") {
      borrowedRemaining = addMoney(borrowedRemaining, loan.remainingBalance);
    } else {
      lentRemaining = addMoney(lentRemaining, loan.remainingBalance);
    }
  }

  return {
    borrowedRemaining,
    lentRemaining,
    netDebt: subMoney(borrowedRemaining, lentRemaining),
    activeCount: loans.filter((l: { status: string }) => l.status === LoanStatus.ACTIVE).length,
  };
}
