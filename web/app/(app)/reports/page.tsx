"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { api, apiRaw } from "@/lib/api-client";
import { formatBDT, monthRange } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/select";
import { ListDivider, ListItem, PageHeader, Skeleton, StatChip } from "@/components/ui/material";
import { Wallet } from "lucide-react";

interface ReportData {
  income: string;
  expenses: string;
  net: string;
  expenseByCategory: { categoryName: string; amount: string; percent: number }[];
  accountReport: { id: string; name: string; balance: string }[];
}

export default function ReportsPage() {
  const defaultRange = monthRange();
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [exportError, setExportError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", startDate, endDate],
    queryFn: () => api<ReportData>(`/reports/summary?startDate=${startDate}&endDate=${endDate}`),
  });

  const pieData =
    data?.expenseByCategory.map((c) => ({
      name: c.categoryName,
      value: parseFloat(c.amount),
    })) ?? [];

  async function download(path: string, filename: string) {
    setExportError("");
    try {
      const res = await apiRaw(`${path}?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Export failed — Pro plan required");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => download("/reports/export.csv", `transactions-${startDate}-${endDate}.csv`)}>
              CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={() => download("/reports/export.pdf", `transactions-${startDate}-${endDate}.pdf`)}>
              PDF
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField label="From">
          <DatePicker value={startDate} onChange={setStartDate} />
        </FormField>
        <FormField label="To">
          <DatePicker value={endDate} onChange={setEndDate} />
        </FormField>
      </div>

      {exportError && <p className="text-sm text-destructive">{exportError}</p>}

      <div className="grid grid-cols-3 gap-2">
        <StatChip label="Income" value={formatBDT(data.income)} tone="income" className="p-3" />
        <StatChip label="Spent" value={formatBDT(data.expenses)} tone="expense" className="p-3" />
        <StatChip label="Net" value={formatBDT(data.net)} tone="neutral" className="p-3" />
      </div>

      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatBDT(String(v))}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "var(--shadow-2)" }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account balances</CardTitle>
        </CardHeader>
        <CardContent className="py-1">
          {data.accountReport.map((a, i) => (
            <div key={a.id}>
              {i > 0 && <ListDivider />}
              <ListItem
                title={a.name}
                icon={Wallet}
                iconClassName="border-primary/20 bg-primary/10 text-primary"
                trailing={<span className="text-sm font-semibold">{formatBDT(a.balance)}</span>}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
