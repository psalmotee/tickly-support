import { cookies } from "next/headers";
import { manta } from "@/lib/manta-client";

interface TokenPayload {
  sub?: string;
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
  fullName?: string;
  name?: string;
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

export async function getRequestSessionUser(): Promise<ApiSessionUser | null> {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    const email = payload?.email;
    if (!email) return null;

    const response = await manta.fetchAllRecords({
      table: "tickly-auth",
      where: { email },
      list: 1,
    });

    const userProfile =
      response.status && response.data.length > 0 ? response.data[0] : null;

    const userId =
      userProfile?.id ||
      userProfile?.user_id ||
      payload?.id ||
      payload?.userId ||
      payload?.sub ||
      email;

    const fullName =
      userProfile?.fullName ||
      userProfile?.fullname ||
      (userProfile?.first_name
        ? `${String(userProfile.first_name)} ${String(userProfile.last_name || "")}`.trim()
        : undefined) ||
      payload?.fullName ||
      payload?.name ||
      email;

    return {
      id: userId,
      email,
      fullName,
      role: normalizeRole(
        userProfile?.role ||
          userProfile?.userRole ||
          userProfile?.user_role ||
          payload?.role,
      ),
    };
  } catch (error: unknown) {
    console.error("[server-session] Failed to resolve request session user", {
      error,
    });
    return null;
  }
}
