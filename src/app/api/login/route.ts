import { NextResponse } from "next/server";
import { manta } from "@/lib/manta-client";

const MANTA_BASE_URL = process.env.MANTA_BASE_URL;

function normalizeRole(role?: string): "admin" | "user" {
  const value = role?.toLowerCase().trim();
  if (value === "admin" || value === "administrator") {
    return "admin";
  }

  return "user";
}

function encodeSessionCookie(session: {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
}): string {
  try {
    return Buffer.from(JSON.stringify(session), "utf-8").toString("base64url");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch((parseError: unknown) => {
      console.error("[login] Invalid JSON body", { parseError });
      return null;
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const { email, password } = body as {
      email?: unknown;
      password?: unknown;
    };

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (!MANTA_BASE_URL) {
      console.error("[login] Missing MANTA_BASE_URL environment variable");
      return NextResponse.json(
        { success: false, error: "Server configuration error." },
        { status: 500 },
      );
    }

    const mantaRes = await fetch(`${MANTA_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await mantaRes.json().catch((parseError: unknown) => {
      console.error("[login] Failed to parse login response JSON", {
        parseError,
      });
      return {} as Record<string, unknown>;
    });

    if (!mantaRes.ok) {
      const errorMessage =
        typeof (data as { message?: unknown }).message === "string"
          ? ((data as { message: string }).message ?? "Login failed")
          : "Login failed";

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: mantaRes.status },
      );
    }

    const token = (data as { token?: unknown }).token;
    if (typeof token !== "string" || !token) {
      console.error("[login] Missing token in login response", { data });
      return NextResponse.json(
        { success: false, error: "Login failed. Invalid server response." },
        { status: 502 },
      );
    }

    const profileRes = await manta.fetchAllRecords({
      table: "tickly-auth",
      where: { email },
      list: 1,
    });

    const userProfile =
      profileRes.status && profileRes.data.length > 0
        ? profileRes.data[0]
        : null;
    const userFromResponse = (data as { user?: Record<string, unknown> }).user;
    const userRole = normalizeRole(
      userProfile?.role ||
        (userFromResponse?.role as string | undefined) ||
        ((data as { role?: string }).role ?? undefined),
    );
    const userId = userProfile?.id || userProfile?.user_id || email;
    const fullName =
      userProfile?.fullName || userProfile?.fullname
        ? userProfile.fullName || userProfile.fullname
        : userProfile?.first_name
          ? `${userProfile.first_name} ${userProfile.last_name || ""}`.trim()
          : data.fullName || email;

    const response = NextResponse.json({
      success: true,
      session: {
        user: {
          id: userId,
          email: email,
          fullName,
          role: userRole,
        },
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const sessionCookieValue = encodeSessionCookie({
      id: userId,
      email,
      fullName,
      role: userRole,
    });

    if (sessionCookieValue) {
      response.cookies.set("session_user", sessionCookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error: unknown) {
    console.error("[login] Unexpected login route error", { error });
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 },
    );
  }
}
