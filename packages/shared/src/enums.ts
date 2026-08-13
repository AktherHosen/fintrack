export const UserRole = {
  USER: "USER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AccountType = {
  CASH: "CASH",
  BANK: "BANK",
  MOBILE_WALLET: "MOBILE_WALLET",
  SAVINGS: "SAVINGS",
  CREDIT_CARD: "CREDIT_CARD",
  OTHER: "OTHER",
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const CategoryType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];

export const BudgetPeriod = {
  MONTHLY: "MONTHLY",
  WEEKLY: "WEEKLY",
  YEARLY: "YEARLY",
  CUSTOM: "CUSTOM",
} as const;
export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod];

export const BudgetStatus = {
  UNDER_BUDGET: "UNDER_BUDGET",
  NEAR_LIMIT: "NEAR_LIMIT",
  OVER_BUDGET: "OVER_BUDGET",
} as const;
export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus];

export const RecurringFrequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type RecurringFrequency = (typeof RecurringFrequency)[keyof typeof RecurringFrequency];

export const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  CANCELED: "CANCELED",
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PaymentProvider = {
  BKASH: "BKASH",
} as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentMethod = {
  MANUAL_SEND_MONEY: "MANUAL_SEND_MONEY",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  REJECTED: "REJECTED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const BillingInterval = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type BillingInterval = (typeof BillingInterval)[keyof typeof BillingInterval];

export const LoanType = {
  BORROWED: "BORROWED",
  LENT: "LENT",
} as const;
export type LoanType = (typeof LoanType)[keyof typeof LoanType];

export const LoanStatus = {
  ACTIVE: "ACTIVE",
  PAID_OFF: "PAID_OFF",
  CLOSED: "CLOSED",
} as const;
export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

export const FeatureKey = {
  TRANSACTIONS_LIMIT: "transactions_limit",
  ACCOUNTS_LIMIT: "accounts_limit",
  CATEGORIES_LIMIT: "categories_limit",
  BUDGETS_LIMIT: "budgets_limit",
  ADVANCED_REPORTS: "advanced_reports",
  RECURRING_TRANSACTIONS: "recurring_transactions",
  CSV_EXPORT: "csv_export",
  PDF_EXPORT: "pdf_export",
  MULTIPLE_CURRENCIES: "multiple_currencies",
  RECEIPT_STORAGE: "receipt_storage",
  LOANS_LIMIT: "loans_limit",
} as const;
export type FeatureKey = (typeof FeatureKey)[keyof typeof FeatureKey];

export interface PlanFeatures {
  [FeatureKey.TRANSACTIONS_LIMIT]?: number | null;
  [FeatureKey.ACCOUNTS_LIMIT]?: number | null;
  [FeatureKey.CATEGORIES_LIMIT]?: number | null;
  [FeatureKey.BUDGETS_LIMIT]?: number | null;
  [FeatureKey.ADVANCED_REPORTS]?: boolean;
  [FeatureKey.RECURRING_TRANSACTIONS]?: boolean;
  [FeatureKey.CSV_EXPORT]?: boolean;
  [FeatureKey.PDF_EXPORT]?: boolean;
  [FeatureKey.MULTIPLE_CURRENCIES]?: boolean;
  [FeatureKey.RECEIPT_STORAGE]?: boolean;
  [FeatureKey.LOANS_LIMIT]?: number | null;
}
