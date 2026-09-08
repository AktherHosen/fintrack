import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useUIStore } from '../stores/useUIStore';
import { localDb } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/card';
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
  CreditCard,
  User,
  Shield,
  RotateCcw,
  Languages,
  DollarSign,
  Smartphone,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  const { plans, subscription, isPro, submitPayment } = useSubscriptions();
  const { theme, setTheme, locale, setLocale, currency, setCurrency } = useUIStore();

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const BKASH_MERCHANT_NUMBER = '01711-234567';

  const handleCopyBkash = () => {
    navigator.clipboard.writeText('01711234567');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">{t('nav.settings')}</h2>
        <p className="text-xs sm:text-sm text-slate-400">Manage your subscription, bKash payments, and account preferences</p>
      </div>

      {/* 1. Subscription Plans Section */}
      <div id="plans" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <span>{t('plans.title')}</span>
            </h3>
            <p className="text-xs text-slate-400">{t('plans.subtitle')}</p>
          </div>

          {subscription && (
            <Badge variant="default" className="text-xs py-1 px-3 w-fit">
              Active Plan: {subscription.plan?.name || 'Free Starter'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan_id === plan.id;
            const isPopular = plan.slug === 'pro-yearly';

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-900 shadow-xl shadow-emerald-500/10'
                    : isCurrent
                    ? 'border-indigo-500/40'
                    : 'border-slate-800'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                    Most Popular
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">{plan.description}</CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {plan.price === 0 ? 'Free' : formatCurrency(plan.price, currency, locale)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-slate-400">
                        / {plan.billing_cycle.toLowerCase()}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 flex-1">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-4 border-t border-slate-800/80">
                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button variant="outline" size="sm" className="w-full">
                      Included
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? 'gradient' : 'default'}
                      size="sm"
                      onClick={() => setSelectedPlanForPayment(plan)}
                      className="w-full font-bold gap-1.5"
                    >
                      <Zap className="h-4 w-4 fill-current" />
                      <span>Upgrade via bKash</span>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 2. Preferences & Localization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              <span>Personal Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div>
              <Label>Language / ভাষা</Label>
              <Select
                value={locale}
                onChange={(e) => {
                  const val = e.target.value as 'en' | 'bn';
                  setLocale(val);
                  i18n.changeLanguage(val);
                }}
              >
                <option value="en" className="bg-slate-900 text-white">English (US)</option>
                <option value="bn" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
              </Select>
            </div>

            <div>
              <Label>Currency Unit</Label>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="BDT" className="bg-slate-900 text-white">Bangladeshi Taka (৳ BDT)</option>
                <option value="USD" className="bg-slate-900 text-white">US Dollar ($ USD)</option>
              </Select>
            </div>

            <div>
              <Label>Interface Theme</Label>
              <Select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
              >
                <option value="dark" className="bg-slate-900 text-white">Sleek Dark Mode (Default)</option>
                <option value="light" className="bg-slate-900 text-white">Clean Light Mode</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Demo Data Reset Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-400" />
                <span>Reset Demo Database</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Clears all local storage transactions, accounts, and budgets back to initial demo seeds.
              </CardDescription>
            </CardHeader>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Reset all demo data back to default state?')) {
                localDb.resetDemoData();
              }
            }}
            className="w-full text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
          >
            Reset All Sample Records
          </Button>
        </Card>
      </div>

      {/* bKash Payment Modal (Phase 7) */}
      {selectedPlanForPayment && (
        <Dialog open={!!selectedPlanForPayment} onOpenChange={(open) => !open && setSelectedPlanForPayment(null)}>
          <form onSubmit={handlePaymentSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-pink-500">
                <Smartphone className="h-6 w-6" />
                <span>{t('plans.bkash_payment_title')}</span>
              </DialogTitle>
              <DialogDescription>
                Upgrading to <strong>{selectedPlanForPayment.name}</strong> ({formatCurrency(selectedPlanForPayment.price, currency, locale)}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Payment Step instructions */}
              <div className="p-4 rounded-xl bg-pink-950/30 border border-pink-500/30 text-xs text-slate-200 space-y-2">
                <p className="font-bold text-pink-400">How to complete your bKash payment:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Open your bKash App and select <strong>Send Money</strong> or <strong>Payment</strong>.</li>
                  <li>
                    Enter FinTrack Official Number:{' '}
                    <span className="font-mono font-bold text-white bg-black/40 px-1.5 py-0.5 rounded">
                      01711234567
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBkash}
                      className="ml-2 text-pink-400 hover:underline font-bold"
                    >
                      {copiedNumber ? 'Copied!' : 'Copy'}
                    </button>
                  </li>
                  <li>Enter exact amount: <strong>{selectedPlanForPayment.price} BDT</strong>.</li>
                  <li>Copy the 10-character <strong>Transaction ID (TrxID)</strong> and enter below.</li>
                </ol>
              </div>

              <div>
                <Label>Your bKash Sender Mobile Number</Label>
                <Input
                  type="text"
                  required
                  placeholder="01XXXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
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
                  className="font-mono uppercase font-bold"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPlanForPayment(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold"
                disabled={submitPayment.isPending}
              >
                {submitPayment.isPending ? 'Submitting...' : t('plans.submit_trxid')}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
