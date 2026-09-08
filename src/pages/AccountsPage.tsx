import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '../hooks/useAccounts';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
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
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function AccountsPage() {
  const { t } = useTranslation();
  const { accounts, totalNetWorth, deleteAccount, updateAccount } = useAccounts();
  const { currency, locale, setAddAccountOpen, setAddTransferOpen } = useUIStore();

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('accounts.title')}</h2>
          <p className="text-xs sm:text-sm text-slate-400">{t('accounts.subtitle')}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddTransferOpen(true)}
            className="gap-1.5"
          >
            <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
            <span>Transfer</span>
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setAddAccountOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t('accounts.add_account')}</span>
          </Button>
        </div>
      </div>

      {/* Net Worth Highlight Card */}
      <Card className="p-6 border-emerald-500/30 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Aggregated Liquid & Bank Wealth
            </span>
            <h3 className="text-3xl font-black text-white mt-1">
              {formatCurrency(totalNetWorth, currency, locale)}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs py-1 px-3">
              {accounts.length} Active Accounts
            </Badge>
          </div>
        </div>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <Card
            key={acc.id}
            className="relative overflow-hidden group hover:border-slate-700 transition-all duration-300"
          >
            {/* Top color bar */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: acc.color || '#10b981' }}
            />

            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold shadow-lg"
                    style={{ backgroundColor: `${acc.color}20`, color: acc.color || '#10b981' }}
                  >
                    {acc.type === 'BANK' && <Building2 className="h-6 w-6" />}
                    {acc.type === 'MOBILE_BANKING' && <Smartphone className="h-6 w-6" />}
                    {acc.type === 'CASH' && <Wallet className="h-6 w-6" />}
                    {acc.type === 'CREDIT_CARD' && <CreditCard className="h-6 w-6" />}
                    {acc.type === 'INVESTMENT' && <TrendingUp className="h-6 w-6" />}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{acc.name}</h4>
                    <span className="text-xs text-slate-400">{acc.bank_name || acc.type}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Remove account ${acc.name}?`)) {
                      deleteAccount.mutate(acc.id);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Balance
                  </span>
                  <span className={`text-xl font-black ${Number(acc.balance) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(acc.balance, currency, locale)}
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  {acc.account_number || '•••• 0000'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
