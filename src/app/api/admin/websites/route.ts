// used
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getRequestSessionUser } from "@/lib/server-session";
import { supabaseAdmin } from "@/lib/supabase-client";
import {
  getOrganizationWebsites,
  getOrganizationById,
} from "@/lib/supabase-helpers";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      console.log("[websites][GET] No authenticated user");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log(
      "[websites][GET] Fetching organization for user:",
      sessionUser.id,
    );

    // Get user's first organization from organization_members
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", sessionUser.id)
      .limit(1);

    console.log("[websites][GET] User organizations query result:", {
      orgs,
      error: orgsError?.message || orgsError,
    });

    if (orgsError || !orgs || orgs.length === 0) {
      console.log("[websites][GET] User has no organizations");
      return NextResponse.json(
        { success: false, error: "User is not a member of any organization" },
        { status: 400 },
      );
    }

    const organizationId = orgs[0].organization_id;
    const userRole = orgs[0].role;

    console.log("[websites][GET] User organization:", {
      organizationId,
      userRole,
    });

    // Verify user is admin
    if (userRole !== "admin") {
      console.log("[websites][GET] User is not admin. Role:", userRole);
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Only admins can access websites.",
        },
        { status: 403 },
      );
    }

    console.log("[websites][GET] Fetching websites for org:", organizationId);
    const websites = await getOrganizationWebsites(organizationId);

    console.log("[websites][GET] Found websites:", {
      count: websites.length,
      websites: websites.map((w) => ({
        id: w.id,
        name: w.name,
        domain: w.domain,
        is_active: w.is_active,
      })),
    });
    return NextResponse.json({
      success: true,
      websites,
      total: websites.length,
    });
  } catch (error: unknown) {
    console.error("[websites][GET] Failed to fetch websites", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch websites" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const { name, domain, description, primary_color, logo_url } = body;

    // Validate required fields
    if (!name || !domain || !primary_color) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, domain, primary_color",
        },
        { status: 400 },
      );
    }

    // Get user's first organization from organization_members
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", sessionUser.id)
      .limit(1);

    if (orgsError || !orgs || orgs.length === 0) {
      return NextResponse.json(
        { success: false, error: "User is not a member of any organization" },
        { status: 400 },
      );
    }

    const organizationId = orgs[0].organization_id;
    const userRole = orgs[0].role;

    // Verify user is admin
    if (userRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Validate domain format (basic validation)
    const domainRegex =
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { success: false, error: "Invalid domain format" },
        { status: 400 },
      );
    }

    // Validate color format
    const colorRegex = /^#(?:[0-9a-f]{3}){1,2}$/i;
    if (!colorRegex.test(primary_color)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid primary_color format. Use hex color (#RRGGBB)",
        },
        { status: 400 },
      );
    }

    // Create website using supabaseAdmin to bypass RLS
    console.log("[websites][POST] Creating website with data:", {
      organization_id: organizationId,
      name: name.trim(),
      domain: domain.trim().toLowerCase(),
    });

    const widgetToken = randomUUID();

    const { data: website, error: createError } = await supabaseAdmin
      .from("websites")
      .insert([
        {
          organization_id: organizationId,
          name: name.trim(),
          domain: domain.trim().toLowerCase(),
          description: description ? description.trim() : null,
          logo_url: logo_url || null,
          primary_color,
          widget_token: widgetToken,
          api_key: null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("[websites][POST] Error creating website:", {
        code: createError.code,
        message: createError.message,
        details: createError.details,
      });

      // Check for duplicate domain/name errors
      if (createError.code === "23505") {
        // Unique constraint violation
        if (createError.message.includes("domain")) {
          return NextResponse.json(
            {
              success: false,
              error: "This domain already exists for your organization",
            },
            { status: 409 },
          );
        } else if (createError.message.includes("name")) {
          return NextResponse.json(
            {
              success: false,
              error: "This website name already exists for your organization",
            },
            { status: 409 },
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: createError.message || "Failed to create website",
        },
        { status: 500 },
      );
    }

    console.log("[websites][POST] Website created:", website);

    if (!website) {
      return NextResponse.json(
        { success: false, error: "Failed to create website" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        website,
        message: `Website created. Widget token: ${website.widget_token}`,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("[websites][POST] Failed to create website", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: "Failed to create website" },
      { status: 500 },
    );
  }
}
