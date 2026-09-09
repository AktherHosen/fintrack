import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '../hooks/useAccounts';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  TrendingUp,
  Plus,
  ArrowLeftRight,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function AccountsPage() {
  const { t } = useTranslation();
  const { accounts, totalNetWorth, deleteAccount } = useAccounts();
  const { currency, locale, setAddAccountOpen, setAddTransferOpen } = useUIStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {t('accounts.title')}
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total liquid balance: {formatCurrency(totalNetWorth, currency, locale)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddTransferOpen(true)}
            className="text-xs h-8"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5 text-indigo-500 dark:text-indigo-400" />
            <span>Transfer</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setAddAccountOpen(true)}
            className="text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <span>{t('accounts.add_account')}</span>
          </Button>
        </div>
      </div>

      {/* Grid of ShadCN Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <Card
            key={acc.id}
            className="group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex items-center space-x-2.5">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${acc.color}15`, color: acc.color || '#10b981' }}
                >
                  {acc.type === 'BANK' && <Building2 className="h-4 w-4" />}
                  {acc.type === 'MOBILE_BANKING' && <Smartphone className="h-4 w-4" />}
                  {acc.type === 'CASH' && <Wallet className="h-4 w-4" />}
                  {acc.type === 'CREDIT_CARD' && <CreditCard className="h-4 w-4" />}
                  {acc.type === 'INVESTMENT' && <TrendingUp className="h-4 w-4" />}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">{acc.name}</CardTitle>
                  <CardDescription className="text-[10px] font-mono">
                    {acc.account_number || acc.type}
                  </CardDescription>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Remove account ${acc.name}?`)) deleteAccount.mutate(acc.id);
                }}
                className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </CardHeader>

            <CardContent className="pt-2">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">
                Balance
              </span>
              <div
                className={`text-xl font-bold tracking-tight mt-0.5 ${Number(acc.balance) < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-50'}`}
              >
                {formatCurrency(acc.balance, currency, locale)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
