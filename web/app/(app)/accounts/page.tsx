"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAccountSchema, updateAccountSchema, type CreateAccountInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { formatBDT } from "@/lib/formatters";
import type { AccountDto, SubscriptionDto } from "@fintrack/shared";
import { useAuth } from "@/lib/auth-context";
import { usePlanUpgrade } from "@/lib/use-plan-upgrade";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, FormField, FormFieldInput, fieldError } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ListDivider, ListItem, PageHeader, Skeleton } from "@/components/ui/material";
import { Pencil, Wallet } from "lucide-react";
import { z } from "zod";

const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "INR"];

function createAccountDefaults(currency = "BDT"): CreateAccountInput {
  return { name: "", type: "CASH", currency, openingBalance: "0" };
}

type EditInput = z.infer<typeof updateAccountSchema>;

export default function AccountsPage() {
  const { user } = useAuth();
  const { promptUpgradeIfAtLimit, handleUpgradeError } = usePlanUpgrade();
  const [open, setOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<AccountDto | null>(null);
  const qc = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api<AccountDto[]>("/accounts"),
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
  });

  const createForm = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    mode: "onTouched",
    defaultValues: createAccountDefaults(user?.currency ?? "BDT"),
  });

  const editForm = useForm<EditInput>({
    resolver: zodResolver(updateAccountSchema),
    mode: "onTouched",
  });

  const create = useMutation({
    mutationFn: (data: CreateAccountInput) =>
      api("/accounts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
      setOpen(false);
      createForm.reset(createAccountDefaults(user?.currency ?? "BDT"));
    },
    onError: (e) => {
      handleUpgradeError(e, () => setOpen(false));
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditInput }) =>
      api(`/accounts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditAccount(null);
    },
  });

  function openCreate() {
    if (
      promptUpgradeIfAtLimit(
        subscription?.usage?.accounts ?? accounts.length,
        subscription?.limits?.accounts,
      )
    ) {
      return;
    }
    createForm.reset(createAccountDefaults(user?.currency ?? "BDT"));
    setOpen(true);
  }

  function openEdit(a: AccountDto) {
    setEditAccount(a);
    editForm.reset({ name: a.name, type: a.type as CreateAccountInput["type"], currency: a.currency });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Accounts"
        subtitle={`${accounts.length} wallets`}
        action={
          <Button size="sm" onClick={openCreate}>
            Add
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState message="No accounts yet. Add your first wallet." />
      ) : (
        <Card>
          <CardContent className="py-1">
            {accounts.map((a, i) => (
              <div key={a.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={a.name}
                  subtitle={`${a.type.replace(/_/g, " ")} · ${a.currency}`}
                  icon={Wallet}
                  iconClassName="border-primary/20 bg-primary/10 text-primary"
                  trailing={
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatBDT(a.balance)}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>New account</SheetTitle>
          </SheetHeader>
          <form className="mt-5 space-y-4" onSubmit={createForm.handleSubmit((d) => create.mutate(d))}>
            <FormFieldInput form={createForm} name="name" label="Name" placeholder="e.g. bKash" />
            <FormField label="Type" error={fieldError(createForm.formState.errors, "type")}>
              <Select
                aria-invalid={fieldError(createForm.formState.errors, "type") ? true : undefined}
                {...createForm.register("type")}
              >
                {["CASH", "BANK", "MOBILE_WALLET", "SAVINGS", "CREDIT_CARD", "OTHER"].map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Currency" error={fieldError(createForm.formState.errors, "currency")}>
              <Select
                aria-invalid={fieldError(createForm.formState.errors, "currency") ? true : undefined}
                {...createForm.register("currency")}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormFieldInput
              form={createForm}
              name="openingBalance"
              label="Opening balance"
              inputMode="decimal"
            />
            <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
              Create
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editAccount} onOpenChange={(o) => !o && setEditAccount(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Edit account</SheetTitle>
          </SheetHeader>
          <form
            className="mt-5 space-y-4"
            onSubmit={editForm.handleSubmit((d) => editAccount && update.mutate({ id: editAccount.id, data: d }))}
          >
            <FormFieldInput form={editForm} name="name" label="Name" />
            <FormField label="Type" error={fieldError(editForm.formState.errors, "type")}>
              <Select
                aria-invalid={fieldError(editForm.formState.errors, "type") ? true : undefined}
                {...editForm.register("type")}
              >
                {["CASH", "BANK", "MOBILE_WALLET", "SAVINGS", "CREDIT_CARD", "OTHER"].map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Currency" error={fieldError(editForm.formState.errors, "currency")}>
              <Select
                aria-invalid={fieldError(editForm.formState.errors, "currency") ? true : undefined}
                {...editForm.register("currency")}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status" error={fieldError(editForm.formState.errors, "isActive")}>
              <Select
                aria-invalid={fieldError(editForm.formState.errors, "isActive") ? true : undefined}
                {...editForm.register("isActive", { setValueAs: (v) => v === "true" })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </FormField>
            <Button type="submit" size="lg" className="w-full" disabled={update.isPending}>
              Save
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
