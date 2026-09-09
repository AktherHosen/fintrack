import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBanners } from '../../hooks/useBanners';
import { usePaymentSettings } from '../../hooks/usePaymentSettings';
import { useUIStore } from '../../stores/useUIStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Megaphone, ArrowUpRight, Smartphone, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const DURATION_PACKAGES = [
  { days: 3, price: 500, label: '3 Days — ৳500' },
  { days: 7, price: 1000, label: '7 Days — ৳1,000 (Popular)' },
  { days: 15, price: 2000, label: '15 Days — ৳2,000' },
  { days: 30, price: 3500, label: '30 Days — ৳3,500' },
];

const GRADIENT_PRESETS = [
  { id: 'indigo', name: 'Indigo', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' },
  { id: 'emerald', name: 'Emerald', value: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)' },
  { id: 'purple', name: 'Purple', value: 'linear-gradient(135deg, #3b0764 0%, #581c87 50%, #7e22ce 100%)' },
  { id: 'crimson', name: 'Crimson', value: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)' },
  { id: 'slate', name: 'Slate', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
];

export function CreateBannerModal() {
  const { user } = useAuth();
  const { createBanner } = useBanners();
  const { settings: paymentSettings } = usePaymentSettings();
  const { isCreateBannerOpen, setCreateBannerOpen, addToast } = useUIStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Claim Offer');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [selectedDuration, setSelectedDuration] = useState('7');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].value);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [copied, setCopied] = useState(false);

  const selectedPkg =
    DURATION_PACKAGES.find((p) => p.days === parseInt(selectedDuration)) || DURATION_PACKAGES[1];

  const recipientNumber =
    paymentMethod === 'BKASH'
      ? paymentSettings.bkash_number
      : paymentMethod === 'NAGAD'
        ? paymentSettings.nagad_number
        : paymentSettings.rocket_number;

  const handleCopyNumber = () => {
    if (recipientNumber) {
      navigator.clipboard.writeText(recipientNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({
        type: 'info',
        title: 'Number Copied',
        description: `${recipientNumber} copied to clipboard`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trxId.trim() || !senderNumber.trim()) {
      addToast({
        type: 'error',
        title: 'Required fields missing',
        description: 'Please provide headline, sender number, and transaction ID.',
      });
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
        position: 'ALL_PAGES',
        target_audience: 'ALL',
        priority: selectedPkg.days >= 15 ? 10 : 8,
        is_active: true,
        starts_at: now.toISOString(),
        expires_at: expiryDate.toISOString(),
        background_color: selectedGradient,
        text_color: '#ffffff',
        badge_text: 'Sponsored',
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
            title: 'Campaign Created',
            description: `Banner is now active for ${selectedPkg.days} days.`,
          });
        },
      }
    );
  };

  return (
    <Dialog open={isCreateBannerOpen} onOpenChange={setCreateBannerOpen}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader className="mb-1">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Megaphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Promote Your Business</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Display your banner across all active user dashboards.
          </DialogDescription>
        </DialogHeader>

        {/* Live Mini Preview */}
        <div
          className="rounded-lg p-2 text-white border border-white/10 shadow-xs relative overflow-hidden"
          style={{ background: selectedGradient }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] font-black uppercase tracking-wider px-1 rounded bg-white/20 text-white">
                  AD
                </span>
                <span className="text-xs font-bold truncate block">
                  {title || 'Your Promo Title'}
                </span>
              </div>
              <p className="text-[10px] text-white/80 truncate">
                {description || 'Your promotional description will be displayed here.'}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-white text-zinc-950 flex items-center gap-0.5">
              {buttonText || 'Claim Offer'}
              <ArrowUpRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>

        {/* Campaign Settings */}
        <div className="space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-zinc-500 dark:text-zinc-400">Duration</Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="mt-1 h-7 text-xs">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_PACKAGES.map((pkg) => (
                    <SelectItem key={pkg.days} value={pkg.days.toString()} className="text-xs">
                      {pkg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-zinc-500 dark:text-zinc-400">Theme</Label>
              <div className="flex items-center gap-2 mt-1.5 h-7">
                {GRADIENT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.name}
                    onClick={() => setSelectedGradient(p.value)}
                    className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                      selectedGradient === p.value
                        ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-zinc-950 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: p.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-zinc-500 dark:text-zinc-400">Headline</Label>
            <Input
              type="text"
              required
              placeholder="e.g. 50% Off Spring Collection at TechBD"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>

          <div>
            <Label className="text-[11px] text-zinc-500 dark:text-zinc-400">Description (Optional)</Label>
            <Input
              type="text"
              placeholder="e.g. Free shipping on orders over ৳2,000"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-zinc-500 dark:text-zinc-400">Target Link</Label>
              <Input
                type="url"
                placeholder="https://yourwebsite.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-zinc-500 dark:text-zinc-400">Button Label</Label>
              <Input
                type="text"
                placeholder="Claim Offer"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Modern Spacious Payment Section */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3.5 sm:p-4 space-y-3.5 shadow-xs">
          {/* Header with Amount & Gateway Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Payment Verification
              </span>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Send <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">৳{selectedPkg.price}</span> via {paymentMethod === 'BKASH' ? 'bKash' : paymentMethod === 'NAGAD' ? 'Nagad' : 'Rocket'}
                </span>
              </div>
            </div>

            {/* MFS Brand Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60 shrink-0 self-start sm:self-auto">
              {[
                { id: 'BKASH', label: 'bKash', activeClass: 'bg-pink-600 text-white shadow-xs' },
                { id: 'NAGAD', label: 'Nagad', activeClass: 'bg-orange-600 text-white shadow-xs' },
                { id: 'ROCKET', label: 'Rocket', activeClass: 'bg-purple-600 text-white shadow-xs' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as 'BKASH' | 'NAGAD' | 'ROCKET')}
                  className={cn(
                    'px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer',
                    paymentMethod === m.id
                      ? m.activeClass
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Account Number Card */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                Official {paymentMethod === 'BKASH' ? 'bKash' : paymentMethod === 'NAGAD' ? 'Nagad' : 'Rocket'} Account (Send Money)
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {recipientNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer"
                  title="Copy account number"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              Personal / Merchant
            </span>
          </div>

          {/* Form Inputs with Proper Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Sender Mobile No <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="01XXXXXXXXX"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                className="h-9 text-xs font-mono bg-white dark:bg-zinc-950"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Transaction ID (TrxID) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                required
                placeholder="e.g. 9JA72X8B"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="h-9 text-xs font-mono uppercase font-bold bg-white dark:bg-zinc-950"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:space-x-0 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateBannerOpen(false)}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            disabled={createBanner.isPending}
            className="text-xs h-8 font-bold shadow-xs"
          >
            {createBanner.isPending ? 'Publishing...' : `Pay ৳${selectedPkg.price} & Launch`}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}


