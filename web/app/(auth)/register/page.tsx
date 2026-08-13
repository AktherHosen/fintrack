"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@fintrack/shared";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/select";
import { AuthShell } from "@/components/auth/auth-shell";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setError("");
    try {
      await api("/auth/register", { method: "POST", body: JSON.stringify(data) });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Start tracking in minutes">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Name">
          <Input autoComplete="name" {...form.register("name")} />
        </FormField>
        <FormField label="Email">
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </FormField>
        <FormField label="Password">
          <Input type="password" autoComplete="new-password" {...form.register("password")} />
        </FormField>
        {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full">
          Register
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Have an account?{" "}
        <Link href="/login" className="font-medium text-primary">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
