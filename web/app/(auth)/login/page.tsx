"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FormFieldInput } from "@/components/ui/select";
import { AuthShell } from "@/components/auth/auth-shell";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  async function onSubmit(data: LoginInput) {
    setError("");
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify(data) });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Track your money with clarity">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormFieldInput form={form} name="email" label="Email" type="email" autoComplete="email" />
        <FormFieldInput
          form={form}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 w-full">
          Sign in
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="font-medium text-primary">
          Forgot password?
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
