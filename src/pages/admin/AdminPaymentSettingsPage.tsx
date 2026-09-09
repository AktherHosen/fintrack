import React, { useState, useEffect } from 'react';
import { usePaymentSettings } from '../../hooks/usePaymentSettings';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { PaymentAccountType } from '../../types/database';
import { Smartphone, Save, Eye } from 'lucide-react';

export function AdminPaymentSettingsPage() {
  const { settings, updatePaymentSettings } = usePaymentSettings();

  const [bkashNumber, setBkashNumber] = useState('');
  const [bkashType, setBkashType] = useState<PaymentAccountType>('MERCHANT');
  const [isBkashActive, setIsBkashActive] = useState(true);

  const [nagadNumber, setNagadNumber] = useState('');
  const [nagadType, setNagadType] = useState<PaymentAccountType>('PERSONAL');
  const [isNagadActive, setIsNagadActive] = useState(true);

  const [rocketNumber, setRocketNumber] = useState('');
  const [rocketType, setRocketType] = useState<PaymentAccountType>('PERSONAL');
  const [isRocketActive, setIsRocketActive] = useState(true);

  const [instructionsEn, setInstructionsEn] = useState('');
  const [instructionsBn, setInstructionsBn] = useState('');

  // Sync state when settings query loads
  useEffect(() => {
    if (settings) {
      setBkashNumber(settings.bkash_number || '');
      setBkashType(settings.bkash_type || 'MERCHANT');
      setIsBkashActive(settings.is_bkash_active ?? true);

      setNagadNumber(settings.nagad_number || '');
      setNagadType(settings.nagad_type || 'PERSONAL');
      setIsNagadActive(settings.is_nagad_active ?? true);

      setRocketNumber(settings.rocket_number || '');
      setRocketType(settings.rocket_type || 'PERSONAL');
      setIsRocketActive(settings.is_rocket_active ?? true);

      setInstructionsEn(settings.instructions_en || '');
      setInstructionsBn(settings.instructions_bn || '');
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettings.mutate({
      bkash_number: bkashNumber.trim(),
      bkash_type: bkashType,
      is_bkash_active: isBkashActive,
      nagad_number: nagadNumber.trim(),
      nagad_type: nagadType,
      is_nagad_active: isNagadActive,
      rocket_number: rocketNumber.trim(),
      rocket_type: rocketType,
      is_rocket_active: isRocketActive,
      instructions_en: instructionsEn.trim(),
      instructions_bn: instructionsBn.trim(),
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-3.5 sm:space-y-4">
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
            Payment Gateway & MFS Setup
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
            Configure wallet numbers, merchant types, and checkout guides
          </p>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="sm"
          disabled={updatePaymentSettings.isPending}
          className="text-[11px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-3 font-semibold shrink-0 shadow-xs"
        >
          <Save className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">
            {updatePaymentSettings.isPending ? 'Saving...' : 'Save All Changes'}
          </span>
          <span className="sm:hidden">
            {updatePaymentSettings.isPending ? 'Saving...' : 'Save'}
          </span>
        </Button>
      </div>

      {/* MFS Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* bKash */}
        <Card className="p-5 bg-white dark:bg-zinc-900/90 border-pink-500/30 shadow-xs hover:border-pink-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">bKash MFS</h3>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase">
                    Primary Gateway
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant={isBkashActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsBkashActive(!isBkashActive)}
                className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider"
              >
                {isBkashActive ? 'ENABLED' : 'DISABLED'}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">bKash Wallet Number</Label>
                <Input
                  type="text"
                  required={isBkashActive}
                  placeholder="017XXXXXXXX"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  className="font-mono text-sm font-bold mt-1 text-pink-600 dark:text-pink-400"
                />
              </div>

              <div>
                <Label className="text-xs">Account Type</Label>
                <Select
                  value={bkashType}
                  onValueChange={(val) => setBkashType(val as PaymentAccountType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MERCHANT">Merchant (Payment option)</SelectItem>
                    <SelectItem value="PERSONAL">Personal (Send Money option)</SelectItem>
                    <SelectItem value="AGENT">Agent (Cash In option)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Nagad */}
        <Card className="p-5 bg-white dark:bg-zinc-900/90 border-orange-500/30 shadow-xs hover:border-orange-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Nagad MFS</h3>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase">
                    Post Office Digital
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant={isNagadActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsNagadActive(!isNagadActive)}
                className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider"
              >
                {isNagadActive ? 'ENABLED' : 'DISABLED'}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nagad Wallet Number</Label>
                <Input
                  type="text"
                  required={isNagadActive}
                  placeholder="018XXXXXXXX"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  className="font-mono text-sm font-bold mt-1 text-orange-600 dark:text-orange-400"
                />
              </div>

              <div>
                <Label className="text-xs">Account Type</Label>
                <Select
                  value={nagadType}
                  onValueChange={(val) => setNagadType(val as PaymentAccountType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal (Send Money)</SelectItem>
                    <SelectItem value="MERCHANT">Merchant (Payment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Rocket */}
        <Card className="p-5 bg-white dark:bg-zinc-900/90 border-purple-500/30 shadow-xs hover:border-purple-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Dutch-Bangla Rocket
                  </h3>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase">
                    DBBL Banking
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant={isRocketActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsRocketActive(!isRocketActive)}
                className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider"
              >
                {isRocketActive ? 'ENABLED' : 'DISABLED'}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Rocket Wallet Number (with Check Digit)</Label>
                <Input
                  type="text"
                  required={isRocketActive}
                  placeholder="019XXXXXXXXX"
                  value={rocketNumber}
                  onChange={(e) => setRocketNumber(e.target.value)}
                  className="font-mono text-sm font-bold mt-1 text-purple-600 dark:text-purple-400"
                />
              </div>

              <div>
                <Label className="text-xs">Account Type</Label>
                <Select
                  value={rocketType}
                  onValueChange={(val) => setRocketType(val as PaymentAccountType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal (Send Money)</SelectItem>
                    <SelectItem value="MERCHANT">Merchant (Payment)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Verification Instructions Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Step-by-Step Instructions
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Guidance shown to users inside subscription and banner payment modals
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Instructions (English)
              </Label>
              <textarea
                rows={4}
                required
                className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                placeholder="1. Send the exact amount..."
                value={instructionsEn}
                onChange={(e) => setInstructionsEn(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Instructions (Bengali / বাংলা)
              </Label>
              <textarea
                rows={4}
                required
                className="mt-1.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-sans"
                placeholder="১. আমাদের ওয়ালেটে সঠিক পরিমাণ টাকা পাঠান..."
                value={instructionsBn}
                onChange={(e) => setInstructionsBn(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Live User Modal Preview */}
        <Card className="p-5 bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Live User Modal Preview
              </h3>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Real-time rendering
            </Badge>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-xs">
                <Smartphone className="h-4 w-4" />
                <span>MFS Payment & Upgrade</span>
              </div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                499 ৳ / month
              </span>
            </div>

            {/* Instruction block */}
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  bKash ({bkashType})
                </span>
                <span className="font-mono font-black text-sm text-pink-600 dark:text-pink-400">
                  {bkashNumber || '01XXXXXXXXX'}
                </span>
              </div>
              {isNagadActive && nagadNumber && (
                <div className="flex items-center justify-between pt-1 border-t border-pink-500/15">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Nagad ({nagadType})
                  </span>
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    {nagadNumber}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
              {instructionsEn || 'Send the exact amount and enter TrxID below.'}
            </p>

            <div className="space-y-2 pt-1">
              <div>
                <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                  Sender Mobile Number
                </Label>
                <div className="h-8 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 flex items-center text-xs text-zinc-400">
                  017XXXXXXXX
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                  Transaction ID (TrxID)
                </Label>
                <div className="h-8 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 flex items-center text-xs text-zinc-400 font-mono">
                  BKA993X109
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </form>
  );
}
