import React, { useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/ui/table';
import { User, Search, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { UserProfile } from '../../types/database';

export function AdminUsersPage() {
  const { users, updateUserRole, isLoading } = useAdmin();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  const filtered = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const standardCount = users.filter((u) => u.role === 'USER').length;

  const handleRoleToggle = (targetUser: UserProfile) => {
    const nextRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    updateUserRole.mutate({ userId: targetUser.id, role: nextRole });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            User Management
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            View, filter, and manage registered accounts and super-admin privileges ({users.length} total)
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold border border-zinc-200/50 dark:border-zinc-700/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('ADMIN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                roleFilter === 'ADMIN'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admins ({adminCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('USER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                roleFilter === 'USER'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Standard Users ({standardCount})</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by user name or email..."
            className="pl-10 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                <TableHead className="font-bold uppercase text-[11px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((u) => (
                  <TableRow key={u.id} className="text-xs">
                    <TableCell>
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {u.full_name || 'FinTrack User'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-zinc-600 dark:text-zinc-400">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'ADMIN' ? 'warning' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 dark:text-zinc-400">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleToggle(u)}
                        disabled={updateUserRole.isPending}
                        className="h-7 text-[11px] px-2 font-medium"
                      >
                        {u.role === 'ADMIN' ? 'Demote to User' : 'Make Admin'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400"
                  >
                    {isLoading ? 'Loading users...' : 'No users match your search criteria.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
