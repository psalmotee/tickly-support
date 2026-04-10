import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import { supabaseAdmin } from "@/lib/supabase-client";
import { hashPassword } from "@/lib/password-utils";
import { sendTeamMemberInvitation } from "@/lib/email-service";

/**
 * POST /api/admin/organizations/invite-member
 * Invite a new team member to the organization
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[invite-member] Starting invitation process");

    const user = await getRequestSessionUser();
    if (!user) {
      console.log("[invite-member] No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, organizationId } = body;

    console.log("[invite-member] Request body:", {
      email,
      role,
      organizationId,
      userId: user.id,
    });

    if (!email || !role || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields: email, role, organizationId" },
        { status: 400 },
      );
    }

    if (!["admin", "agent", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin', 'agent', or 'viewer'" },
        { status: 400 },
      );
    }

    // Verify user is admin in this organization
    const { data: member, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member || member.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Only admins can invite members" },
        { status: 403 },
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      // User exists, check if already in organization
      const { data: existingMember } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "This user is already a member of the organization" },
          { status: 409 },
        );
      }

      // Add to organization
      const { error: addError } = await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: existingUser.id,
          role,
        });

      if (addError) {
        console.error("Error adding user to organization:", addError);
        return NextResponse.json(
          { error: "Failed to add member to organization" },
          { status: 500 },
        );
      }

      // Fetch organization name for email
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .single();

      // Fetch inviter name for email
      const { data: inviter } = await supabaseAdmin
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Send invitation email to existing user
      console.log(
        "[invite-member] Sending invitation email for existing user",
        {
          email: existingUser.email,
          organizationName: org?.name,
          inviterName: inviter?.full_name,
        },
      );

      const emailResult = await sendTeamMemberInvitation(
        existingUser.email,
        org?.name || "Your Organization",
        inviter?.full_name || "A team member",
        "See your organization admin for password reset",
      );

      console.log("[invite-member] Email send result:", emailResult);

      return NextResponse.json({
        success: true,
        message: "User added to organization and invitation email sent",
        user: existingUser,
      });
    }

    // Create new user with temporary password
    console.log("[invite-member] Creating new user account for:", email);
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
    const passwordHash = hashPassword(tempPassword);

    const { data: newUser, error: createError } = await supabaseAdmin
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: email.split("@")[0],
        role: "user", // Default role, organizational role is in organization_members
      })
      .select("id")
      .single();

    if (createError || !newUser) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 },
      );
    }

    // Add to organization
    const { error: addError } = await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: newUser.id,
        role,
      });

    if (addError) {
      console.error("Error adding user to organization:", addError);
      return NextResponse.json(
        { error: "Failed to add member to organization" },
        { status: 500 },
      );
    }

    // Fetch organization name for email
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    // Fetch inviter name for email
    const { data: inviter } = await supabaseAdmin
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Send invitation email with temporary password
    console.log("[invite-member] Sending invitation email for new user", {
      email,
      organizationName: org?.name,
      inviterName: inviter?.full_name,
      tempPasswordGenerated: !!tempPassword,
    });

    const emailResult = await sendTeamMemberInvitation(
      email,
      org?.name || "Your Organization",
      inviter?.full_name || "A team member",
      tempPassword,
    );

    console.log("[invite-member] Email send result:", emailResult);

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      user: {
        id: newUser.id,
        email,
        role,
      },
    });
  } catch (error) {
    console.error("[invite-member] Unexpected error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 },
    );
  }
}
