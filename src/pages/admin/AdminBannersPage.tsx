import React, { useState, useRef } from 'react';
import { useBanners } from '../../hooks/useBanners';
import { useAuth } from '../../hooks/useAuth';
import { useBannerPackages, BannerPackage } from '../../hooks/useBannerPackages';
import { useUIStore } from '../../stores/useUIStore';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../../components/ui/sheet';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { BannerType, BannerPosition, TargetAudience, Banner } from '../../types/database';
import {
  Megaphone,
  Plus,
  Trash2,
  Eye,
  MousePointer,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Settings,
  Upload,
} from 'lucide-react';
import { CircularProgressLoader } from '../../components/ui/spinner';
import { RichTextEditor } from '../../components/ui/rich-text-editor';

function PaymentStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  switch (status) {
    case 'APPROVED':
      return (
        <Badge className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
          PAID
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge className="text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">
          <XCircle className="h-2.5 w-2.5 mr-0.5" />
          REJECTED
        </Badge>
      );
    case 'PENDING':
    default:
      return (
        <Badge className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          PENDING
        </Badge>
      );
  }
}

export function AdminBannersPage() {
  const {
    allBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    verifyPayment,
    rejectPayment,
    isLoading,
  } = useBanners();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);
  const bannerToDelete = allBanners?.find((b) => b.id === deleteBannerId);

  // Rejection dialog state
  const [rejectBannerId, setRejectBannerId] = useState<string | null>(null);
  const bannerToReject = allBanners?.find((b) => b.id === rejectBannerId);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filter state
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
    'ALL'
  );

  // Banner packages management
  const { packages, updatePackages } = useBannerPackages();
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const [editingPackages, setEditingPackages] = useState<BannerPackage[]>([]);

  const openPackagesDialog = () => {
    setEditingPackages(packages.map((p) => ({ ...p })));
    setIsPackagesOpen(true);
  };

  const handleSavePackages = () => {
    const valid = editingPackages.filter((p) => p.days > 0 && p.price > 0);
    if (valid.length === 0) return;
    updatePackages.mutate(valid, {
      onSettled: () => setIsPackagesOpen(false),
    });
  };

  const addPackage = () => {
    const newId = `pkg-${Date.now()}`;
    setEditingPackages([...editingPackages, { id: newId, days: 1, price: 100, label: '1 Day' }]);
  };

  const removePackage = (id: string) => {
    setEditingPackages(editingPackages.filter((p) => p.id !== id));
  };

  const updatePackage = (id: string, field: keyof BannerPackage, value: string | number) => {
    setEditingPackages(
      editingPackages.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === 'days') {
          updated.label = `${value} Day${Number(value) !== 1 ? 's' : ''}`;
        }
        return updated;
      })
    );
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Learn More');
  const [linkUrl, setLinkUrl] = useState('/settings#plans');
  const [type, setType] = useState<BannerType>('PROMOTIONAL');
  const [position, setPosition] = useState<BannerPosition>('DASHBOARD');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('ALL');
  const [priority, setPriority] = useState('5');
  const [badgeText, setBadgeText] = useState('Special Offer');
  const [backgroundColor, setBackgroundColor] = useState(
    'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
  );
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      useUIStore
        .getState()
        .addToast({ type: 'error', title: 'Image too large', description: 'Max size is 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setBannerImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setBannerImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredBanners =
    paymentFilter === 'ALL'
      ? allBanners
      : allBanners.filter((b) => (b.payment_status || 'APPROVED') === paymentFilter);

  const pendingCount = allBanners.filter((b) => b.payment_status === 'PENDING').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !bannerImage) return;

    createBanner.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        image_url: bannerImage,
        button_text: buttonText.trim() || 'Learn More',
        link_url: linkUrl.trim() || null,
        type,
        position,
        target_audience: targetAudience,
        priority: parseInt(priority) || 0,
        is_active: true,
        background_color: backgroundColor,
        text_color: '#ffffff',
        badge_text: badgeText.trim() || null,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setBannerImage(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setIsOpen(false);
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectBannerId || !rejectionReason.trim()) return;
    rejectPayment.mutate(
      {
        id: rejectBannerId,
        reason: rejectionReason.trim(),
        verifiedBy: user?.id || 'admin',
      },
      {
        onSettled: () => {
          setRejectBannerId(null);
          setRejectionReason('');
        },
      }
    );
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            Banner Promotions
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Create, schedule and target app banners across screens
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={openPackagesDialog}
            className="text-[11px] sm:text-xs h-7 sm:h-8 px-2.5 font-semibold"
            title="Manage pricing packages"
          >
            <Settings className="h-3 w-3 sm:mr-1.5" />
            <span className="hidden sm:inline">Packages</span>
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="text-[11px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-3 font-semibold"
          >
            <Plus className="h-3 w-3 sm:mr-1.5" />
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Payment Status Filter Tabs */}
      {allBanners.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 w-fit">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPaymentFilter(f)}
              className={`px-3 py-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                paymentFilter === f
                  ? f === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : f === 'APPROVED'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : f === 'REJECTED'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              {f === 'ALL' ? 'All' : f}
              {f === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0 rounded-full bg-amber-600 text-white text-[9px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <CircularProgressLoader size="lg" />
        </div>
      ) : allBanners.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-500 border-zinc-200 dark:border-zinc-800">
          No campaign banners found. Click &quot;New Campaign&quot; to create one.
        </Card>
      ) : filteredBanners.length === 0 ? (
        <Card className="p-8 text-center text-xs text-zinc-500 border-zinc-200 dark:border-zinc-800">
          No banners match the selected filter.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredBanners.map((b) => {
            const daysRemaining = b.expires_at
              ? Math.max(
                  0,
                  Math.ceil((new Date(b.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                )
              : null;

            const isSponsored = !!b.transaction_id;
            const isPending = b.payment_status === 'PENDING';
            const isRejected = b.payment_status === 'REJECTED';
            const isExpiringSoon = daysRemaining !== null && daysRemaining <= 2;

            return (
              <Card
                key={b.id}
                className={`p-3 flex flex-col group relative overflow-hidden bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs ${
                  isPending ? 'ring-1 ring-amber-300 dark:ring-amber-600' : ''
                } ${
                  isRejected ? 'ring-1 ring-rose-300 dark:ring-rose-600 opacity-75' : ''
                } ${isExpiringSoon && !isPending && !isRejected ? 'ring-1 ring-orange-300 dark:ring-orange-600' : ''}`}
              >
                {/* Header: Badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={b.is_active ? 'default' : 'secondary'}
                      className="text-[9px] px-1.5 py-0 h-4"
                    >
                      {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                    {isSponsored && <PaymentStatusBadge status={b.payment_status} />}
                    {b.duration_days && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                        {b.duration_days}d
                      </Badge>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase">{b.position}</span>
                </div>

                {/* Image or Title — fixed height */}
                {b.image_url ? (
                  <div className="h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-2">
                    <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 flex items-center mb-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2">
                      {b.title || 'Untitled'}
                    </h4>
                  </div>
                )}

                {/* Description — fixed height */}
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2 h-4">
                  {b.description || '\u00A0'}
                </p>

                {/* Payment info — fixed height */}
                {isSponsored ? (
                  <div
                    className={`h-[72px] p-2 rounded-lg text-[11px] mb-2 space-y-0.5 overflow-hidden ${
                      isPending
                        ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20'
                        : isRejected
                          ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span
                        className={
                          isPending
                            ? 'text-amber-700 dark:text-amber-400'
                            : isRejected
                              ? 'text-rose-700 dark:text-rose-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }
                      >
                        ৳{b.amount_paid || 0} BDT
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 font-mono">
                        {b.transaction_id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                      <span className="font-mono">{b.sender_number || '—'}</span>
                      <span className="uppercase font-semibold">{b.payment_method || '—'}</span>
                    </div>
                    {isRejected && b.payment_rejection_reason && (
                      <div className="flex items-center gap-1 pt-0.5 border-t border-rose-200/40 dark:border-rose-500/20">
                        <AlertTriangle className="h-2.5 w-2.5 text-rose-500 shrink-0" />
                        <span className="text-[9px] text-rose-600 dark:text-rose-400 truncate">
                          {b.payment_rejection_reason}
                        </span>
                      </div>
                    )}
                    {!isRejected && b.payment_verified_at && (
                      <div className="flex items-center gap-1 pt-0.5 border-t border-emerald-200/40 dark:border-emerald-500/20">
                        <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400">
                          Verified {new Date(b.payment_verified_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[72px] mb-2" />
                )}

                {/* Tags — fixed height */}
                <div className="flex items-center gap-1 mb-2 h-5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 truncate">
                    {b.target_audience}
                  </span>
                  {daysRemaining !== null && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${
                        daysRemaining === 0
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                          : daysRemaining <= 2
                            ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {daysRemaining === 0 ? 'Expires today' : `${daysRemaining}d left`}
                    </span>
                  )}
                  {b.created_by_name && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 truncate">
                      {b.created_by_name}
                    </span>
                  )}
                </div>

                {/* Spacer pushes footer to bottom */}
                <div className="flex-1" />

                {/* Footer */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-0.5" title="Impressions">
                      <Eye className="h-3 w-3" />
                      {b.impression_count || 0}
                    </span>
                    <span className="flex items-center gap-0.5" title="Clicks">
                      <MousePointer className="h-3 w-3" />
                      {b.click_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isSponsored && isPending && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            verifyPayment.mutate({ id: b.id, verifiedBy: user?.id || 'admin' })
                          }
                          disabled={verifyPayment.isPending}
                          className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectBannerId(b.id)}
                          className="h-6 text-[10px] px-2 text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-700"
                        >
                          <XCircle className="h-3 w-3 mr-0.5" />
                          Reject
                        </Button>
                      </>
                    )}
                    {(!isSponsored || b.payment_status === 'APPROVED') && (
                      <Button
                        size="sm"
                        variant={b.is_active ? 'outline' : 'default'}
                        onClick={() => updateBanner.mutate({ id: b.id, is_active: !b.is_active })}
                        className="h-6 text-[10px] px-2"
                      >
                        {b.is_active ? 'Pause' : 'Activate'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteBannerId(b.id)}
                      className="h-6 w-6 p-0 text-zinc-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Banner Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>Create Campaign Banner</span>
            </DialogTitle>
            <DialogDescription>
              Configure promotional message, target audience, and action button.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label>
                Banner Title {!bannerImage && <span className="text-rose-500">*</span>}
                {bannerImage && (
                  <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                    (Optional with image)
                  </span>
                )}
              </Label>
              <Input
                type="text"
                placeholder="e.g. ⚡ Upgrade to Pro & Save 25%"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Description / Promo Message</Label>
              <div className="mt-1">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="e.g. Unlock unlimited accounts and automated recurring bills today."
                  minHeight="65px"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Button CTA Text</Label>
                <Input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </div>
              <div>
                <Label>Link URL</Label>
                <Input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Position</Label>
                <Select value={position} onValueChange={(val) => setPosition(val as any)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DASHBOARD">Dashboard (Top)</SelectItem>
                    <SelectItem value="TRANSACTIONS">Transactions (Above list)</SelectItem>
                    <SelectItem value="ALL_PAGES">All Pages</SelectItem>
                    <SelectItem value="LOGIN">Login Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Audience</Label>
                <Select
                  value={targetAudience}
                  onValueChange={(val) => setTargetAudience(val as any)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="FREE_USERS">Free Plan Users Only</SelectItem>
                    <SelectItem value="PRO_USERS">Pro Users Only</SelectItem>
                    <SelectItem value="NEW_USERS">New Users (Last 7 Days)</SelectItem>
                    <SelectItem value="EXPIRING_SOON">Expiring Subscriptions (3 Days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Badge Text</Label>
                <Input
                  type="text"
                  placeholder="e.g. Limited Offer"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                />
              </div>
              <div>
                <Label>Priority (0-10)</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Theme Gradient Preset</Label>
              <Select value={backgroundColor} onValueChange={(val) => setBackgroundColor(val)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)">
                    Indigo Royal
                  </SelectItem>
                  <SelectItem value="linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)">
                    Emerald Emerald
                  </SelectItem>
                  <SelectItem value="linear-gradient(135deg, #701a75 0%, #86198f 50%, #a21caf 100%)">
                    Fuchsia Magic
                  </SelectItem>
                  <SelectItem value="linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)">
                    Crimson Blaze
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Banner Image (Optional)</Label>
              {bannerImage ? (
                <div className="mt-1 relative group">
                  <img
                    src={bannerImage}
                    alt="Banner"
                    className="w-full h-20 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 w-full h-16 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <Upload className="h-4 w-4 text-zinc-400" />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Click to upload (max 2MB)
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createBanner.isPending}>
              {createBanner.isPending ? 'Publishing...' : 'Publish Banner'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Banner Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteBannerId}
        onOpenChange={(open) => !open && setDeleteBannerId(null)}
        title="Delete Promotional Banner"
        description={
          <span>
            Are you sure you want to delete the banner <strong>{bannerToDelete?.title}</strong>? It
            will immediately stop appearing on active user dashboards and transactions feeds.
          </span>
        }
        confirmLabel="Delete Banner"
        isPending={deleteBanner.isPending}
        onConfirm={() => {
          if (deleteBannerId) {
            deleteBanner.mutate(deleteBannerId, {
              onSettled: () => setDeleteBannerId(null),
            });
          }
        }}
      />

      {/* Reject Payment Dialog */}
      <Dialog open={!!rejectBannerId} onOpenChange={(open) => !open && setRejectBannerId(null)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <XCircle className="h-5 w-5" />
            <span>Reject Payment</span>
          </DialogTitle>
          <DialogDescription>
            Reject the payment for <strong>{bannerToReject?.title}</strong>. The banner will be
            deactivated and the submitter will see the rejection reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Show payment details for reference */}
          {bannerToReject && (
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount:</span>
                <span className="font-semibold">৳{bannerToReject.amount_paid} BDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">TrxID:</span>
                <span className="font-mono font-semibold">{bannerToReject.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sender:</span>
                <span className="font-mono">{bannerToReject.sender_number}</span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Rejection Reason <span className="text-rose-500">*</span>
            </Label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction ID not found, amount mismatch, invalid sender number..."
              className="mt-1 w-full h-20 text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 resize-none focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRejectBannerId(null);
              setRejectionReason('');
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!rejectionReason.trim() || rejectPayment.isPending}
            onClick={handleReject}
          >
            {rejectPayment.isPending ? 'Rejecting...' : 'Reject Payment'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Manage Packages Sheet */}
      <Sheet open={isPackagesOpen} onOpenChange={setIsPackagesOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Pricing Packages
            </SheetTitle>
            <SheetDescription>
              Set the duration and price packages advertisers can purchase.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
            {editingPackages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Megaphone className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No packages yet.</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                  Add a package to get started.
                </p>
              </div>
            )}

            {editingPackages.map((pkg, index) => (
              <div
                key={pkg.id}
                className="group relative p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {pkg.label}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePackage(pkg.id)}
                    className="h-6 w-6 p-0 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      Duration (days)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={pkg.days}
                      onChange={(e) => updatePackage(pkg.id, 'days', parseInt(e.target.value) || 1)}
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      Price (BDT)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={pkg.price}
                      onChange={(e) =>
                        updatePackage(pkg.id, 'price', parseInt(e.target.value) || 0)
                      }
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <Label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    Display Label
                  </Label>
                  <Input
                    type="text"
                    value={pkg.label}
                    onChange={(e) => updatePackage(pkg.id, 'label', e.target.value)}
                    placeholder="e.g. 7 Days"
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addPackage}
              className="w-full p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Add Package
              </div>
            </button>
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => setIsPackagesOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient"
              onClick={handleSavePackages}
              disabled={updatePackages.isPending}
            >
              {updatePackages.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
