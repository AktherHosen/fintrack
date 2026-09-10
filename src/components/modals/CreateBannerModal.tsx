import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useBanners } from '../../hooks/useBanners';
import { usePaymentSettings } from '../../hooks/usePaymentSettings';
import { useBannerPackages } from '../../hooks/useBannerPackages';
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
import { Megaphone, ArrowUpRight, Copy, Check, Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const GRADIENTS = [
  { id: 'indigo', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' },
  { id: 'emerald', value: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)' },
  { id: 'purple', value: 'linear-gradient(135deg, #3b0764 0%, #581c87 50%, #7e22ce 100%)' },
  { id: 'crimson', value: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)' },
  { id: 'slate', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' },
];

export function CreateBannerModal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createBanner } = useBanners();
  const { settings: paymentSettings } = usePaymentSettings();
  const { packages } = useBannerPackages();
  const { isCreateBannerOpen, setCreateBannerOpen, addToast } = useUIStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Claim Offer');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [duration, setDuration] = useState('7');
  const [gradient, setGradient] = useState(GRADIENTS[0].value);
  const [image, setImage] = useState<string | null>(null);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [method, setMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pkg = packages.find((p) => p.days === parseInt(duration)) || packages[0];

  const recipient =
    method === 'BKASH' ? paymentSettings.bkash_number
    : method === 'NAGAD' ? paymentSettings.nagad_number
    : paymentSettings.rocket_number;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast({ type: 'error', title: 'Image too large', description: 'Max 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !image) {
      addToast({ type: 'error', title: 'Missing content', description: 'Add a headline or upload an image.' });
      return;
    }
    if (!trxId.trim() || !senderNumber.trim()) {
      addToast({ type: 'error', title: 'Missing payment info', description: 'Enter sender number and TrxID.' });
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(senderNumber.trim())) {
      addToast({ type: 'error', title: 'Invalid number', description: 'Enter a valid 11-digit Bangladeshi number.' });
      return;
    }

    const now = new Date();
    createBanner.mutate(
      {
        title: title.trim() || null,
        description: description.trim() || null,
        image_url: image,
        button_text: buttonText.trim() || 'Learn More',
        link_url: linkUrl.trim() || null,
        type: 'PROMOTIONAL',
        position: 'ALL_PAGES',
        target_audience: 'ALL',
        priority: pkg.days >= 15 ? 10 : 8,
        is_active: false,
        starts_at: now.toISOString(),
        expires_at: new Date(now.getTime() + pkg.days * 86400000).toISOString(),
        background_color: gradient,
        text_color: '#ffffff',
        badge_text: 'Sponsored',
        created_by: user?.id || 'usr-promo',
        created_by_name: user?.full_name || 'Advertiser',
        created_by_email: user?.email || 'advertiser@example.com',
        duration_days: pkg.days,
        amount_paid: pkg.price,
        payment_method: method,
        transaction_id: trxId.trim().toUpperCase(),
        sender_number: senderNumber.trim(),
        payment_status: 'PENDING',
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          addToast({ type: 'success', title: 'Submitted', description: 'Pending admin verification.' });
        },
      }
    );
  };

  const reset = () => {
    setSubmitted(false);
    setTitle('');
    setDescription('');
    setTrxId('');
    setSenderNumber('');
    setImage(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Dialog open={isCreateBannerOpen} onOpenChange={(open) => { setCreateBannerOpen(open); if (!open) reset(); }}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Megaphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {submitted ? 'Submitted' : 'Promote Your Business'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {submitted ? 'Awaiting admin verification.' : 'Create a banner shown across all user dashboards.'}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mx-auto">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Payment received</p>
            <p className="text-[10px] text-zinc-500">TrxID: <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{trxId.toUpperCase()}</span></p>
            <Button type="button" size="sm" onClick={() => setCreateBannerOpen(false)} className="text-xs h-8 w-full">
              Done
            </Button>
          </div>
        ) : (
        <>
        {/* Preview */}
        <div
          className="rounded-lg overflow-hidden h-16 relative text-white"
          style={{ background: image ? undefined : gradient }}
        >
          {image ? (
            <>
              <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </>
          ) : null}
          <div className="absolute inset-0 p-2.5 flex items-end">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="min-w-0 flex-1">
                <span className="text-[7px] font-black uppercase tracking-wider px-1 rounded bg-white/20 text-white">AD</span>
                <p className="text-[11px] font-bold truncate mt-0.5 drop-shadow">{title || 'Your headline'}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white text-zinc-950 shrink-0 flex items-center gap-0.5">
                {buttonText} <ArrowUpRight className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] text-zinc-500">
              Headline {!image && <span className="text-rose-500">*</span>}
              {image && <span className="text-zinc-400 ml-1">(optional)</span>}
            </Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="50% Off Spring Sale" className="h-7 text-xs mt-0.5" />
          </div>

          <div>
            <Label className="text-[10px] text-zinc-500">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Limited time offer..." className="h-7 text-xs mt-0.5" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-zinc-500">Button</Label>
              <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="h-7 text-xs mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-zinc-500">Link</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="h-7 text-xs mt-0.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-zinc-500">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.days.toString()} className="text-xs">
                      {p.label} — ৳{p.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-zinc-500">Image</Label>
              {image ? (
                <div className="relative mt-0.5">
                  <img src={image} alt="" className="h-7 w-full rounded object-cover" />
                  <button type="button" onClick={() => { setImage(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="h-7 w-full rounded border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:text-indigo-500 transition-colors cursor-pointer mt-0.5">
                  <Upload className="h-3 w-3" /> Upload
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </div>
          </div>

          <div>
            <Label className="text-[10px] text-zinc-500">Theme</Label>
            <div className="flex items-center gap-1.5 mt-1">
              {GRADIENTS.map((g) => (
                <button key={g.id} type="button" onClick={() => setGradient(g.value)}
                  className={cn('h-5 w-5 rounded-full transition-all cursor-pointer',
                    gradient === g.value ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-zinc-950 scale-110' : 'opacity-60 hover:opacity-100'
                  )} style={{ background: g.value }} />
              ))}
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Payment</span>
            <div className="flex gap-1 p-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800/60">
              {(['BKASH', 'NAGAD', 'ROCKET'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={cn('px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer',
                    method === m ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
                  )}>{m === 'BKASH' ? 'bKash' : m === 'NAGAD' ? 'Nagad' : 'Rocket'}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] text-zinc-400">Send to</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{recipient}</span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(recipient); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="p-0.5 text-zinc-400 hover:text-indigo-500 cursor-pointer">
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-zinc-500">Sender Number <span className="text-rose-500">*</span></Label>
              <Input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="01XXXXXXXXX" className="h-7 text-xs font-mono mt-0.5" />
            </div>
            <div>
              <Label className="text-[10px] text-zinc-500">TrxID <span className="text-rose-500">*</span></Label>
              <Input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="9JA72X8B" className="h-7 text-xs font-mono uppercase mt-0.5" />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setCreateBannerOpen(false)} className="text-xs h-7">
            Cancel
          </Button>
          <Button type="submit" variant="gradient" size="sm" disabled={createBanner.isPending} className="text-xs h-7 font-bold">
            {createBanner.isPending ? 'Submitting...' : `Pay ৳${pkg.price} & Launch`}
          </Button>
        </DialogFooter>
        </>
        )}
      </form>
    </Dialog>
  );
}
