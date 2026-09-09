import React, { useState } from 'react';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { toast } from '../../components/ui/sonner';
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
import { Plan, BillingCycle } from '../../types/database';
import { Check, Plus, Edit2, Trash2, Power, Layers } from 'lucide-react';

export function AdminPlansPage() {
  const { plans, createPlan, updatePlan, deletePlan } = useSubscriptions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletePlanState, setDeletePlanState] = useState<Plan | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [featuresText, setFeaturesText] = useState('');
  const [maxAccounts, setMaxAccounts] = useState('5');
  const [maxBudgets, setMaxBudgets] = useState('10');
  const [exportReports, setExportReports] = useState(true);
  const [multiCurrency, setMultiCurrency] = useState(true);
  const [loansEnabled, setLoansEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setSlug('');
    setDescription('');
    setPrice('499');
    setBillingCycle('MONTHLY');
    setFeaturesText(
      'Unlimited Accounts\nAdvanced Analytics & Charts\nPriority Support\nAutomated Routine Bills'
    );
    setMaxAccounts('100');
    setMaxBudgets('50');
    setExportReports(true);
    setMultiCurrency(true);
    setLoansEnabled(true);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setDescription(plan.description || '');
    setPrice(plan.price.toString());
    setBillingCycle(plan.billing_cycle);
    setFeaturesText(plan.features.join('\n'));
    setMaxAccounts(plan.limits?.max_accounts?.toString() || '10');
    setMaxBudgets(plan.limits?.max_budgets?.toString() || '10');
    setExportReports(plan.limits?.export_reports ?? true);
    setMultiCurrency(plan.limits?.multi_currency ?? true);
    setLoansEnabled(plan.limits?.loans_enabled ?? true);
    setIsActive(plan.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const featuresArray = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const planPayload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim() || null,
      price: parseFloat(price) || 0,
      billing_cycle: billingCycle,
      features: featuresArray.length > 0 ? featuresArray : ['Full Platform Access'],
      limits: {
        max_accounts: parseInt(maxAccounts) || 10,
        max_budgets: parseInt(maxBudgets) || 10,
        export_reports: exportReports,
        multi_currency: multiCurrency,
        loans_enabled: loansEnabled,
      },
      is_active: isActive,
    };

    if (editingPlan) {
      updatePlan.mutate(
        { id: editingPlan.id, ...planPayload },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    } else {
      createPlan.mutate(planPayload, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const handleDelete = (plan: Plan) => {
    setDeletePlanState(plan);
  };

  const handleToggleActive = (plan: Plan) => {
    updatePlan.mutate({
      id: plan.id,
      is_active: !plan.is_active,
    });
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            Plans & Feature Tiers
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Create pricing tiers, account limits, and module access
          </p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={handleOpenCreate}
          className="text-[11px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-3 font-semibold shrink-0"
        >
          <Plus className="h-3 w-3 sm:mr-1.5" />
          <span className="hidden sm:inline">New Pricing Tier</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
        {plans.map((p) => (
          <Card
            key={p.id}
            className={`p-3.5 sm:p-4 flex flex-col justify-between bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs transition-all relative group ${
              !p.is_active ? 'opacity-70 border-dashed' : ''
            }`}
          >
            <div>
              {/* Header Badges & Actions */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.2">
                    {p.is_active ? 'ACTIVE' : 'DRAFT'}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
                    {p.billing_cycle}
                  </span>
                </div>

                <div className="flex items-center space-x-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(p)}
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    title="Edit Plan"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(p)}
                    className={`h-7 w-7 p-0 ${
                      p.is_active
                        ? 'text-amber-500 hover:bg-amber-500/10'
                        : 'text-emerald-500 hover:bg-emerald-500/10'
                    }`}
                    title={p.is_active ? 'Deactivate (Draft)' : 'Publish (Activate)'}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(p)}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10"
                    title="Delete Plan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Title & Price */}
              <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-0.5">{p.name}</h4>
              {p.description && (
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mb-2.5 line-clamp-2">
                  {p.description}
                </p>
              )}

              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {p.price.toLocaleString()} ৳
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                  / {p.billing_cycle.toLowerCase()}
                </span>
              </div>

              {/* Limits Strip */}
              {p.limits && (
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-[11px] mb-3 grid grid-cols-2 gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold">
                      Max Accounts
                    </span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                      {p.limits.max_accounts}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold">
                      Max Budgets
                    </span>
                    <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                      {p.limits.max_budgets}
                    </strong>
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-2.5 mb-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Included Features
                </span>
                {p.features?.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300"
                  >
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span className="leading-snug">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(p)}
              className="w-full h-7 text-[11px] font-semibold gap-1 mt-1"
            >
              <Edit2 className="h-3 w-3" />
              <span>Modify Tier</span>
            </Button>
          </Card>
        ))}
      </div>

      {/* Create / Edit Plan Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>
                {editingPlan ? `Edit Tier: ${editingPlan.name}` : 'Create New Pricing Plan'}
              </span>
            </DialogTitle>
            <DialogDescription>
              Configure plan pricing, subscriber limits, and marketing features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan Name</Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Pro Annual"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label>Slug / Key</Label>
                <Input
                  type="text"
                  placeholder="e.g. pro-annual"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                type="text"
                placeholder="e.g. Complete financial suite for power users and entrepreneurs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (৳ BDT)</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <Label>Billing Cycle</Label>
                <Select
                  value={billingCycle}
                  onValueChange={(val) => setBillingCycle(val as BillingCycle)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="LIFETIME">Lifetime Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max Accounts Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxAccounts}
                  onChange={(e) => setMaxAccounts(e.target.value)}
                />
              </div>
              <div>
                <Label>Max Budgets Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxBudgets}
                  onChange={(e) => setMaxBudgets(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Features (one per line)</Label>
              <textarea
                rows={4}
                required
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Unlimited Accounts&#10;Recurring Transactions&#10;CSV & PDF Export&#10;Audit Trail"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                  Publication Status
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isActive
                    ? 'Active and visible to users for upgrade'
                    : 'Draft / hidden from users'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {isActive ? 'ACTIVE' : 'DRAFT'}
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={createPlan.isPending || updatePlan.isPending}
            >
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Plan Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletePlanState}
        onOpenChange={(open) => !open && setDeletePlanState(null)}
        title="Delete Plan Tier"
        description={
          <span>
            Are you sure you want to delete the plan <strong>{deletePlanState?.name}</strong>? It will no longer be available for subscription or upgrades.
          </span>
        }
        confirmLabel="Delete Plan"
        isPending={deletePlan.isPending}
        onConfirm={() => {
          if (deletePlanState) {
            deletePlan.mutate(deletePlanState.id, {
              onSettled: () => setDeletePlanState(null),
            });
          }
        }}
      />
    </div>
  );
}
