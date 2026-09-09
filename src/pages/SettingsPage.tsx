import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useUIStore } from '../stores/useUIStore';
import { toast } from '../components/ui/sonner';
import { localDb } from '../lib/supabase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { Plan } from '../types/database';
import {
  Check,
  Crown,
  Zap,
  User,
  RotateCcw,
  Languages,
  Smartphone,
  ShieldAlert,
  Megaphone,
  Plus,
  Copy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { usePaymentSettings } from '../hooks/usePaymentSettings';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const { plans, subscription, submitPayment } = useSubscriptions();
  const { settings: paymentSettings } = usePaymentSettings();
  const { theme, setTheme, locale, setLocale, currency, setCurrency, addToast } = useUIStore();

  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const getRecipientNumber = () => {
    return selectedMethod === 'BKASH'
      ? paymentSettings.bkash_number
      : selectedMethod === 'NAGAD'
        ? paymentSettings.nagad_number
        : paymentSettings.rocket_number;
  };

  const handleCopyRecipientNumber = () => {
    const num = getRecipientNumber();
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    addToast({
      type: 'success',
      title: 'Number Copied',
      description: `${selectedMethod} wallet number (${num}) copied to clipboard.`,
    });
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPayment || !trxId.trim() || !senderNumber.trim()) return;

    submitPayment.mutate(
      {
        plan_id: selectedPlanForPayment.id,
        amount: selectedPlanForPayment.price,
        payment_method: selectedMethod,
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
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
          {t('nav.settings')}
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          Manage account preferences, subscription tiers, and system controls
        </p>
      </div>

      {/* Profile & Active Plan Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                {user?.full_name || 'Guest User'}
              </CardTitle>
              <CardDescription className="text-xs font-mono">{user?.email}</CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-xs border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            {subscription?.plan?.name || 'Free Starter'}
          </Badge>
        </CardHeader>
      </Card>

      {/* Sponsored Promotions Card for Users */}
      <Card className="border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                  Sponsored Banner Promotions
                </h4>
                <Badge variant="indigo" className="text-[9px] sm:text-[10px] py-0 h-4 shrink-0">
                  Feature
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate sm:whitespace-normal mt-0.5">
                Advertise your business, products, or deals on every FinTrack user's dashboard
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => useUIStore.getState().setCreateBannerOpen(true)}
            className="text-xs h-8 px-3 gap-1.5 shrink-0 font-semibold shadow-xs w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Promo Banner</span>
          </Button>
        </div>
      </Card>

      {/* Subscription Pricing Grid */}
      <div id="plans" className="space-y-3 pt-2">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span>Subscription Plans</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Upgrade to unlock unlimited wallets, automated recurring bills, and analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan_id === plan.id;
            const isPopular = plan.slug === 'pro-yearly';

            return (
              <Card
                key={plan.id}
                className={`flex flex-col justify-between ${isPopular
                  ? 'border-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-950/10 shadow-sm'
                  : ''
                  }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
                    {isPopular && (
                      <Badge
                        variant="default"
                        className="text-[10px] py-0 h-4 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/30"
                      >
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-[11px] line-clamp-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {plan.price === 0 ? 'Free' : formatCurrency(plan.price, currency, locale)}
                    {plan.price > 0 && (
                      <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {' '}
                        / {plan.billing_cycle.toLowerCase()}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-1.5 flex-1 pt-0">
                  {plan.features.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300"
                    >
                      <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{f}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  {isCurrent ? (
                    <Button variant="outline" size="sm" disabled className="w-full text-xs h-8">
                      Active Plan
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button variant="outline" size="sm" disabled className="w-full text-xs h-8">
                      Included
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setSelectedPlanForPayment(plan)}
                      className="w-full text-xs h-8"
                    >
                      <Zap className="h-3.5 w-3.5 mr-1" />
                      Upgrade
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Preferences</CardTitle>
            <CardDescription className="text-xs">
              Theme, language, and currency configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Appearance / Theme</Label>
              <Select
                value={theme}
                onValueChange={(val) => setTheme(val as 'dark' | 'light')}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark Mode (Default)</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Language / ভাষা</Label>
              <Select
                value={locale}
                onValueChange={(val) => {
                  const v = val as 'en' | 'bn';
                  setLocale(v);
                  i18n.changeLanguage(v);
                }}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Currency Unit</Label>
              <Select
                value={currency}
                onValueChange={(val) => setCurrency(val)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">Bangladeshi Taka (৳ BDT)</SelectItem>
                  <SelectItem value="USD">US Dollar ($ USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Database Reset & Logout */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Data & Session</CardTitle>
            <CardDescription className="text-xs">
              Reset local demo storage or sign out
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetConfirmOpen(true)}
              className="w-full text-xs h-8 text-rose-400 hover:text-rose-300 border-rose-500/20 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset Demo Records
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => logout.mutate()}
              className="w-full text-xs h-8"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* App Branding & Version Info */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xs text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="FinTrack Logo" className="h-8 w-8 rounded-lg shrink-0 shadow-xs" />
          <div>
            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>FinTrack</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Personal Finance, Budgeting & Wealth Management
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px]">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-600 dark:text-zinc-300">PWA Ready</span>
        </div>
      </div>

      {/* Payment Verification Dialog */}
      {selectedPlanForPayment && (
        <Dialog
          open={!!selectedPlanForPayment}
          onOpenChange={(open) => !open && setSelectedPlanForPayment(null)}
        >
          <form onSubmit={handlePaymentSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Smartphone className="h-5 w-5" />
                <span>Subscription Payment & Upgrade</span>
              </DialogTitle>
              <DialogDescription>
                Upgrade to <strong>{selectedPlanForPayment.name}</strong> (
                {selectedPlanForPayment.price} ৳ /{' '}
                {selectedPlanForPayment.billing_cycle.toLowerCase()})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              {/* Channel Selector */}
              <div>
                <Label className="text-xs mb-1.5 block">Select Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentSettings.is_bkash_active && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('BKASH')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${selectedMethod === 'BKASH'
                        ? 'border-pink-500 bg-pink-500/15 text-pink-600 dark:text-pink-400 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                    >
                      <span>bKash</span>
                      <span className="text-[9px] uppercase font-normal opacity-80">
                        {paymentSettings.bkash_type}
                      </span>
                    </button>
                  )}

                  {paymentSettings.is_nagad_active && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('NAGAD')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${selectedMethod === 'NAGAD'
                        ? 'border-orange-500 bg-orange-500/15 text-orange-600 dark:text-orange-400 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                    >
                      <span>Nagad</span>
                      <span className="text-[9px] uppercase font-normal opacity-80">
                        {paymentSettings.nagad_type}
                      </span>
                    </button>
                  )}

                  {paymentSettings.is_rocket_active && (
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('ROCKET')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${selectedMethod === 'ROCKET'
                        ? 'border-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                    >
                      <span>Rocket</span>
                      <span className="text-[9px] uppercase font-normal opacity-80">
                        {paymentSettings.rocket_type}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Wallet Info Box */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Send <strong>{selectedPlanForPayment.price} BDT</strong> to ({selectedMethod}):
                  </span>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                    <span className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {getRecipientNumber()}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyRecipientNumber}
                      className="p-1 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Copy phone number"
                      aria-label="Copy phone number"
                    >
                      {copiedNumber ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Instructions Text */}
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed pt-1.5 border-t border-zinc-200/80 dark:border-zinc-800">
                  {locale === 'bn' && paymentSettings.instructions_bn
                    ? paymentSettings.instructions_bn
                    : paymentSettings.instructions_en}
                </p>
              </div>

              <div>
                <Label>Your Sender Mobile Number</Label>
                <Input
                  type="text"
                  required
                  placeholder="01XXXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="font-mono mt-1"
                />
              </div>

              <div>
                <Label>Transaction ID (TrxID)</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. BKA883X109"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="font-mono uppercase font-bold mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPlanForPayment(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="font-semibold shadow-xs"
                disabled={submitPayment.isPending}
              >
                {submitPayment.isPending ? 'Submitting...' : 'Submit Payment TrxID'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}

      {/* Reset Demo Records Confirmation Dialog */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset Demo Records"
        description="Are you sure you want to reset all records to the original demo dataset? All custom transactions, accounts, and budgets created in this session will be restored."
        confirmLabel="Reset Everything"
        variant="danger"
        onConfirm={() => {
          localDb.resetDemoData();
          window.location.reload();
        }}
      />
    </div>
  );
}
