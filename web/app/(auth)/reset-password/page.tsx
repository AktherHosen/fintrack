"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordSchema } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FormFieldInput } from "@/components/ui/select";
import { AuthShell } from "@/components/auth/auth-shell";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState("");
  const form = useForm<{ token: string; newPassword: string }>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { token, newPassword: "" },
  });

  async function onSubmit(data: { token: string; newPassword: string }) {
    setError("");
    try {
      await api("/auth/reset-password", { method: "POST", body: JSON.stringify(data) });
      router.push("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    }
  }

  return (
    <AuthShell title="Reset password" subtitle="Choose a strong new password">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...form.register("token")} />
        <FormFieldInput
          form={form}
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
        />
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 w-full">
          Update password
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-primary">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
