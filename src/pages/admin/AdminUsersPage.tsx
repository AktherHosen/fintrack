import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { localDb } from '../../lib/supabase';
import { User, Search, Shield, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const user = localDb.getUser();
  const users = [
    user || {
      id: 'usr-1001-demo',
      email: 'demo@fintrack.app',
      full_name: 'Nowshad Hossain',
      role: 'ADMIN',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'usr-1002',
      email: 'tahmid@gmail.com',
      full_name: 'Tahmid Khan',
      role: 'USER',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    {
      id: 'usr-1003',
      email: 'samira@outlook.com',
      full_name: 'Samira Rahman',
      role: 'USER',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">User Management</h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">View and manage registered accounts and access roles</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{u.full_name || 'Anonymous User'}</span>
                    </td>
                    <td className="p-4 font-mono text-zinc-600 dark:text-zinc-400">{u.email}</td>
                    <td className="p-4">
                      <Badge variant={u.role === 'ADMIN' ? 'warning' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">{formatDate(u.created_at)}</td>
                    <td className="p-4">
                      <Badge variant="default">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
