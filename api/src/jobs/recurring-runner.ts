import { RecurringFrequency, TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { parseDate } from "../lib/date-utils.js";

function advanceNextRun(current: Date, frequency: RecurringFrequency): Date {
  const next = new Date(current);
  switch (frequency) {
    case RecurringFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case RecurringFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case RecurringFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
    case RecurringFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function runRecurringTransactions(): Promise<number> {
  const due = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextRunAt: { lte: new Date() } },
  });

  let processed = 0;

  for (const recurring of due) {
    const runDate = new Date(recurring.nextRunAt);
    runDate.setHours(0, 0, 0, 0);

    const existingRun = await prisma.recurringTransactionRun.findUnique({
      where: {
        recurringTransactionId_runDate: {
          recurringTransactionId: recurring.id,
          runDate,
        },
      },
    });
    if (existingRun) continue;

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: recurring.userId,
          accountId: recurring.accountId,
          categoryId: recurring.categoryId,
          type: recurring.type as TransactionType,
          amount: recurring.amount,
          currency: recurring.currency,
          description: recurring.description,
          transactionDate: runDate,
          reference: `recurring:${recurring.id}`,
        },
      });

      await tx.recurringTransactionRun.create({
        data: {
          recurringTransactionId: recurring.id,
          runDate,
          transactionId: transaction.id,
        },
      });

      await tx.recurringTransaction.update({
        where: { id: recurring.id },
        data: {
          lastRunAt: new Date(),
          nextRunAt: advanceNextRun(recurring.nextRunAt, recurring.frequency),
        },
      });
    });

    processed++;
  }

  return processed;
}

export function startRecurringJob() {
  const run = async () => {
    try {
      const count = await runRecurringTransactions();
      if (count > 0) console.log(`Recurring job: created ${count} transaction(s)`);
    } catch (err) {
      console.error("Recurring job error:", err);
    }
  };

  void run();
  setInterval(run, 60 * 60 * 1000);
}
