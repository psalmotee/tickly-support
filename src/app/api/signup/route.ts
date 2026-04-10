// used

import { NextResponse } from "next/server";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "@/lib/form-validation";
import {
  getUserByEmail,
  createOrganization,
  createOrganizationMember,
  createUser,
} from "@/lib/supabase-helpers";
import { hashPassword } from "@/lib/password-utils";
import { supabaseAdmin } from "@/lib/supabase-client";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch((parseError: unknown) => {
      console.error("[signup] Invalid JSON body", { parseError });
      return null;
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const { fullName, email, password, organizationName } = body as {
      fullName?: unknown;
      email?: unknown;
      password?: unknown;
      organizationName?: unknown;
    };

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "fullName, email, and password are required.",
        },
        { status: 400 },
      );
    }

    if (typeof organizationName !== "string" || !organizationName.trim()) {
      return NextResponse.json(
        { success: false, error: "organizationName is required." },
        { status: 400 },
      );
    }

    // Validate inputs
    const nameError = validateName(fullName);
    if (nameError) {
      return NextResponse.json(
        { success: false, error: nameError },
        { status: 400 },
      );
    }

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

    const orgNameError = validateName(organizationName);
    if (orgNameError) {
      return NextResponse.json(
        { success: false, error: `Organization name: ${orgNameError}` },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 },
      );
    }

    // Hash password and create user using admin client
    const passwordHash = hashPassword(password);

    const { data: newUser, error: createError } = await supabaseAdmin
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        role: "admin",
      })
      .select()
      .single();

    if (createError || !newUser) {
      console.error("[signup] Failed to create user in Supabase", {
        email,
        error: createError,
      });
      return NextResponse.json(
        { success: false, error: "Failed to create account" },
        { status: 500 },
      );
    }

    // Create organization for the new user
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: organizationName.trim(),
        slug: generateUniqueSlugSync(organizationName),
        owner_id: newUser.id,
        is_active: true,
      })
      .select()
      .single();

    if (orgError || !newOrg) {
      console.error("[signup] Failed to create organization", {
        userId: newUser.id,
        error: orgError,
      });
      return NextResponse.json(
        { success: false, error: "Failed to create organization" },
        { status: 500 },
      );
    }

    // Create organization member entry (linking user to org as admin)
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: newOrg.id,
        user_id: newUser.id,
        role: "admin",
      })
      .select()
      .single();

    if (memberError) {
      console.error("[signup] Failed to create organization membership", {
        orgId: newOrg.id,
        userId: newUser.id,
        error: memberError,
      });
      return NextResponse.json(
        { success: false, error: "Failed to set up organization access" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
      },
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
      },
    });
  } catch (error) {
    console.error("[signup] Unexpected signup route error", { error });
    return NextResponse.json(
      { success: false, error: "Signup failed" },
      { status: 500 },
    );
  }
}

function generateUniqueSlugSync(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Note: This is synchronous and doesn't check uniqueness
  // In production, use the async findUniqueSlug helper after user creation
  // For now, append timestamp to ensure uniqueness
  return `${slug}-${Date.now().toString(36)}`;
}
