import {
  UserProfile,
  Account,
  Category,
  Transaction,
  Transfer,
  Budget,
  Loan,
  LoanPayment,
  RecurringTransaction,
  Plan,
  Subscription,
  PaymentSubmission,
  Banner,
  AuditLog,
  PaymentSettings,
} from '../types/database';

export const INITIAL_USER: UserProfile | null = null;

export const INITIAL_USERS: UserProfile[] = [];

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-free',
    name: 'Free Starter',
    slug: 'free',
    description: 'Essential personal budgeting for individuals starting their financial journey.',
    price: 0,
    billing_cycle: 'FREE',
    features: [
      'Up to 3 Accounts & Wallets',
      'Up to 5 Category Budgets',
      'Basic Income & Expense Tracking',
      '1 Month Historical Reports',
      'Single Currency (BDT)',
    ],
    limits: {
      max_accounts: 3,
      max_budgets: 5,
      export_reports: false,
      multi_currency: false,
      loans_enabled: false,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan-pro-monthly',
    name: 'Pro Monthly',
    slug: 'pro-monthly',
    description: 'Advanced analytics, unlimited accounts, loans, and automated recurring rules.',
    price: 399,
    billing_cycle: 'MONTHLY',
    features: [
      'Unlimited Accounts & Wallets',
      'Unlimited Category Budgets',
      'Debt & Loan Manager with Repayments',
      'Automated Recurring Bills & Salary',
      'Advanced Analytics & CSV Export',
      'Multi-Currency (BDT, USD, EUR)',
      'Priority Support',
    ],
    limits: {
      max_accounts: 9999,
      max_budgets: 9999,
      export_reports: true,
      multi_currency: true,
      loans_enabled: true,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan-pro-yearly',
    name: 'Pro Yearly',
    slug: 'pro-yearly',
    description: 'Best value for power users. Save 25% with annual billing + early feature access.',
    price: 2690,
    billing_cycle: 'YEARLY',
    features: [
      'All Pro Monthly Features',
      '2 Months Free Included',
      'Automated CSV Bank Importers',
      'Custom Categories & Custom Badges',
      'Early Access to Beta Features',
      'VIP Concierge Support',
    ],
    limits: {
      max_accounts: 9999,
      max_budgets: 9999,
      export_reports: true,
      multi_currency: true,
      loans_enabled: true,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan-lifetime',
    name: 'Lifetime Founder',
    slug: 'lifetime',
    description:
      'One-time payment for lifetime access to all current and future FinTrack features.',
    price: 4999,
    billing_cycle: 'LIFETIME',
    features: [
      'Everything in Pro Yearly Forever',
      'Founder Badge on Profile',
      'No Recurring Subscriptions',
      'Direct Access to Developer Roadmap',
      'Unlimited Everything',
    ],
    limits: {
      max_accounts: 99999,
      max_budgets: 99999,
      export_reports: true,
      multi_currency: true,
      loans_enabled: true,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_ACCOUNTS: Account[] = [];

export const INITIAL_CATEGORIES: Category[] = [
  // Income Categories
  {
    id: 'cat-inc-1',
    name: 'Salary & Earnings',
    type: 'INCOME',
    color: '#10b981',
    icon: 'Briefcase',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-inc-2',
    name: 'Freelance & Contract',
    type: 'INCOME',
    color: '#059669',
    icon: 'Laptop',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-inc-3',
    name: 'Investments & Profit',
    type: 'INCOME',
    color: '#3b82f6',
    icon: 'TrendingUp',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Expense Categories
  {
    id: 'cat-exp-1',
    name: 'Food & Dining',
    type: 'EXPENSE',
    color: '#f97316',
    icon: 'Utensils',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-exp-2',
    name: 'Groceries & Market',
    type: 'EXPENSE',
    color: '#84cc16',
    icon: 'ShoppingCart',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-exp-3',
    name: 'Housing & Rent',
    type: 'EXPENSE',
    color: '#6366f1',
    icon: 'Home',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-exp-4',
    name: 'Utilities & Bills',
    type: 'EXPENSE',
    color: '#eab308',
    icon: 'Zap',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-exp-5',
    name: 'Transportation & Fuel',
    type: 'EXPENSE',
    color: '#06b6d4',
    icon: 'Car',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-exp-6',
    name: 'Shopping & Apparel',
    type: 'EXPENSE',
    color: '#a855f7',
    icon: 'ShoppingBag',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-exp-7',
    name: 'Entertainment & Leisure',
    type: 'EXPENSE',
    color: '#ec4899',
    icon: 'Film',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-exp-8',
    name: 'Healthcare & Medical',
    type: 'EXPENSE',
    color: '#ef4444',
    icon: 'HeartPulse',
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [];

export const INITIAL_LOANS: Loan[] = [];

export const INITIAL_RECURRING: RecurringTransaction[] = [];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'bnr-1',
    title: '⚡ Upgrade to Pro & Unlock Unlimited Budgets',
    description:
      'Get advanced debt ledgers, recurring bill automations, and CSV exports with 25% off annual billing.',
    link_url: '/settings',
    button_text: 'View Pro Features',
    type: 'UPGRADE',
    position: 'ALL_PAGES',
    target_audience: 'ALL',
    priority: 10,
    is_active: true,
    background_color: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
    text_color: '#ffffff',
    badge_text: 'Limited 25% Off',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    impression_count: 0,
    click_count: 0,
  },
  {
    id: 'bnr-2',
    title: '✨ Track Automated Debts & Personal Loans',
    description:
      'Keep track of lent or borrowed money with auto calculations of remaining balances and due dates.',
    link_url: '/loans',
    button_text: 'Try Loans Now',
    type: 'FEATURE',
    position: 'ALL_PAGES',
    target_audience: 'ALL',
    priority: 8,
    is_active: true,
    background_color: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    text_color: '#ffffff',
    badge_text: 'New Module',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    impression_count: 0,
    click_count: 0,
  },
];

export const INITIAL_PAYMENTS: PaymentSubmission[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_PAYMENT_SETTINGS: PaymentSettings = {
  bkash_number: '01711234567',
  bkash_type: 'MERCHANT',
  is_bkash_active: true,
  nagad_number: '01811234567',
  nagad_type: 'PERSONAL',
  is_nagad_active: true,
  rocket_number: '01911234567',
  rocket_type: 'PERSONAL',
  is_rocket_active: true,
  instructions_en:
    '1. Send the exact amount via Send Money or Merchant Payment to our official wallet.\n2. Note down the 10-character Transaction ID (TrxID) from your SMS.\n3. Enter your Sender Number & TrxID below to complete instant verification.',
  instructions_bn:
    '১. আমাদের অফিসিয়াল ওয়ালেটে সঠিক পরিমাণ টাকা সেন্ড মানি অথবা পেমেন্ট করুন।\n২. ফিরতি এসএমএস থেকে ১০ সংখ্যার ট্রানজেকশন আইডি (TrxID) সংরক্ষণ করুন।\n৩. তাৎক্ষণিক ভেরিফিকেশনের জন্য নিচে আপনার সেন্ডার নম্বর ও TrxID প্রদান করুন।',
  updated_at: new Date().toISOString(),
};
