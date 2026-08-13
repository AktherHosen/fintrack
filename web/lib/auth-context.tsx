"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserDto } from "@fintrack/shared";
import { api } from "./api-client";
import { useLocale } from "./locale-context";
import { isAppLocale } from "@/i18n/config";

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setLocale } = useLocale();

  const refresh = useCallback(async () => {
    try {
      const me = await api<UserDto>("/auth/me");
      setUser(me);
      if (me.locale && isAppLocale(me.locale)) {
        setLocale(me.locale);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setLocale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
