import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategories } from '../hooks/useCategories';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { CategoryType } from '../types/database';
import { Tags, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export function CategoriesPage() {
  const { t } = useTranslation();
  const { categories, expenseCategories, incomeCategories, createCategory } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [color, setColor] = useState('#10b981');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCategory.mutate(
      {
        name: name.trim(),
        type,
        color,
        icon: 'Tag',
        is_system: false,
      },
      {
        onSuccess: () => {
          setName('');
          setIsOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('nav.categories')}</h2>
          <p className="text-xs sm:text-sm text-slate-400">Manage expense and income categorization tags</p>
        </div>

        <Button
          variant="gradient"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Expense Categories ({expenseCategories.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {expenseCategories.map((c) => (
              <div
                key={c.id}
                className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color || '#f97316' }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-white block truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-500">{c.is_system ? 'System Default' : 'Custom'}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">Income Categories ({incomeCategories.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {incomeCategories.map((c) => (
              <div
                key={c.id}
                className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color || '#10b981' }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-white block truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-500">{c.is_system ? 'System Default' : 'Custom'}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-emerald-400" />
              <span>Add New Category</span>
            </DialogTitle>
            <DialogDescription>Create a custom tag to organize your transactions.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Pet Care / Tech Gadgets"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value as any)}>
                  <option value="EXPENSE" className="bg-slate-900 text-white">Expense</option>
                  <option value="INCOME" className="bg-slate-900 text-white">Income</option>
                </Select>
              </div>

              <div>
                <Label>Badge Color</Label>
                <div className="flex items-center space-x-2 h-11">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-14 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300">{color}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Saving...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
