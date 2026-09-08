import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useUIStore } from '../stores/useUIStore';
import { localDb } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Plan } from '../types/database';
import {
  Check,
  Sparkles,
  Zap,
  User,
  RotateCcw,
  Languages,
  Smartphone,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const { plans, subscription, submitPayment } = useSubscriptions();
  const { theme, setTheme, locale, setLocale, currency, setCurrency } = useUIStore();

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPayment || !trxId.trim() || !senderNumber.trim()) return;

    submitPayment.mutate(
      {
        plan_id: selectedPlanForPayment.id,
        amount: selectedPlanForPayment.price,
        payment_method: 'BKASH',
        transaction_id: trxId.trim(),
        sender_number: senderNumber.trim(),
      },
      {
        onSuccess: () => {
          setSelectedPlanForPayment(null);
          setTrxId('');
          setSenderNumber('');
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{t('nav.settings')}</h2>
        <p className="text-xs text-slate-400">Account preferences and subscription</p>
      </div>

      {/* Profile Card */}
      <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{user?.full_name || 'Guest User'}</h4>
            <span className="text-xs text-slate-400 font-mono">{user?.email}</span>
          </div>
        </div>

        <Badge variant="default" className="text-[10px]">
          {subscription?.plan?.name || 'Free'}
        </Badge>
      </div>

      {/* Admin Quick Entry if Admin */}
      {isAdmin && (
        <Link
          to="/admin"
          className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between group hover:bg-amber-500/15 transition-all"
        >
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-amber-400 block">Admin Control Center</span>
              <span className="text-[10px] text-slate-400">Manage bKash approvals, users & banners</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Quick Navigation Links */}
      <div className="rounded-2xl bg-[#121826] border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
        <Link to="/transfers" className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
          <span className="text-xs font-semibold text-slate-200">{t('nav.transfers')}</span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </Link>
        <Link to="/categories" className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
          <span className="text-xs font-semibold text-slate-200">{t('nav.categories')}</span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </Link>
        <Link to="/recurring" className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
          <span className="text-xs font-semibold text-slate-200">{t('nav.recurring')}</span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </Link>
        <Link to="/reports" className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
          <span className="text-xs font-semibold text-slate-200">{t('nav.reports')}</span>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </Link>
      </div>

      {/* Upgrade Subscription Plans */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block px-1">
          {t('plans.title')}
        </span>

        <div className="space-y-2.5">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan_id === plan.id;
            const isPopular = plan.slug === 'pro-yearly';

            return (
              <div
                key={plan.id}
                className={`p-4 rounded-2xl bg-[#121826] border transition-all ${
                  isPopular
                    ? 'border-emerald-500/50 bg-gradient-to-r from-[#121826] to-emerald-950/20'
                    : isCurrent
                    ? 'border-indigo-500/40'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                      {isPopular && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-slate-950 uppercase">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-emerald-400 font-extrabold">
                      {plan.price === 0 ? 'Free' : formatCurrency(plan.price, currency, locale)}
                      {plan.price > 0 && <span className="text-[10px] text-slate-400 font-normal"> / {plan.billing_cycle.toLowerCase()}</span>}
                    </span>
                  </div>

                  {isCurrent ? (
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  ) : plan.price > 0 ? (
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={() => setSelectedPlanForPayment(plan)}
                      className="text-xs h-7 px-2.5"
                    >
                      <Zap className="h-3 w-3 fill-current mr-1" />
                      bKash
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800/60">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                      <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preferences Selectors */}
      <div className="p-4 rounded-2xl bg-[#121826] border border-slate-800 space-y-3">
        <div>
          <Label>Language / ভাষা</Label>
          <Select
            value={locale}
            onChange={(e) => {
              const val = e.target.value as 'en' | 'bn';
              setLocale(val);
              i18n.changeLanguage(val);
            }}
            className="h-9 text-xs"
          >
            <option value="en" className="bg-slate-900 text-white">English (US)</option>
            <option value="bn" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
          </Select>
        </div>

        <div>
          <Label>Currency</Label>
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-9 text-xs"
          >
            <option value="BDT" className="bg-slate-900 text-white">Bangladeshi Taka (৳ BDT)</option>
            <option value="USD" className="bg-slate-900 text-white">US Dollar ($ USD)</option>
          </Select>
        </div>
      </div>

      {/* Reset & Logout Buttons */}
      <div className="space-y-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm('Reset all demo data?')) localDb.resetDemoData();
          }}
          className="w-full text-xs text-rose-400 hover:text-rose-300 border-rose-500/20"
        >
          Reset Demo Database
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => logout.mutate()}
          className="w-full text-xs text-slate-300"
        >
          Log Out
        </Button>
      </div>

      {/* bKash Payment Modal */}
      {selectedPlanForPayment && (
        <Dialog open={!!selectedPlanForPayment} onOpenChange={(open) => !open && setSelectedPlanForPayment(null)}>
          <form onSubmit={handlePaymentSubmit}>
            <DialogHeader>
              <DialogTitle className="text-pink-400 flex items-center gap-1.5">
                <Smartphone className="h-5 w-5" />
                <span>bKash Payment</span>
              </DialogTitle>
              <DialogDescription>
                Upgrade to <strong>{selectedPlanForPayment.name}</strong> ({selectedPlanForPayment.price} ৳)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-1 text-slate-300">
                <p>Send <strong>{selectedPlanForPayment.price} BDT</strong> to:</p>
                <p className="font-mono font-bold text-white text-sm">01711234567</p>
              </div>

              <div>
                <Label>Sender Mobile Number</Label>
                <Input
                  type="text"
                  required
                  placeholder="01XXXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <Label>bKash Transaction ID (TrxID)</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. BKA883X109"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="h-10 text-xs font-mono uppercase font-bold"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedPlanForPayment(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white font-bold" disabled={submitPayment.isPending}>
                {submitPayment.isPending ? 'Submitting...' : 'Submit Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
