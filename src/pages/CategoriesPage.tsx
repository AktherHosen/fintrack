import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCategories } from '../hooks/useCategories';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { Category, CategoryType } from '../types/database';
import {
  Tags,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  Search,
  AlertTriangle,
  Lock,
} from 'lucide-react';

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#14b8a6', // Teal
];

export function CategoriesPage() {
  const { t } = useTranslation();
  const {
    categories,
    expenseCategories,
    incomeCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  } = useCategories();

  // Search & Filter State
  const [search, setSearch] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [color, setColor] = useState('#10b981');

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const categoryToDelete = categories.find((c) => c.id === deleteId);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setType('EXPENSE');
    setColor('#10b981');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    if (cat.is_system) return;
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color || '#10b981');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    // Prevent duplicate category names in the same type
    const isDuplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === cleanName.toLowerCase() &&
        c.type === type &&
        (!editingCategory || c.id !== editingCategory.id)
    );

    if (isDuplicate) {
      toast.error('Duplicate Category', {
        description: `A category named "${cleanName}" already exists for ${type.toLowerCase()}s.`,
      });
      return;
    }

    if (editingCategory) {
      updateCategory.mutate(
        {
          id: editingCategory.id,
          name: cleanName,
          type,
          color,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
        }
      );
    } else {
      createCategory.mutate(
        {
          name: cleanName,
          type,
          color,
          icon: 'Tag',
          is_system: false,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
        }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    deleteCategory.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
      },
    });
  };

  const filterList = (list: Category[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  };

  const filteredExpenses = filterList(expenseCategories);
  const filteredIncomes = filterList(incomeCategories);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {t('nav.categories')}
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage, customize, and organize your expense and income categories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 text-xs h-8 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Category</span>
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Expense Categories</CardTitle>
                <span className="text-[10px] text-zinc-400">{filteredExpenses.length} categories</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-rose-500 border-rose-500/20">
              Debit
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredExpenses.map((c) => (
              <div
                key={c.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span
                    className="h-3.5 w-3.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-zinc-900"
                    style={{ backgroundColor: c.color || '#f97316' }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {c.is_system ? 'System Default' : 'Custom'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2">
                  {!c.is_system ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit custom category"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        onClick={() => setDeleteId(c.id)}
                        title="Delete custom category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-[10px] text-zinc-400 font-medium select-none" title="System default (locked)">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredExpenses.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-zinc-400">
                No expense categories found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Income Categories</CardTitle>
                <span className="text-[10px] text-zinc-400">{filteredIncomes.length} categories</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20">
              Credit
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredIncomes.map((c) => (
              <div
                key={c.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span
                    className="h-3.5 w-3.5 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-zinc-900"
                    style={{ backgroundColor: c.color || '#10b981' }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block truncate">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {c.is_system ? 'System Default' : 'Custom'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2">
                  {!c.is_system ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit custom category"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        onClick={() => setDeleteId(c.id)}
                        title="Delete custom category"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 text-[10px] text-zinc-400 font-medium select-none" title="System default (locked)">
                      <Lock className="h-2.5 w-2.5" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredIncomes.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-zinc-400">
                No income categories found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Category Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-emerald-400" />
              <span>{editingCategory ? 'Edit Category' : 'Add New Category'}</span>
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the name, classification, or theme badge for this category.'
                : 'Create a custom category tag to organize your transactions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input
                type="text"
                required
                placeholder="e.g. Freelance / Gym & Fitness"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(val) => setType(val as CategoryType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Color Preset</Label>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                        color === preset ? 'scale-125 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: preset }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-5 w-5 rounded-full border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {createCategory.isPending || updateCategory.isPending
                ? 'Saving...'
                : editingCategory
                ? 'Save Changes'
                : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Category"
        description={
          <span>
            Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100">{categoryToDelete?.name}</strong>? Existing transactions associated with this category will remain, but will no longer be linked to this tag.
          </span>
        }
        confirmLabel="Delete Category"
        isPending={deleteCategory.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
