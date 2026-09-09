import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { Wallet, Crown, AlertCircle, ArrowRight } from 'lucide-react';

export function AddAccountModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAddAccountOpen, setAddAccountOpen } = useUIStore();
  const { createAccount, accounts, maxAccounts, isLimitReached, isPro, currentPlan } = useAccounts();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState('0');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached) return;
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

  const handleUpgradeClick = () => {
    setAddAccountOpen(false);
    navigate('/settings#plans');
  };

  return (
    <Dialog open={isAddAccountOpen} onOpenChange={setAddAccountOpen}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-400" />
            <span>{t('accounts.add_account', 'Add Account')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('accounts.add_modal_desc', 'Add a new Bank, Mobile Banking (bKash/Nagad), Cash wallet, or Card.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Limit Alert if limit reached */}
          {isLimitReached && (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">
                    {t('accounts.limit_reached', 'Account Limit Reached')} ({accounts.length}/{maxAccounts})
                  </strong>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {t('accounts.limit_reached_desc', {
                      max: maxAccounts,
                      defaultValue: `Your ${currentPlan?.name || 'Free Starter'} plan allows up to ${maxAccounts} active wallets/accounts. Upgrade to Pro to add unlimited accounts.`
                    })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="gradient"
                onClick={handleUpgradeClick}
                className="w-full text-xs h-7 gap-1 font-bold shadow-xs"
              >
                <Crown className="h-3 w-3" />
                <span>{t('accounts.unlock_unlimited', 'Upgrade to Pro Plan')}</span>
                <ArrowRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
          )}

          <div>
            <Label>{t('accounts.account_name', 'Account / Wallet Name')}</Label>
            <Input
              type="text"
              required
              disabled={isLimitReached}
              placeholder="e.g. City Bank Salary / bKash Personal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('accounts.account_type', 'Account Type')}</Label>
              <Select
                disabled={isLimitReached}
                value={type}
                onValueChange={(val) => setType(val as AccountType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('accounts.select_type', 'Select account type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">{t('accounts.bank_account', 'Bank Account')}</SelectItem>
                  <SelectItem value="MOBILE_BANKING">{t('accounts.mobile_banking', 'Mobile Banking (bKash/Nagad)')}</SelectItem>
                  <SelectItem value="CASH">{t('accounts.cash_in_hand', 'Cash in Hand')}</SelectItem>
                  <SelectItem value="CREDIT_CARD">{t('accounts.credit_card', 'Credit Card')}</SelectItem>
                  <SelectItem value="INVESTMENT">{t('accounts.investment', 'Investment / DPS')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('accounts.initial_balance', 'Initial Balance (৳)')}</Label>
              <Input
                type="number"
                step="0.01"
                disabled={isLimitReached}
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t('accounts.bank_name', 'Bank / Issuer Name')}</Label>
              <Input
                type="text"
                disabled={isLimitReached}
                placeholder="e.g. BRAC Bank / bKash"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div>
              <Label>{t('accounts.account_number', 'Account Number / Digits')}</Label>
              <Input
                type="text"
                disabled={isLimitReached}
                placeholder="e.g. •••• 1234 or Mobile No"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setAddAccountOpen(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="gradient"
            disabled={isLimitReached || createAccount.isPending}
          >
            {createAccount.isPending
              ? t('accounts.adding', 'Adding...')
              : isLimitReached
                ? t('accounts.limit_reached', 'Limit Reached')
                : t('accounts.create_account_btn', 'Create Account')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
