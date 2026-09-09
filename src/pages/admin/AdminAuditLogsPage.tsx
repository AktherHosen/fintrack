import React from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatDate } from '../../lib/utils';
import { ShieldAlert } from 'lucide-react';

export function AdminAuditLogsPage() {
  const { auditLogs } = useAdmin();

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
          Security & Audit Logs
        </h2>
        <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          Chronological trail of auth events, transactions, and admin approvals
        </p>
      </div>

      <Card className="bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No security audit log entries recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold flex-shrink-0 mt-0.5 border border-indigo-200/60 dark:border-indigo-800/40">
                      <ShieldAlert className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                          {log.action}
                        </span>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0.2">
                          {log.entity_type}
                        </Badge>
                      </div>
                      {log.details && (
                        <pre className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 mt-1 bg-zinc-100 dark:bg-zinc-950 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 max-w-xl overflow-x-auto">
                          {JSON.stringify(log.details)}
                        </pre>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono whitespace-nowrap self-end sm:self-auto">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
