"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCategorySchema } from "@fintrack/shared";
import { api, ApiError } from "@/lib/api-client";
import type { CategoryDto, SubscriptionDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, FormField } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState, ListDivider, ListItem, PageHeader, Skeleton } from "@/components/ui/material";
import { Tags } from "lucide-react";
import { z } from "zod";

const formSchema = createCategorySchema;
type FormInput = z.infer<typeof formSchema>;

export default function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const qc = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api<SubscriptionDto | null>("/subscription"),
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories", typeFilter],
    queryFn: () => api<CategoryDto[]>(`/categories?type=${typeFilter}`),
  });

  const customCount = subscription?.usage?.categories ?? 0;
  const customLimit = subscription?.limits?.categories;
  const atCustomLimit = typeof customLimit === "number" && customCount >= customLimit;

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "EXPENSE", name: "" },
  });

  const create = useMutation({
    mutationFn: (data: FormInput) =>
      api("/categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["subscription"] });
      setOpen(false);
      setError("");
      form.reset({ type: typeFilter, name: "" });
    },
    onError: (e) => {
      setError(e instanceof ApiError ? e.message : "Could not create category");
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        subtitle={
          typeof customLimit === "number"
            ? `${customCount} custom · ${customLimit} max`
            : `${categories.length} categories`
        }
        action={
          <Button
            size="sm"
            onClick={() => {
              setError("");
              form.setValue("type", typeFilter);
              setOpen(true);
            }}
            disabled={atCustomLimit}
          >
            Add
          </Button>
        }
      />

      {atCustomLimit && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">
            Custom category limit reached ({customCount}/{customLimit}). Upgrade to Pro for unlimited
            categories.
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={typeFilter === t ? "default" : "secondary"}
            onClick={() => setTypeFilter(t)}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : categories.length === 0 ? (
        <EmptyState message="No categories yet." />
      ) : (
        <Card>
          <CardContent className="py-1">
            {categories.map((c, i) => (
              <div key={c.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={c.name}
                  subtitle={c.isDefault ? "Default" : "Custom"}
                  icon={Tags}
                  iconClassName="border-primary/20 bg-primary/10 text-primary"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>New custom category</SheetTitle>
          </SheetHeader>
          <form className="mt-5 space-y-4" onSubmit={form.handleSubmit((d) => create.mutate(d))}>
            <p className="text-sm text-muted-foreground">
              Default categories are always included. Custom categories count toward your plan limit.
            </p>
            <FormField label="Name">
              <Input {...form.register("name")} placeholder="e.g. Groceries" />
            </FormField>
            <FormField label="Type">
              <Select {...form.register("type")}>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </Select>
            </FormField>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
              Create
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
