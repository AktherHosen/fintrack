-- AlterTable
ALTER TABLE "users" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('BORROWED', 'LENT');
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'PAID_OFF', 'CLOSED');

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LoanType" NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "principal" DECIMAL(19,4) NOT NULL,
    "interest_rate" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "account_id" TEXT,
    "counterparty" TEXT,
    "start_date" DATE NOT NULL,
    "term_months" INTEGER,
    "monthly_payment" DECIMAL(19,4),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loan_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "principal_amount" DECIMAL(19,4) NOT NULL,
    "interest_amount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "payment_date" DATE NOT NULL,
    "note" TEXT,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loan_payments_transaction_id_key" ON "loan_payments"("transaction_id");
CREATE INDEX "loans_user_id_status_idx" ON "loans"("user_id", "status");
CREATE INDEX "loan_payments_loan_id_payment_date_idx" ON "loan_payments"("loan_id", "payment_date");
CREATE INDEX "loan_payments_user_id_idx" ON "loan_payments"("user_id");

ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loans" ADD CONSTRAINT "loans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loan_payments" ADD CONSTRAINT "loan_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
