import React from 'react';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Check, Sparkles } from 'lucide-react';

export function AdminPlansPage() {
  const { plans } = useSubscriptions();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Plans & Feature Tiers</h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">Manage pricing, account limits and module availability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          <Card key={p.id} className="p-5 flex flex-col justify-between bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={p.is_active ? 'default' : 'secondary'}>
                  {p.is_active ? 'ACTIVE' : 'DRAFT'}
                </Badge>
                <span className="text-xs uppercase font-bold text-zinc-500 dark:text-zinc-400">{p.billing_cycle}</span>
              </div>

              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-1">{p.name}</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">{p.description}</p>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-4">{p.price} ৳</div>

              <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
