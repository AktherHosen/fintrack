import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useUIStore } from '../stores/useUIStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, Printer, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function ReportsPage() {
  const { t } = useTranslation();
  const { transactions, monthlyIncome, monthlyExpense, savingsRate } = useTransactions();
  const { totalNetWorth } = useAccounts();
  const { currency, locale } = useUIStore();

  const reportData = [
    { month: 'Apr', Income: 95000, Expense: 62000, Savings: 33000 },
    { month: 'May', Income: 105000, Expense: 71000, Savings: 34000 },
    { month: 'Jun', Income: 115000, Expense: 68000, Savings: 47000 },
    { month: 'Jul', Income: 120000, Expense: 75000, Savings: 45000 },
    { month: 'Aug', Income: 125000, Expense: 69000, Savings: 56000 },
    { month: 'Sep', Income: monthlyIncome || 125000, Expense: monthlyExpense || 47450, Savings: (monthlyIncome || 125000) - (monthlyExpense || 47450) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('reports.title')}</h2>
          <p className="text-xs sm:text-sm text-slate-400">{t('reports.subtitle')}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/20">
          <span className="text-xs uppercase font-bold text-slate-400">Total Net Worth</span>
          <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(totalNetWorth, currency, locale)}</h3>
        </Card>
        <Card className="p-5 border-teal-500/20 bg-gradient-to-br from-slate-900 to-teal-950/20">
          <span className="text-xs uppercase font-bold text-slate-400">Monthly Surplus (Savings)</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(monthlyIncome - monthlyExpense, currency, locale)}</h3>
        </Card>
        <Card className="p-5 border-indigo-500/20 bg-gradient-to-br from-slate-900 to-indigo-950/20">
          <span className="text-xs uppercase font-bold text-slate-400">Savings Efficiency</span>
          <h3 className="text-2xl font-black text-indigo-300 mt-1">{savingsRate}%</h3>
        </Card>
      </div>

      {/* Monthly Bar Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('reports.monthly_comparison')}</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                formatter={(val: any) => [`${val} ৳`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Savings" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
