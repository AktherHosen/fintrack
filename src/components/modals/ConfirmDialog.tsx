import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isPending?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const effectiveConfirm = confirmLabel || t('common.delete', 'Delete');
  const effectiveCancel = cancelLabel || t('common.cancel', 'Cancel');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4">
        <DialogHeader className="flex flex-row items-start space-x-3.5 space-y-0 text-left mb-0">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1 pr-6">
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-8 text-xs font-semibold cursor-pointer"
          >
            {effectiveCancel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : 'default'}
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className={`h-8 text-xs font-semibold cursor-pointer ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                : ''
            }`}
          >
            {isPending ? t('common.loading', 'Processing...') : effectiveConfirm}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
