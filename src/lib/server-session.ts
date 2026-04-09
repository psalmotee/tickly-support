// used
import { cookies } from "next/headers";
import { getUserByEmail } from "@/lib/supabase-helpers";

interface TokenPayload {
  sub?: string;
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  fullName?: string;
  name?: string;
}

interface SessionCookiePayload {
  id?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

export interface ApiSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
}

function normalizeRole(role?: string): "admin" | "user" {
  const value = role?.toLowerCase().trim();
  if (value === "admin" || value === "administrator") {
    return "admin";
  }

  return "user";
}

function decodeJwtPayload(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(normalized, "base64").toString("utf-8");
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

function decodeSessionCookie(value: string): SessionCookiePayload | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf-8");
    return JSON.parse(json) as SessionCookiePayload;
  } catch {
    return null;
  }
}

export async function getRequestSessionUser(): Promise<ApiSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const sessionCookieRaw = cookieStore.get("session_user")?.value;
    const sessionCookie =
      typeof sessionCookieRaw === "string" && sessionCookieRaw
        ? decodeSessionCookie(sessionCookieRaw)
        : null;

    if (!token) return null;

    const payload = decodeJwtPayload(token);
    const email = payload?.email || sessionCookie?.email;
    if (!email) return null;

    const userProfile = await getUserByEmail(email);

    const userId =
      userProfile?.id ||
      sessionCookie?.id ||
      payload?.id ||
      payload?.userId ||
      payload?.sub ||
      email;

    const fullName =
      userProfile?.full_name ||
      sessionCookie?.fullName ||
      payload?.fullName ||
      payload?.name ||
      email;

    return {
      id: userId,
      email,
      fullName,
      role: normalizeRole(
        userProfile?.role || sessionCookie?.role || payload?.role,
      ),
    };
  } catch (error: unknown) {
    console.error("[server-session] Failed to resolve request session user", {
      error,
    });
    return null;
  }
}
