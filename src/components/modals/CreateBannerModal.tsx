import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useBanners } from '../../hooks/useBanners';
import { useUIStore } from '../../stores/useUIStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import {
  Megaphone,
  Sparkles,
  Smartphone,
  Clock,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const DURATION_PACKAGES = [
  { days: 3, price: 500, label: '3 Days Starter', description: 'Quick promo blast across all user dashboards' },
  { days: 7, price: 1000, label: '7 Days Popular', description: 'Best value for product launches and campaigns', popular: true },
  { days: 15, price: 2000, label: '15 Days Growth', description: 'Sustained visibility with priority placement' },
  { days: 30, price: 3500, label: '30 Days Sponsor', description: 'Maximum brand reach and continuous exposure' },
];

const GRADIENT_PRESETS = [
  { id: 'indigo', name: 'Indigo Deep', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' },
  { id: 'purple', name: 'Midnight Purple', value: 'linear-gradient(135deg, #3b0764 0%, #581c87 50%, #7e22ce 100%)' },
  { id: 'emerald', name: 'Electric Emerald', value: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)' },
  { id: 'crimson', name: 'Sunset Crimson', value: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)' },
  { id: 'amber', name: 'Dark Amber', value: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)' },
];

export function CreateBannerModal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createBanner } = useBanners();
  const { isCreateBannerOpen, setCreateBannerOpen, addToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Claim Offer');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [badgeText, setBadgeText] = useState('Sponsored');
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].value);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD'>('BKASH');

  const selectedPkg = DURATION_PACKAGES.find((p) => p.days === selectedDuration) || DURATION_PACKAGES[1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trxId.trim() || !senderNumber.trim()) {
      addToast({ type: 'error', title: 'Missing Info', description: 'Please fill in all campaign and payment fields.' });
      return;
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + selectedPkg.days * 24 * 60 * 60 * 1000);

    createBanner.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        button_text: buttonText.trim() || 'Learn More',
        link_url: linkUrl.trim() || null,
        type: 'PROMOTIONAL',
        position: 'DASHBOARD',
        target_audience: 'ALL',
        priority: selectedPkg.days >= 15 ? 10 : 8,
        is_active: true,
        starts_at: now.toISOString(),
        expires_at: expiryDate.toISOString(),
        background_color: selectedGradient,
        text_color: '#ffffff',
        badge_text: badgeText.trim() || 'Sponsored',
        created_by: user?.id || 'usr-promo',
        created_by_name: user?.full_name || 'Advertiser',
        created_by_email: user?.email || 'advertiser@example.com',
        duration_days: selectedPkg.days,
        amount_paid: selectedPkg.price,
        payment_method: paymentMethod,
        transaction_id: trxId.trim().toUpperCase(),
        sender_number: senderNumber.trim(),
        payment_status: 'APPROVED',
      },
      {
        onSuccess: () => {
          setCreateBannerOpen(false);
          setTitle('');
          setDescription('');
          setTrxId('');
          setSenderNumber('');
          addToast({
            type: 'success',
            title: 'Promotion Launched!',
            description: `Your banner is now active across all user dashboards for ${selectedPkg.days} days.`,
          });
        },
      }
    );
  };

  return (
    <Dialog open={isCreateBannerOpen} onOpenChange={setCreateBannerOpen}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <Megaphone className="h-5 w-5" />
            <span>Create Sponsored Dashboard Banner</span>
          </DialogTitle>
          <DialogDescription>
            Promote your product, store, or service directly on the dashboard of every FinTrack user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
          {/* 1. Duration & Pricing Packages */}
          <div>
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 block">
              1. Choose Duration Package
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATION_PACKAGES.map((pkg) => {
                const isSelected = selectedDuration === pkg.days;
                return (
                  <button
                    type="button"
                    key={pkg.days}
                    onClick={() => setSelectedDuration(pkg.days)}
                    className={`p-2.5 rounded-lg border text-left transition-all relative ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-500/10 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-600 text-white shadow-xs">
                        Popular
                      </span>
                    )}
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{pkg.days} Days</div>
                    <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      ৳ {pkg.price}
                    </div>
                    <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{pkg.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Banner Content Form */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              2. Banner Creative Details
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-zinc-500">Banner Headline / Title</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. ⚡ 50% Off at TechShop BD"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] text-zinc-500">Badge Label</Label>
                <Input
                  type="text"
                  placeholder="e.g. Sponsored, Flash Deal"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-zinc-500">Description / Subtitle</Label>
              <Input
                type="text"
                placeholder="e.g. Premium mechanical keyboards starting at ৳ 2,499. Code: FINTRACK50"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-zinc-500">Button CTA Text</Label>
                <Input
                  type="text"
                  placeholder="e.g. Shop Now, Visit Site"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] text-zinc-500">Target Website URL</Label>
                <Input
                  type="url"
                  required
                  placeholder="https://yourwebsite.com/deal"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-zinc-500">Color Gradient Theme</Label>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => setSelectedGradient(preset.value)}
                    className={`h-7 px-2.5 rounded-md text-xs text-white font-medium flex items-center gap-1.5 transition-all ${
                      selectedGradient === preset.value ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-950 scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ background: preset.value }}
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Live Preview Card */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>Live Dashboard Preview:</span>
              <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-normal flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Visible to all users
              </span>
            </div>

            <div
              className="rounded-xl p-4 border border-zinc-700/60 text-white shadow-md relative overflow-hidden"
              style={{ background: selectedGradient }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-white border border-white/20 font-bold uppercase tracking-wider">
                      {badgeText || 'Sponsored'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {selectedPkg.days} Days Active
                    </span>
                  </div>
                  <h4 className="text-sm font-bold tracking-tight text-white truncate">
                    {title || 'Your Eye-Catching Headline Here'}
                  </h4>
                  <p className="text-xs text-white/80 font-normal line-clamp-2">
                    {description || 'Your promotional campaign description will appear here on every user dashboard.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-zinc-950 shadow-sm">
                    {buttonText || 'Claim Offer'}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Payment Verification Section */}
          <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Pay via bKash / Nagad</span>
              </div>
              <Badge variant="indigo" className="text-[11px] font-bold">
                Total: ৳ {selectedPkg.price} BDT
              </Badge>
            </div>

            <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1 bg-white dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <p>Send <strong>৳ {selectedPkg.price} BDT</strong> Send Money / Merchant to:</p>
              <div className="flex items-center justify-between font-mono font-bold text-sm text-pink-600 dark:text-pink-400">
                <span>01711234567</span>
                <span className="text-[11px] text-zinc-500 font-sans font-normal">(bKash / Nagad Personal)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-zinc-700 dark:text-zinc-300">Your Sender Mobile Number</Label>
                <Input
                  type="text"
                  required
                  placeholder="01XXXXXXXXX"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px] text-zinc-700 dark:text-zinc-300">Transaction ID (TrxID)</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. BKA9823X81"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="mt-1 font-mono uppercase font-bold text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setCreateBannerOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={createBanner.isPending}
            className="font-semibold shadow-xs"
          >
            {createBanner.isPending ? 'Publishing...' : `Pay ৳${selectedPkg.price} & Launch Banner`}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
