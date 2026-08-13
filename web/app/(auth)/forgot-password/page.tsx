"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { forgotPasswordSchema } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/select";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [devUrl, setDevUrl] = useState("");
  const form = useForm<{ email: string }>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(data: { email: string }) {
    setMessage("");
    setDevUrl("");
    try {
      const res = await api<{ ok: boolean; devResetUrl?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setMessage("If that email exists, a reset link has been sent.");
      if (res.devResetUrl) setDevUrl(res.devResetUrl);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  }

  return (
    <AuthShell title="Forgot password" subtitle="We'll send you a reset link">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email">
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </FormField>
        <Button type="submit" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>
      {message && (
        <p className="mt-4 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{message}</p>
      )}
      {devUrl && (
        <p className="mt-2 break-all rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Dev reset URL:{" "}
          <Link href={devUrl.replace(/^https?:\/\/[^/]+/, "")} className="font-medium text-primary">
            {devUrl}
          </Link>
        </p>
      )}
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-primary">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
