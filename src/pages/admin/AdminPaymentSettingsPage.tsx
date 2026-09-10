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
import { RichTextEditor } from '../../components/ui/rich-text-editor';

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
  const [initialized, setInitialized] = useState(false);

  // Initialize form state only once
  React.useEffect(() => {
    if (settings && !initialized) {
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
      setInitialized(true);
    }
  }, [settings, initialized]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
        {/* bKash */}
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-pink-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="h-7.5 w-7.5 rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">bKash MFS</h3>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold block">
                    Primary Gateway
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant={isBkashActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsBkashActive(!isBkashActive)}
                className="h-5.5 px-2 text-[10px] font-semibold rounded-md"
              >
                {isBkashActive ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="space-y-2.5">
              <div>
                <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">bKash Wallet Number</Label>
                <Input
                  type="text"
                  required={isBkashActive}
                  placeholder="017XXXXXXXX"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  className="font-mono text-xs font-semibold mt-1 h-8 text-pink-600 dark:text-pink-400 placeholder:font-normal"
                />
              </div>

              <div>
                <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Account Type</Label>
                <Select
                  value={bkashType}
                  onValueChange={(val) => setBkashType(val as PaymentAccountType)}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs font-medium">
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
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-orange-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="h-7.5 w-7.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">Nagad MFS</h3>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold block">
                    Post Office Digital
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant={isNagadActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsNagadActive(!isNagadActive)}
                className="h-5.5 px-2 text-[10px] font-semibold rounded-md"
              >
                {isNagadActive ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="space-y-2.5">
              <div>
                <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Nagad Wallet Number</Label>
                <Input
                  type="text"
                  required={isNagadActive}
                  placeholder="018XXXXXXXX"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  className="font-mono text-xs font-semibold mt-1 h-8 text-orange-600 dark:text-orange-400 placeholder:font-normal"
                />
              </div>

              <div>
                <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Account Type</Label>
                <Select
                  value={nagadType}
                  onValueChange={(val) => setNagadType(val as PaymentAccountType)}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs font-medium">
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
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="h-7.5 w-7.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    Dutch-Bangla Rocket
                  </h3>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block">
                    DBBL Banking
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant={isRocketActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsRocketActive(!isRocketActive)}
                className="h-5.5 px-2 text-[10px] font-semibold rounded-md"
              >
                {isRocketActive ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="space-y-2.5">
              <div>
                <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Rocket Wallet Number (with Check Digit)</Label>
                <Input
                  type="text"
                  required={isRocketActive}
                  placeholder="019XXXXXXXXX"
                  value={rocketNumber}
                  onChange={(e) => setRocketNumber(e.target.value)}
                  className="font-mono text-xs font-semibold mt-1 h-8 text-purple-600 dark:text-purple-400 placeholder:font-normal"
                />
              </div>

              <div>
                <Label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Account Type</Label>
                <Select
                  value={rocketType}
                  onValueChange={(val) => setRocketType(val as PaymentAccountType)}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs font-medium">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Step-by-Step Instructions
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Guidance shown to users inside subscription and banner payment modals
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Instructions (English)
              </Label>
              <div className="mt-1">
                <RichTextEditor
                  value={instructionsEn}
                  onChange={setInstructionsEn}
                  placeholder="1. Send the exact amount to our wallet number..."
                  minHeight="70px"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Instructions (Bengali / বাংলা)
              </Label>
              <div className="mt-1">
                <RichTextEditor
                  value={instructionsBn}
                  onChange={setInstructionsBn}
                  placeholder="১. আমাদের ওয়ালেটে সঠিক পরিমাণ টাকা পাঠান..."
                  minHeight="70px"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Live User Modal Preview */}
        <Card className="p-3.5 sm:p-4 bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Live User Modal Preview
              </h3>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
              Real-time rendering
            </Badge>
          </div>

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 font-bold text-xs">
                <Smartphone className="h-3.5 w-3.5" />
                <span>MFS Payment & Upgrade</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                499 ৳ / month
              </span>
            </div>

            {/* Instruction block */}
            <div className="p-2.5 rounded-md bg-pink-500/10 border border-pink-500/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                  bKash ({bkashType})
                </span>
                <span className="font-mono font-bold text-xs text-pink-600 dark:text-pink-400">
                  {bkashNumber || '01XXXXXXXXX'}
                </span>
              </div>
              {isNagadActive && nagadNumber && (
                <div className="flex items-center justify-between pt-1 border-t border-pink-500/15">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 text-[11px]">
                    Nagad ({nagadType})
                  </span>
                  <span className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
                    {nagadNumber}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
              {instructionsEn || 'Send the exact amount and enter TrxID below.'}
            </p>

            <div className="space-y-2 pt-0.5">
              <div>
                <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                  Sender Mobile Number
                </Label>
                <div className="h-7.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 flex items-center text-xs text-zinc-400">
                  017XXXXXXXX
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">
                  Transaction ID (TrxID)
                </Label>
                <div className="h-7.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 flex items-center text-xs text-zinc-400 font-mono">
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
