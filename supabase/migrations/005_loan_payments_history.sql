-- Migration: 005_loan_payments_history.sql
-- Description: Ensures loan_payments table exists with correct columns and Row-Level Security policies.

CREATE TABLE IF NOT EXISTS public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(19,4) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by loan_id
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON public.loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_date ON public.loan_payments(payment_date DESC);

-- Enable Row Level Security
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies (safely drop first, then create)
DROP POLICY IF EXISTS "loan_payments_select_own" ON public.loan_payments;
CREATE POLICY "loan_payments_select_own" ON public.loan_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "loan_payments_insert_own" ON public.loan_payments;
CREATE POLICY "loan_payments_insert_own" ON public.loan_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "loan_payments_update_own" ON public.loan_payments;
CREATE POLICY "loan_payments_update_own" ON public.loan_payments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "loan_payments_delete_own" ON public.loan_payments;
CREATE POLICY "loan_payments_delete_own" ON public.loan_payments
  FOR DELETE USING (auth.uid() = user_id);
