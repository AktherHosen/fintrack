import React, { useState } from 'react';
import { useBanners } from '../../hooks/useBanners';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { BannerType, BannerPosition, TargetAudience } from '../../types/database';
import { Megaphone, Plus, Trash2, Eye, MousePointer, Sparkles } from 'lucide-react';

export function AdminBannersPage() {
  const { allBanners, createBanner, updateBanner, deleteBanner, isLoading } = useBanners();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Learn More');
  const [linkUrl, setLinkUrl] = useState('/settings#plans');
  const [type, setType] = useState<BannerType>('PROMOTIONAL');
  const [position, setPosition] = useState<BannerPosition>('DASHBOARD');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('ALL');
  const [priority, setPriority] = useState('5');
  const [badgeText, setBadgeText] = useState('Special Offer');
  const [backgroundColor, setBackgroundColor] = useState('linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Banner Promotions</h2>
          <p className="text-xs sm:text-sm text-slate-400">Create, schedule and target app banners to boost upgrades</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Campaign Banner</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allBanners.map((b) => {
          const daysRemaining = b.expires_at
            ? Math.max(0, Math.ceil((new Date(b.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null;

          return (
            <Card key={b.id} className="p-5 flex flex-col justify-between group relative overflow-hidden">
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
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{b.position}</span>
                </div>

                <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">{b.title}</h4>
                {b.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-3">{b.description}</p>
                )}

                {/* Submitter & Payment Info if sponsored */}
                {b.transaction_id && (
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs mb-3 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-indigo-400">
                      <span>Sponsored Payment</span>
                      <span>৳ {b.amount_paid || 0} BDT</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      <span>TrxID: </span>
                      <strong className="text-zinc-200">{b.transaction_id}</strong>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      <span>Sender: </span>
                      <span className="text-zinc-300 font-mono">{b.sender_number || '—'}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    Audience: {b.target_audience}
                  </span>
                  {daysRemaining !== null && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
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
                    <MousePointer className="h-3.5 w-3.5 text-indigo-400" />
                    {b.click_count || 0}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => updateBanner.mutate({ id: b.id, is_active: !b.is_active })}
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    {b.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete banner?')) deleteBanner.mutate(b.id);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
              <Megaphone className="h-5 w-5 text-emerald-400" />
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
                <Input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Position</Label>
                <Select value={position} onChange={(e) => setPosition(e.target.value as any)}>
                  <option value="DASHBOARD" className="bg-slate-900 text-white">Dashboard (Top)</option>
                  <option value="TRANSACTIONS" className="bg-slate-900 text-white">Transactions (Above list)</option>
                  <option value="ALL_PAGES" className="bg-slate-900 text-white">All Pages</option>
                  <option value="LOGIN" className="bg-slate-900 text-white">Login Page</option>
                </Select>
              </div>

              <div>
                <Label>Target Audience</Label>
                <Select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as any)}>
                  <option value="ALL" className="bg-slate-900 text-white">All Users</option>
                  <option value="FREE_USERS" className="bg-slate-900 text-white">Free Plan Users Only</option>
                  <option value="PRO_USERS" className="bg-slate-900 text-white">Pro Users Only</option>
                  <option value="NEW_USERS" className="bg-slate-900 text-white">New Users (Last 7 Days)</option>
                  <option value="EXPIRING_SOON" className="bg-slate-900 text-white">Expiring Subscriptions (3 Days)</option>
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
              <Select value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)}>
                <option value="linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)" className="bg-slate-900 text-white">
                  Indigo Royal
                </option>
                <option value="linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)" className="bg-slate-900 text-white">
                  Emerald Emerald
                </option>
                <option value="linear-gradient(135deg, #701a75 0%, #86198f 50%, #a21caf 100%)" className="bg-slate-900 text-white">
                  Fuchsia Magic
                </option>
                <option value="linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)" className="bg-slate-900 text-white">
                  Crimson Blaze
                </option>
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
    </div>
  );
}
