-- ==============================================================================
-- 002_rls_policies.sql
-- Row Level Security (RLS) Policies for FinTrack (Idempotent & Re-runnable)
-- ==============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_select_own" ON public.accounts;
CREATE POLICY "accounts_select_own" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "accounts_insert_own" ON public.accounts;
CREATE POLICY "accounts_insert_own" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "accounts_update_own" ON public.accounts;
CREATE POLICY "accounts_update_own" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "accounts_delete_own" ON public.accounts;
CREATE POLICY "accounts_delete_own" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 3. Categories table (users see system defaults + their own custom)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING ((auth.uid() = user_id AND NOT is_system) OR public.is_admin());

DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;
CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING ((auth.uid() = user_id AND NOT is_system) OR public.is_admin());

-- 4. Transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON public.transactions;
CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "transactions_delete_own" ON public.transactions;
CREATE POLICY "transactions_delete_own" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 5. Transfers table
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transfers_select_own" ON public.transfers;
CREATE POLICY "transfers_select_own" ON public.transfers
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "transfers_insert_own" ON public.transfers;
CREATE POLICY "transfers_insert_own" ON public.transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transfers_update_own" ON public.transfers;
CREATE POLICY "transfers_update_own" ON public.transfers
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "transfers_delete_own" ON public.transfers;
CREATE POLICY "transfers_delete_own" ON public.transfers
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 6. Budgets table
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select_own" ON public.budgets;
CREATE POLICY "budgets_select_own" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "budgets_insert_own" ON public.budgets;
CREATE POLICY "budgets_insert_own" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;
CREATE POLICY "budgets_update_own" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "budgets_delete_own" ON public.budgets;
CREATE POLICY "budgets_delete_own" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 7. Loans table
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loans_select_own" ON public.loans;
CREATE POLICY "loans_select_own" ON public.loans
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loans_insert_own" ON public.loans;
CREATE POLICY "loans_insert_own" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loans_update_own" ON public.loans;
CREATE POLICY "loans_update_own" ON public.loans
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loans_delete_own" ON public.loans;
CREATE POLICY "loans_delete_own" ON public.loans
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 8. Loan Payments table
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loan_payments_select_own" ON public.loan_payments;
CREATE POLICY "loan_payments_select_own" ON public.loan_payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loan_payments_insert_own" ON public.loan_payments;
CREATE POLICY "loan_payments_insert_own" ON public.loan_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loan_payments_update_own" ON public.loan_payments;
CREATE POLICY "loan_payments_update_own" ON public.loan_payments
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "loan_payments_delete_own" ON public.loan_payments;
CREATE POLICY "loan_payments_delete_own" ON public.loan_payments
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 9. Recurring Transactions table
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring_select_own" ON public.recurring_transactions;
CREATE POLICY "recurring_select_own" ON public.recurring_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "recurring_insert_own" ON public.recurring_transactions;
CREATE POLICY "recurring_insert_own" ON public.recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recurring_update_own" ON public.recurring_transactions;
CREATE POLICY "recurring_update_own" ON public.recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "recurring_delete_own" ON public.recurring_transactions;
CREATE POLICY "recurring_delete_own" ON public.recurring_transactions
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 10. Recurring Runs
ALTER TABLE public.recurring_transaction_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recurring_runs_select" ON public.recurring_transaction_runs;
CREATE POLICY "recurring_runs_select" ON public.recurring_transaction_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recurring_transactions rt
      WHERE rt.id = recurring_transaction_id AND (rt.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 11. Plans table (Public read, admin write)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_select_all" ON public.plans;
CREATE POLICY "plans_select_all" ON public.plans
  FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "plans_admin_manage" ON public.plans;
CREATE POLICY "plans_admin_manage" ON public.plans
  FOR ALL USING (public.is_admin());

-- 12. Subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "subscriptions_update_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_update_admin" ON public.subscriptions
  FOR UPDATE USING (public.is_admin() OR auth.uid() = user_id);

-- 13. Payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
CREATE POLICY "payments_admin_update" ON public.payments
  FOR UPDATE USING (public.is_admin());

-- 14. Audit logs (Admin read-all, user read-own)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (TRUE);
