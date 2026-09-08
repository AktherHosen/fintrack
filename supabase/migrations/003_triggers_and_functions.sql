-- ==============================================================================
-- 003_triggers_and_functions.sql
-- Triggers and Stored Procedures for FinTrack v2
-- ==============================================================================

-- 1. Auto handle new user registration in auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.email = 'admin@fintrack.app' THEN 'ADMIN'
      ELSE 'USER'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      updated_at = NOW();

  -- Create default starter accounts for new user
  INSERT INTO public.accounts (user_id, name, type, balance, currency, color, icon)
  VALUES
    (NEW.id, 'Cash Wallet', 'CASH', 0.0000, 'BDT', '#10b981', 'Wallet'),
    (NEW.id, 'bKash Personal', 'MOBILE_BANKING', 0.0000, 'BDT', '#ec4899', 'Smartphone'),
    (NEW.id, 'Main Bank', 'BANK', 0.0000, 'BDT', '#3b82f6', 'Building2');

  -- Assign Free Plan Subscription
  INSERT INTO public.subscriptions (user_id, plan_id, status, starts_at)
  SELECT NEW.id, p.id, 'ACTIVE', NOW()
  FROM public.plans p
  WHERE p.slug = 'free'
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute when a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Trigger to update account balance on transaction change
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE or UPDATE old transaction
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.type = 'INCOME' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'EXPENSE' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    END IF;
  END IF;

  -- Handle INSERT or UPDATE new transaction
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.type = 'INCOME' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'EXPENSE' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_transaction_balance ON public.transactions;
CREATE TRIGGER trg_transaction_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance_on_transaction();


-- 3. Trigger to update account balances on transfer
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transfer()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE or UPDATE old transfer
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    UPDATE public.accounts SET balance = balance + OLD.amount + OLD.fee WHERE id = OLD.from_account_id;
    UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
  END IF;

  -- Handle INSERT or UPDATE new transfer
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.accounts SET balance = balance - (NEW.amount + NEW.fee) WHERE id = NEW.from_account_id;
    UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_transfer_balance ON public.transfers;
CREATE TRIGGER trg_transfer_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance_on_transfer();


-- 4. Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
  END LOOP;
END;
$$;
