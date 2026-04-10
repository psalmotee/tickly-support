// used

import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password-utils";
import { validateEmail, validatePassword } from "@/lib/form-validation";
import { supabaseAdmin } from "@/lib/supabase-client";

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

    // Validate inputs
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400 },
      );
    }

    // Get user from Supabase using admin client (bypasses RLS)
    const { data: userProfile, error: userError } = (await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single()) as any;

    if (userError || !userProfile) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = verifyPassword(password, userProfile.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Get user's organization membership to get their org-specific role
    const { data: orgMembers, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("user_id", userProfile.id);

    let orgRole = userProfile.role || "user"; // Default to user if no org membership
    let firstOrgId = null;

    if (!memberError && orgMembers && orgMembers.length > 0) {
      // Use the first organization membership (most common: users have one org)
      orgRole = normalizeRole(orgMembers[0].role);
      firstOrgId = orgMembers[0].organization_id;
    }

    // Create JWT payload (can be extended later with real JWT library)
    const tokenPayload = {
      sub: userProfile.id,
      email: userProfile.email,
      role: orgRole,
      organizationId: firstOrgId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    // For now, we'll use a simple base64url encoded JWT representation
    // In production, use the jsonwebtoken package
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString(
      "base64url",
    );

    const response = NextResponse.json({
      success: true,
      session: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          fullName: userProfile.full_name,
          role: orgRole,
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
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.full_name,
      role: orgRole,
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
