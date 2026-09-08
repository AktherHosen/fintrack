import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeftRight, Plus, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { localDb } from '../lib/supabase';

export function TransfersPage() {
  const { t } = useTranslation();
  const { accounts } = useAccounts();
  const { currency, locale, setAddTransferOpen } = useUIStore();
  const transfers = localDb.getTransfers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{t('nav.transfers')}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Move funds seamlessly across bank, mobile banking, and cash accounts</p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setAddTransferOpen(true)}
          className="gap-1.5 text-xs h-8"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span>{t('dashboard.new_transfer')}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Transfer History</CardTitle>
        </CardHeader>
        <CardContent>
          {transfers.length > 0 ? (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {transfers.map((tr) => {
                const fromAcc = accounts.find((a) => a.id === tr.from_account_id);
                const toAcc = accounts.find((a) => a.id === tr.to_account_id);

                return (
                  <div key={tr.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
                        <ArrowLeftRight className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{fromAcc?.name || 'Source Account'}</span>
                          <span className="text-xs text-indigo-500 font-bold">➔</span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{toAcc?.name || 'Destination Account'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3" />
                            {formatDate(tr.transfer_date)}
                          </span>
                          {tr.description && <span className="text-[11px]">• {tr.description}</span>}
                          {Number(tr.fee) > 0 && <span className="text-rose-500 text-[11px]">Fee: {formatCurrency(tr.fee, currency, locale)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(tr.amount, currency, locale)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              No inter-account transfers performed yet. Use the transfer button to rebalance your wallets.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
