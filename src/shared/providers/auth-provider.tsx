// used
"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { AuthSession } from "@/lib/auth-client";
import { protectRoute } from "@/lib/route-protection";

interface AuthContextType {
  session: AuthSession | null;
  loading: boolean;
  setSession: (session: AuthSession | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  setSession: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/check-auth", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
          setSession(data.session);
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle Role-Based Protection & Redirects
  useEffect(() => {
    if (loading) return;

    const redirectPath = protectRoute({ pathname, session });
    if (redirectPath && redirectPath !== pathname) {
      router.push(redirectPath);
    }
  }, [pathname, router, session, loading]);

  return (
    <AuthContext.Provider value={{ session, loading, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}
