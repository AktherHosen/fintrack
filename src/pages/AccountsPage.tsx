import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccounts } from '../hooks/useAccounts';
import { useUIStore } from '../stores/useUIStore';
import { Button } from '../components/ui/button';
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
    <div className="space-y-4">
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{t('accounts.title')}</h2>
          <p className="text-xs text-slate-400">Total: {formatCurrency(totalNetWorth, currency, locale)}</p>
        </div>

        <div className="flex items-center space-x-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddTransferOpen(true)}
            className="text-xs h-8 px-2.5"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 mr-1 text-indigo-400" />
            <span>Transfer</span>
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => setAddAccountOpen(true)}
            className="text-xs h-8 px-2.5"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add</span>
          </Button>
        </div>
      </div>

      {/* Account Tiles */}
      <div className="space-y-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="p-3.5 rounded-2xl bg-[#121826] border border-slate-800 flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center font-bold"
                style={{ backgroundColor: `${acc.color}20`, color: acc.color || '#10b981' }}
              >
                {acc.type === 'MOBILE_BANKING' && <Smartphone className="h-5 w-5" />}
                {acc.type === 'BANK' && <Building2 className="h-5 w-5" />}
                {acc.type === 'CASH' && <Wallet className="h-5 w-5" />}
                {acc.type === 'CREDIT_CARD' && <CreditCard className="h-5 w-5" />}
                {acc.type === 'INVESTMENT' && <TrendingUp className="h-5 w-5" />}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">{acc.name}</h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  {acc.account_number || acc.type}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right">
                <span
                  className={`text-sm font-extrabold ${
                    Number(acc.balance) < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(acc.balance, currency, locale)}
                </span>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Remove account ${acc.name}?`)) deleteAccount.mutate(acc.id);
                }}
                className="p-1 text-slate-500 hover:text-rose-400 opacity-60 hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
