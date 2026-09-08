-- ==============================================================================
-- 005_seed_data.sql
-- Seed Data for Default Categories, Plans, and System Banners
-- ==============================================================================

-- 1. Default Categories (is_system = TRUE, user_id = NULL)
INSERT INTO public.categories (name, type, color, icon, is_system)
VALUES
  -- Expense Categories
  ('Food & Dining', 'EXPENSE', '#f97316', 'Utensils', TRUE),
  ('Groceries', 'EXPENSE', '#84cc16', 'ShoppingCart', TRUE),
  ('Housing & Rent', 'EXPENSE', '#3b82f6', 'Home', TRUE),
  ('Transportation', 'EXPENSE', '#06b6d4', 'Car', TRUE),
  ('Utilities & Bills', 'EXPENSE', '#eab308', 'Zap', TRUE),
  ('Entertainment', 'EXPENSE', '#ec4899', 'Film', TRUE),
  ('Health & Medical', 'EXPENSE', '#ef4444', 'HeartPulse', TRUE),
  ('Shopping & Clothes', 'EXPENSE', '#a855f7', 'ShoppingBag', TRUE),
  ('Education', 'EXPENSE', '#6366f1', 'GraduationCap', TRUE),
  ('Personal Care', 'EXPENSE', '#14b8a6', 'Sparkles', TRUE),
  ('Debt & Loan Repayment', 'EXPENSE', '#64748b', 'CreditCard', TRUE),
  ('Donations & Gifts', 'EXPENSE', '#f43f5e', 'Gift', TRUE),
  ('Miscellaneous Expense', 'EXPENSE', '#94a3b8', 'HelpCircle', TRUE),

  -- Income Categories
  ('Salary', 'INCOME', '#10b981', 'Briefcase', TRUE),
  ('Freelance / Projects', 'INCOME', '#059669', 'Laptop', TRUE),
  ('Investments & Dividends', 'INCOME', '#3b82f6', 'TrendingUp', TRUE),
  ('Rental Income', 'INCOME', '#8b5cf6', 'Building', TRUE),
  ('Gifts & Grants', 'INCOME', '#f59e0b', 'Award', TRUE),
  ('Other Income', 'INCOME', '#64748b', 'DollarSign', TRUE)
ON CONFLICT DO NOTHING;

-- 2. Default Plans
INSERT INTO public.plans (name, slug, description, price, billing_cycle, features, limits, is_active)
VALUES
  (
    'Free Starter',
    'free',
    'Essential personal budgeting for individuals starting their financial journey.',
    0.0000,
    'FREE',
    '["Up to 3 Accounts", "Up to 5 Category Budgets", "Basic Income & Expense Tracking", "1 Month Historical Reports", "Single Currency (BDT)"]'::JSONB,
    '{"max_accounts": 3, "max_budgets": 5, "export_reports": false, "multi_currency": false, "loans_enabled": true}'::JSONB,
    TRUE
  ),
  (
    'Pro Monthly',
    'pro-monthly',
    'Advanced analytics, unlimited accounts, loans, and automated recurring rules.',
    299.0000,
    'MONTHLY',
    '["Unlimited Accounts & Wallets", "Unlimited Category Budgets", "Debt & Loan Manager with Repayments", "Automated Recurring Bills & Salary", "Advanced Analytics & CSV Export", "Multi-Currency (BDT, USD, EUR)", "Priority Support"]'::JSONB,
    '{"max_accounts": 9999, "max_budgets": 9999, "export_reports": true, "multi_currency": true, "loans_enabled": true}'::JSONB,
    TRUE
  ),
  (
    'Pro Yearly',
    'pro-yearly',
    'Best value for power users. Save 25% with annual billing + early feature access.',
    2690.0000,
    'YEARLY',
    '["All Pro Monthly Features", "2 Months Free", "Automated CSV Bank Importers", "Custom Categories & Custom Badges", "Early Access to Beta Features", "VIP Concierge Support"]'::JSONB,
    '{"max_accounts": 9999, "max_budgets": 9999, "export_reports": true, "multi_currency": true, "loans_enabled": true}'::JSONB,
    TRUE
  ),
  (
    'Lifetime Founder',
    'lifetime',
    'One-time payment for lifetime access to all current and future FinTrack features.',
    4999.0000,
    'LIFETIME',
    '["Everything in Pro Yearly Forever", "Founder Badge on Profile", "No Recurring Subscriptions", "Direct Access to Developer Roadmap", "Unlimited Everything"]'::JSONB,
    '{"max_accounts": 99999, "max_budgets": 99999, "export_reports": true, "multi_currency": true, "loans_enabled": true}'::JSONB,
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Starter Promotional Banners
INSERT INTO public.banners (
  title,
  description,
  link_url,
  button_text,
  type,
  position,
  target_audience,
  priority,
  is_active,
  background_color,
  text_color,
  badge_text
)
VALUES
  (
    '⚡ Upgrade to Pro & Save 25%',
    'Unlock unlimited accounts, advanced cashflow projections, and automated recurring bills today.',
    '/settings#plans',
    'Upgrade Now',
    'UPGRADE',
    'DASHBOARD',
    'FREE_USERS',
    10,
    TRUE,
    'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    '#ffffff',
    'Limited Offer'
  ),
  (
    '✨ New: Debt & Loan Management Ledger',
    'Track money you lent to friends or borrowed with partial payment schedules and due dates.',
    '/loans',
    'Explore Loans',
    'FEATURE',
    'DASHBOARD',
    'ALL',
    5,
    TRUE,
    'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    '#ffffff',
    'New Feature'
  ),
  (
    '📱 Quick bKash & Nagad Account Sync',
    'Keep your mobile wallets organized and monitor your daily cash flow effortlessly.',
    '/accounts',
    'Manage Accounts',
    'ANNOUNCEMENT',
    'TRANSACTIONS',
    'ALL',
    3,
    TRUE,
    'linear-gradient(135deg, #701a75 0%, #86198f 50%, #a21caf 100%)',
    '#ffffff',
    'Tip'
  )
ON CONFLICT DO NOTHING;
