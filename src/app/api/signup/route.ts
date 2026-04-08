import { NextResponse } from "next/server";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "@/lib/form-validation";
import { getUserByEmail } from "@/lib/supabase-helpers";
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

    const { fullName, email, password } = body as {
      fullName?: unknown;
      email?: unknown;
      password?: unknown;
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
        role: "user",
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[signup] Unexpected signup route error", { error });
    return NextResponse.json(
      { success: false, error: "Signup failed" },
      { status: 500 },
    );
  }
}
