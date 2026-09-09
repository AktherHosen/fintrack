import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../stores/useUIStore';
import { useAccounts } from '../../hooks/useAccounts';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AccountType } from '../../types/database';
import { Wallet } from 'lucide-react';

export function AddAccountModal() {
  const { t } = useTranslation();
  const { isAddAccountOpen, setAddAccountOpen } = useUIStore();
  const { createAccount } = useAccounts();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState('0');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance) || 0;
    if (!name.trim()) return;

    createAccount.mutate(
      {
        name: name.trim(),
        type,
        balance: numBalance,
        account_number: accountNumber.trim() || null,
        bank_name: bankName.trim() || null,
        currency: 'BDT',
        color,
        icon: 'Wallet',
        is_active: true,
        is_included_in_net_worth: true,
      },
      {
        onSuccess: () => {
          setName('');
          setBalance('0');
          setAccountNumber('');
          setBankName('');
          setAddAccountOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={isAddAccountOpen} onOpenChange={setAddAccountOpen}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-400" />
            <span>{t('accounts.add_account')}</span>
          </DialogTitle>
          <DialogDescription>
            Add a new Bank, Mobile Banking (bKash/Nagad), Cash wallet, or Card.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Account / Wallet Name</Label>
            <Input
              type="text"
              required
              placeholder="e.g. City Bank Salary / bKash Personal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Account Type</Label>
              <Select value={type} onValueChange={(val) => setType(val as AccountType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">Bank Account</SelectItem>
                  <SelectItem value="MOBILE_BANKING">Mobile Banking (bKash/Nagad)</SelectItem>
                  <SelectItem value="CASH">Cash in Hand</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="INVESTMENT">Investment / DPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Initial Balance (৳)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Bank / Issuer Name (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. BRAC Bank / bKash"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div>
              <Label>Account Number / Digits (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. •••• 1234 or Mobile No"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setAddAccountOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Adding...' : 'Create Account'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
