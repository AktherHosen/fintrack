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
        <h2 className="text-2xl font-black text-white tracking-tight">Plans & Feature Tiers</h2>
        <p className="text-xs sm:text-sm text-slate-400">Manage pricing, account limits and module availability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          <Card key={p.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={p.is_active ? 'default' : 'secondary'}>
                  {p.is_active ? 'ACTIVE' : 'DRAFT'}
                </Badge>
                <span className="text-xs uppercase font-bold text-slate-400">{p.billing_cycle}</span>
              </div>

              <h4 className="text-lg font-bold text-white mb-1">{p.name}</h4>
              <p className="text-xs text-slate-400 mb-3">{p.description}</p>
              <div className="text-2xl font-black text-emerald-400 mb-4">{p.price} ৳</div>

              <div className="space-y-1.5 border-t border-slate-800 pt-3">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5" />
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
