import { NextRequest, NextResponse } from "next/server";
import { acceptCustomerInvite } from "@/lib/supabase-helpers";

export async function POST(request: NextRequest) {
  try {
    const { token, email, fullName } = await request.json();

    // Validate inputs
    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Accept the invite and create customer
    const result = await acceptCustomerInvite(token, email);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to accept invite or create customer account" },
        { status: 400 },
      );
    }

    // Update full name if provided
    if (fullName) {
      const { supabase } = await import("@/lib/supabase-client");
      await supabase
        .from("customers")
        .update({ full_name: fullName })
        .eq("id", result.id);
    }

    // Create session response (similar to user session but for customer)
    const response = NextResponse.json({
      success: true,
      customer: {
        id: result.id,
        email: result.email,
        fullName: result.full_name,
        organizationId: result.organization_id,
        emailVerified: result.email_verified,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
      },
      sessionToken: result.sessionToken,
    });

    // Set customer session cookie
    response.cookies.set("customer_session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Customer signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
