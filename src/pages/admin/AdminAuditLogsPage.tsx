import React from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatDate } from '../../lib/utils';
import { ShieldAlert, FileCode } from 'lucide-react';

export function AdminAuditLogsPage() {
  const { auditLogs } = useAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
          Security & Audit Logs
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Chronological trail of auth events, transactions, and admin approvals
        </p>
      </div>

      <Card className="bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                    <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {log.action}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {log.entity_type}
                      </Badge>
                    </div>
                    {log.details && (
                      <pre className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 mt-1.5 bg-zinc-100 dark:bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 max-w-xl overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </pre>
                    )}
                  </div>
                </div>

                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
