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
        <h2 className="text-2xl font-black text-white tracking-tight">Security & Audit Logs</h2>
        <p className="text-xs sm:text-sm text-slate-400">Chronological trail of auth events, transactions, and admin approvals</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40">
                <div className="flex items-start space-x-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{log.action}</span>
                      <Badge variant="secondary" className="text-[10px]">{log.entity_type}</Badge>
                    </div>
                    {log.details && (
                      <pre className="text-[11px] font-mono text-slate-400 mt-1 bg-black/40 px-2 py-1 rounded max-w-xl overflow-x-auto">
                        {JSON.stringify(log.details)}
                      </pre>
                    )}
                  </div>
                </div>

                <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
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
