"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function verify() {
    if (!token) {
      setError("Missing verification token");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Verify email" subtitle="Invalid verification link">
        <p className="text-center text-sm text-muted-foreground">
          This link is missing a token. Request a new verification email from settings.
        </p>
        <Link href="/login" className="mt-5 block text-center text-sm font-medium text-primary">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Email verified" subtitle="You're all set">
        <p className="text-center text-sm text-muted-foreground">Redirecting to sign in…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verify email" subtitle="Confirm your email address">
      <Button size="lg" className="w-full" onClick={verify} disabled={loading}>
        {loading ? "Verifying…" : "Verify email"}
      </Button>
      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
        </div>
      }
    >
      <VerifyForm />
    </Suspense>
  );
}
