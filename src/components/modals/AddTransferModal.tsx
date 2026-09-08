import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/useUIStore';
import { useAccounts } from '../../hooks/useAccounts';
import { useTransactions } from '../../hooks/useTransactions';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { ArrowLeftRight } from 'lucide-react';

export function AddTransferModal() {
  const { t } = useTranslation();
  const { isAddTransferOpen, setAddTransferOpen } = useUIStore();
  const { accounts } = useAccounts();
  const { createTransfer } = useTransactions();

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0');
  const [description, setDescription] = useState('');

  const selectedFrom = fromAccountId || (accounts.length > 0 ? accounts[0].id : '');
  const selectedTo = toAccountId || (accounts.length > 1 ? accounts[1].id : accounts[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const numFee = parseFloat(fee) || 0;
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (selectedFrom === selectedTo) {
      alert("Source and Destination accounts must be different.");
      return;
    }

    createTransfer.mutate(
      {
        from_account_id: selectedFrom,
        to_account_id: selectedTo,
        amount: numAmount,
        fee: numFee,
        description: description.trim() || 'Internal Account Transfer',
      },
      {
        onSuccess: () => {
          setAmount('');
          setFee('0');
          setDescription('');
          setAddTransferOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={isAddTransferOpen} onOpenChange={setAddTransferOpen}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-indigo-400" />
            <span>{t('dashboard.new_transfer')}</span>
          </DialogTitle>
          <DialogDescription>
            Move balance between Bank, bKash, Cash, or other accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>From Account</Label>
              <Select
                value={selectedFrom}
                onChange={(e) => setFromAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance} ৳)
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>To Account</Label>
              <Select
                value={selectedTo}
                onChange={(e) => setToAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance} ৳)
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Transfer Amount (৳)</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-bold text-lg"
              />
            </div>
            <div>
              <Label>Transfer Fee / Charge (৳)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Note / Purpose</Label>
            <Input
              type="text"
              placeholder="e.g. Bank to bKash Cash In"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAddTransferOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={createTransfer.isPending}
          >
            {createTransfer.isPending ? 'Processing...' : 'Transfer Funds'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
