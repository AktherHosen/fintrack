import { createClient } from '@supabase/supabase-js';
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
  BannerEvent,
  AuditLog,
  PaymentSettings,
} from '../types/database';
import {
  INITIAL_USER,
  INITIAL_USERS,
  INITIAL_PLANS,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_LOANS,
  INITIAL_RECURRING,
  INITIAL_BANNERS,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PAYMENT_SETTINGS,
} from './mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'mock-key';

export const isLiveSupabase =
  Boolean(supabaseUrl) &&
  supabaseUrl.includes('.supabase.co') &&
  !supabaseUrl.includes('mock') &&
  supabaseKey !== 'mock-key' &&
  supabaseKey !== 'your-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// Local / Standalone Database Store Provider
// ==========================================
class LocalDbStore {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`fintrack_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`fintrack_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }

  // Active Auth User
  getUser(): UserProfile | null {
    return this.getItem<UserProfile | null>('user', null);
  }

  setUser(user: UserProfile | null) {
    this.setItem('user', user);
  }

  // All Registered Users (for Admin Management)
  getUsers(): UserProfile[] {
    const list = this.getItem<UserProfile[]>('users', []);
    const active = this.getUser();
    if (active && !list.some((u) => u.email.toLowerCase() === active.email.toLowerCase())) {
      const updated = [active, ...list];
      this.setUsers(updated);
      return updated;
    }
    return list;
  }

  setUsers(users: UserProfile[]) {
    this.setItem('users', users);
  }

  // Accounts
  getAccounts(): Account[] {
    return this.getItem<Account[]>('accounts', INITIAL_ACCOUNTS);
  }

  setAccounts(accounts: Account[]) {
    this.setItem('accounts', accounts);
  }

  // Categories
  getCategories(): Category[] {
    const raw = this.getItem<Category[]>('categories', INITIAL_CATEGORIES);
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const result: Category[] = [];

    for (const cat of raw) {
      if (!cat || !cat.id) continue;
      const key = `${cat.name?.trim().toLowerCase()}_${cat.type}`;
      if (!seenIds.has(cat.id) && !seenNames.has(key)) {
        seenIds.add(cat.id);
        seenNames.add(key);
        result.push(cat);
      }
    }
    return result;
  }

  setCategories(categories: Category[]) {
    this.setItem('categories', categories);
  }

  // Transactions
  getTransactions(): Transaction[] {
    return this.getItem<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
  }

  setTransactions(transactions: Transaction[]) {
    this.setItem('transactions', transactions);
  }

  // Transfers
  getTransfers(): Transfer[] {
    return this.getItem<Transfer[]>('transfers', []);
  }

  setTransfers(transfers: Transfer[]) {
    this.setItem('transfers', transfers);
  }

  // Budgets
  getBudgets(): Budget[] {
    return this.getItem<Budget[]>('budgets', INITIAL_BUDGETS);
  }

  setBudgets(budgets: Budget[]) {
    this.setItem('budgets', budgets);
  }

  // Loans
  getLoans(): Loan[] {
    return this.getItem<Loan[]>('loans', INITIAL_LOANS);
  }

  setLoans(loans: Loan[]) {
    this.setItem('loans', loans);
  }

  // Recurring
  getRecurring(): RecurringTransaction[] {
    return this.getItem<RecurringTransaction[]>('recurring', INITIAL_RECURRING);
  }

  setRecurring(recurring: RecurringTransaction[]) {
    this.setItem('recurring', recurring);
  }

  // Plans
  getPlans(): Plan[] {
    return this.getItem<Plan[]>('plans', INITIAL_PLANS);
  }

  setPlans(plans: Plan[]) {
    this.setItem('plans', plans);
  }

  // Subscriptions (Multi-user store)
  getSubscriptions(): Subscription[] {
    return this.getItem<Subscription[]>('subscriptions', []);
  }

  setSubscriptions(subs: Subscription[]) {
    this.setItem('subscriptions', subs);
  }

  getUserSubscription(userId: string): Subscription {
    const list = this.getSubscriptions();
    const existing = list.find((s) => s.user_id === userId && s.status === 'ACTIVE');
    if (existing) {
      const isExpired =
        Boolean(existing.expires_at &&
        new Date(existing.expires_at).getFullYear() < 2090 &&
        new Date(existing.expires_at).getTime() < Date.now());

      if (!isExpired) {
        return existing;
      }
      // If expired, update status to EXPIRED in database and revert to free
      existing.status = 'EXPIRED';
      this.setSubscriptions(list.map((s) => (s.id === existing.id ? existing : s)));
    }

    const plans = this.getPlans();
    const freePlan = plans.find((p) => p.slug === 'free') || INITIAL_PLANS[0];
    const defaultSub: Subscription = {
      id: 'sub-' + userId,
      user_id: userId,
      plan_id: freePlan?.id || 'plan-free',
      status: 'ACTIVE',
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3650 * 86400000).toISOString(),
      auto_renew: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      plan: freePlan,
    };
    return defaultSub;
  }

  getSubscription(): Subscription {
    const user = this.getUser();
    if (!user) {
      const freePlan = this.getPlans().find((p) => p.slug === 'free') || INITIAL_PLANS[0];
      return {
        id: 'sub-anon',
        user_id: '',
        plan_id: freePlan?.id || 'plan-free',
        status: 'ACTIVE',
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3650 * 86400000).toISOString(),
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan: freePlan,
      };
    }
    return this.getUserSubscription(user.id);
  }

  setSubscription(sub: Subscription) {
    this.setItem('subscription', sub);
    const list = this.getSubscriptions();
    const nextList = [sub, ...list.filter((s) => s.id !== sub.id && s.user_id !== sub.user_id)];
    this.setSubscriptions(nextList);
  }

  // Payments
  getPayments(): PaymentSubmission[] {
    return this.getItem<PaymentSubmission[]>('payments', INITIAL_PAYMENTS);
  }

  setPayments(payments: PaymentSubmission[]) {
    this.setItem('payments', payments);
  }

  // Banners
  getBanners(): Banner[] {
    return this.getItem<Banner[]>('banners', INITIAL_BANNERS);
  }

  setBanners(banners: Banner[]) {
    this.setItem('banners', banners);
  }

  // Payment Settings
  getPaymentSettings(): PaymentSettings {
    return this.getItem<PaymentSettings>('payment_settings', INITIAL_PAYMENT_SETTINGS);
  }

  setPaymentSettings(settings: PaymentSettings) {
    this.setItem('payment_settings', settings);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  }

  addAuditLog(
    action: string,
    entity_type: string,
    entity_id?: string,
    details: Record<string, any> = {}
  ) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      user_id: this.getUser()?.id,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    };
    this.setItem('audit_logs', [newLog, ...logs]);
  }

  resetDemoData() {
    localStorage.removeItem('fintrack_user');
    localStorage.removeItem('fintrack_users');
    localStorage.removeItem('fintrack_subscription');
    localStorage.removeItem('fintrack_subscriptions'); // plural list (was missing before)
    localStorage.removeItem('fintrack_accounts');
    localStorage.removeItem('fintrack_categories');
    localStorage.removeItem('fintrack_transactions');
    localStorage.removeItem('fintrack_budgets');
    localStorage.removeItem('fintrack_loans');
    localStorage.removeItem('fintrack_recurring');
    localStorage.removeItem('fintrack_plans');
    localStorage.removeItem('fintrack_banners');
    localStorage.removeItem('fintrack_payments');
    localStorage.removeItem('fintrack_payment_settings');
    localStorage.removeItem('fintrack_audit_logs');
    window.location.reload();
  }
}

export const localDb = new LocalDbStore();
