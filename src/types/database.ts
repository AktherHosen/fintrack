export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';
export type AccountType =
  'CASH' | 'BANK' | 'MOBILE_BANKING' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER';
export type CategoryType = 'INCOME' | 'EXPENSE';
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type LoanType = 'LENT' | 'BORROWED';
export type LoanStatus = 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type FrequencyType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type BillingCycle = 'FREE' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'MANUAL';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BannerType = 'PROMOTIONAL' | 'ANNOUNCEMENT' | 'UPGRADE' | 'FEATURE';
export type BannerPosition = 'DASHBOARD' | 'TRANSACTIONS' | 'ALL_PAGES' | 'LOGIN';
export type TargetAudience = 'ALL' | 'FREE_USERS' | 'PRO_USERS' | 'NEW_USERS' | 'EXPIRING_SOON';
export type BannerEventType = 'IMPRESSION' | 'CLICK' | 'DISMISS';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  locale: string;
  theme: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  account_number?: string | null;
  bank_name?: string | null;
  balance: number;
  currency: string;
  color?: string | null;
  icon?: string | null;
  is_active: boolean;
  is_included_in_net_worth: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
  parent_id?: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  description?: string | null;
  notes?: string | null;
  transaction_date: string;
  receipt_url?: string | null;
  is_recurring: boolean;
  recurring_transaction_id?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // joined relations
  account?: Account;
  category?: Category;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  fee: number;
  description?: string | null;
  transfer_date: string;
  created_at: string;
  updated_at: string;
  // joined relations
  from_account?: Account;
  to_account?: Account;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  alert_threshold: number;
  notify_on_exceed: boolean;
  created_at: string;
  updated_at: string;
  // joined relations & computed
  category?: Category;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface Loan {
  id: string;
  user_id: string;
  person_name: string;
  person_phone?: string | null;
  person_email?: string | null;
  type: LoanType;
  principal_amount: number;
  interest_rate: number;
  total_paid: number;
  due_date?: string | null;
  notes?: string | null;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  remaining_amount?: number;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  user_id: string;
  account_id?: string | null;
  amount: number;
  payment_date: string;
  notes?: string | null;
  created_at: string;
  account?: Account;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  frequency: FrequencyType;
  interval: number;
  start_date: string;
  end_date?: string | null;
  next_run_date: string;
  is_active: boolean;
  auto_create: boolean;
  created_at: string;
  updated_at: string;
  account?: Account;
  category?: Category;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  billing_cycle: BillingCycle;
  features: string[];
  limits: {
    max_accounts: number;
    max_budgets: number;
    export_reports: boolean;
    multi_currency: boolean;
    loans_enabled: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at?: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: Plan;
}

export interface PaymentSubmission {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  transaction_id: string;
  sender_number: string;
  status: PaymentStatus;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
  plan?: Plan;
}

export interface Banner {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  button_text?: string;
  type: BannerType;
  position: BannerPosition;
  target_audience: TargetAudience;
  priority: number;
  is_active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  max_impressions?: number | null;
  max_clicks?: number | null;
  background_color?: string | null;
  text_color?: string | null;
  badge_text?: string | null;
  created_by?: string | null;
  created_by_email?: string | null;
  created_by_name?: string | null;
  duration_days?: number;
  amount_paid?: number;
  payment_method?: string;
  transaction_id?: string;
  sender_number?: string;
  payment_status?: PaymentStatus;
  created_at: string;
  updated_at: string;
  // stats computed on admin views
  impression_count?: number;
  click_count?: number;
}

export interface BannerEvent {
  id: string;
  banner_id: string;
  user_id?: string | null;
  event_type: BannerEventType;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: UserProfile;
}

export type PaymentAccountType = 'PERSONAL' | 'MERCHANT' | 'AGENT';

export interface PaymentSettings {
  bkash_number: string;
  bkash_type: PaymentAccountType;
  is_bkash_active: boolean;
  nagad_number: string;
  nagad_type: PaymentAccountType;
  is_nagad_active: boolean;
  rocket_number: string;
  rocket_type: PaymentAccountType;
  is_rocket_active: boolean;
  instructions_en: string;
  instructions_bn: string;
  updated_at?: string;
}
