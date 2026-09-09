import React, { useState } from 'react';
import { useBanners } from '../../hooks/useBanners';
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
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { BannerType, BannerPosition, TargetAudience } from '../../types/database';
import { Megaphone, Plus, Trash2, Eye, MousePointer } from 'lucide-react';

export function AdminBannersPage() {
  const { allBanners, createBanner, updateBanner, deleteBanner, isLoading } = useBanners();

  const [isOpen, setIsOpen] = useState(false);
  const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null);
  const bannerToDelete = allBanners?.find((b) => b.id === deleteBannerId);
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createBanner.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
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
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            Banner Promotions
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Create, schedule and target app banners across screens
          </p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-xs h-8 px-2.5 sm:px-3 font-semibold shrink-0"
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">New Campaign</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allBanners.map((b) => {
          const daysRemaining = b.expires_at
            ? Math.max(
                0,
                Math.ceil((new Date(b.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              )
            : null;

          return (
            <Card
              key={b.id}
              className="p-5 flex flex-col justify-between group relative overflow-hidden bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={b.is_active ? 'default' : 'secondary'}>
                      {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                    {b.duration_days && (
                      <Badge variant="outline" className="text-[10px]">
                        {b.duration_days}d Plan
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {b.position}
                  </span>
                </div>

                <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                  {b.title}
                </h4>
                {b.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-3">
                    {b.description}
                  </p>
                )}

                {/* Submitter & Payment Info if sponsored */}
                {b.transaction_id && (
                  <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs mb-3 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-indigo-700 dark:text-indigo-400">
                      <span>Sponsored Payment</span>
                      <span>৳ {b.amount_paid || 0} BDT</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      <span>TrxID: </span>
                      <strong className="text-zinc-900 dark:text-zinc-200">
                        {b.transaction_id}
                      </strong>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Sender: </span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                        {b.sender_number || '—'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    Audience: {b.target_audience}
                  </span>
                  {daysRemaining !== null && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      Expires: {daysRemaining}d left
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                {/* Analytics */}
                <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1" title="Impressions">
                    <Eye className="h-3.5 w-3.5" />
                    {b.impression_count || 0}
                  </span>
                  <span className="flex items-center gap-1" title="Clicks">
                    <MousePointer className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    {b.click_count || 0}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Button
                    size="sm"
                    variant={b.is_active ? 'outline' : 'default'}
                    onClick={() => updateBanner.mutate({ id: b.id, is_active: !b.is_active })}
                    className="h-7 text-xs px-2.5"
                  >
                    {b.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteBannerId(b.id)}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

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
              <Label>Banner Title</Label>
              <Input
                type="text"
                required
                placeholder="e.g. ⚡ Upgrade to Pro & Save 25%"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label>Description / Body Text</Label>
              <Input
                type="text"
                placeholder="e.g. Unlock unlimited accounts and automated recurring bills today."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
                <Select
                  value={position}
                  onValueChange={(val) => setPosition(val as any)}
                >
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
              <Select
                value={backgroundColor}
                onValueChange={(val) => setBackgroundColor(val)}
              >
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
            Are you sure you want to delete the banner <strong>{bannerToDelete?.title}</strong>? It will immediately stop appearing on active user dashboards and transactions feeds.
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
    </div>
  );
}
