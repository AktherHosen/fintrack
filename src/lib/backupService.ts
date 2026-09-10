import { localDb } from './supabase';

export interface BackupData {
  version: string;
  timestamp: string;
  user: ReturnType<typeof localDb.getUser> | null;
  accounts: ReturnType<typeof localDb.getAccounts>;
  categories: ReturnType<typeof localDb.getCategories>;
  transactions: ReturnType<typeof localDb.getTransactions>;
  transfers: ReturnType<typeof localDb.getTransfers>;
  budgets: ReturnType<typeof localDb.getBudgets>;
  loans: ReturnType<typeof localDb.getLoans>;
  loanPayments: ReturnType<typeof localDb.getLoanPayments>;
  recurring: ReturnType<typeof localDb.getRecurringTransactions>;
  subscriptions: ReturnType<typeof localDb.getSubscriptions>;
  payments: ReturnType<typeof localDb.getPayments>;
  banners: ReturnType<typeof localDb.getBanners>;
  paymentSettings: ReturnType<typeof localDb.getPaymentSettings>;
  bannerPackages: ReturnType<typeof localDb.getBannerPackages>;
}

export function exportUserData(): BackupData {
  return {
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    user: localDb.getUser(),
    accounts: localDb.getAccounts(),
    categories: localDb.getCategories(),
    transactions: localDb.getTransactions(),
    transfers: localDb.getTransfers(),
    budgets: localDb.getBudgets(),
    loans: localDb.getLoans(),
    loanPayments: localDb.getLoanPayments(),
    recurring: localDb.getRecurringTransactions(),
    subscriptions: localDb.getSubscriptions(),
    payments: localDb.getPayments(),
    banners: localDb.getBanners(),
    paymentSettings: localDb.getPaymentSettings(),
    bannerPackages: localDb.getBannerPackages(),
  };
}

export function downloadBackupJson(data: BackupData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
