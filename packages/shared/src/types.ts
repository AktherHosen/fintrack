export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  currency: string;
  timezone: string;
  locale: string;
  emailVerifiedAt: string | null;
}

export interface AccountDto {
  id: string;
  name: string;
  type: string;
  currency: string;
  openingBalance: string;
  balance: string;
  isActive: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  isDefault: boolean;
  isActive: boolean;
}

export interface TransactionDto {
  id: string;
  accountId: string;
  categoryId: string;
  type: string;
  amount: string;
  currency: string;
  description: string | null;
  transactionDate: string;
  reference: string | null;
  account?: { id: string; name: string };
  category?: { id: string; name: string; type: string };
}

export interface TransferDto {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  currency: string;
  transferDate: string;
  note: string | null;
  fromAccount?: { id: string; name: string };
  toAccount?: { id: string; name: string };
}

export interface DashboardDto {
  totalBalance: string;
  income: string;
  expenses: string;
  netCashFlow: string;
  changePercent: number;
  recentTransactions: TransactionDto[];
  cashFlowSeries: { date: string; income: string; expense: string }[];
  accountBalances: { id: string; name: string; balance: string }[];
  budgetProgress: BudgetProgressDto[];
}

export interface BudgetProgressDto {
  id: string;
  name: string;
  categoryName: string;
  amount: string;
  spent: string;
  remaining: string;
  percent: number;
  status: string;
}

export interface BudgetDto {
  id: string;
  categoryId: string;
  name: string;
  amount: string;
  period: string;
  startDate: string;
  endDate: string;
  spent: string;
  remaining: string;
  percent: number;
  status: string;
  category?: { id: string; name: string };
}

export interface PlanDto {
  id: string;
  name: string;
  slug: string;
  price: string;
  currency: string;
  billingInterval: string;
  features: Record<string, unknown>;
}

export interface SubscriptionDto {
  id: string;
  status: string;
  startsAt: string;
  expiresAt: string;
  plan: PlanDto;
  usage?: {
    transactions: number;
    accounts: number;
    categories: number;
    budgets: number;
    loans: number;
  };
  limits?: {
    transactions: number | null;
    accounts: number | null;
    categories: number | null;
    budgets: number | null;
    loans: number | null;
  };
}

export interface PaymentDto {
  id: string;
  amount: string;
  currency: string;
  transactionId: string | null;
  senderNumber: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  plan?: { name: string; slug: string };
}

export interface AdminDashboardDto {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingPayments: number;
  activeSubscriptions: number;
  monthlyRevenue: string;
}

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  plan: string | null;
  joinedAt: string;
  subscriptionExpiry: string | null;
}

export interface LoanDto {
  id: string;
  name: string;
  type: string;
  status: string;
  principal: string;
  interestRate: string;
  currency: string;
  accountId: string | null;
  counterparty: string | null;
  startDate: string;
  termMonths: number | null;
  monthlyPayment: string | null;
  notes: string | null;
  totalPaid: string;
  remainingBalance: string;
  percentPaid: number;
  account?: { id: string; name: string } | null;
}

export interface LoanPaymentDto {
  id: string;
  loanId: string;
  amount: string;
  principalAmount: string;
  interestAmount: string;
  paymentDate: string;
  note: string | null;
  transactionId: string | null;
}

export interface LoanDetailDto extends LoanDto {
  payments: LoanPaymentDto[];
}

export interface HealthDto {
  status: "ok";
}
