"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatBDT, formatDate } from "@/lib/formatters";
import type { TransferDto } from "@fintrack/shared";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ListDivider, ListItem, PageHeader, Skeleton } from "@/components/ui/material";

export default function TransfersPage() {
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["transfers"],
    queryFn: () => api<TransferDto[]>("/transfers"),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Transfers" subtitle={`${transfers.length} transfers`} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : transfers.length === 0 ? (
        <EmptyState message="No transfers yet. Use + to record a transfer." />
      ) : (
        <Card>
          <CardContent className="py-1">
            {transfers.map((t, i) => (
              <div key={t.id}>
                {i > 0 && <ListDivider />}
                <ListItem
                  title={`${t.fromAccount?.name ?? "Account"} → ${t.toAccount?.name ?? "Account"}`}
                  subtitle={`${formatDate(t.transferDate)}${t.note ? ` · ${t.note}` : ""}`}
                  icon={ArrowRight}
                  iconClassName="border-primary/20 bg-primary/10 text-primary"
                  trailing={<span className="text-sm font-semibold">{formatBDT(t.amount)}</span>}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
