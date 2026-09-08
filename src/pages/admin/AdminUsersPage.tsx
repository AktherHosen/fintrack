import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import { localDb } from '../../lib/supabase';
import { User, Search } from 'lucide-react';
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
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          User Management
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          View and manage registered accounts and access roles
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          className="pl-10 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
              <TableRow>
                <TableHead className="font-bold uppercase text-[11px]">User</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Email</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Role</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Joined Date</TableHead>
                <TableHead className="font-bold uppercase text-[11px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="text-xs">
                  <TableCell className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {u.full_name || 'Anonymous User'}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-600 dark:text-zinc-400">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'warning' : 'secondary'}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 dark:text-zinc-400">
                    {formatDate(u.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
