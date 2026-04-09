// used
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  getOrganizationWebsites,
  createWebsite,
  getOrganizationById,
} from "@/lib/supabase-helpers";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (sessionUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Extract organization ID from query params
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: "organizationId query parameter required" },
        { status: 400 },
      );
    }

    // Verify organization exists and user has access
    const org = await getOrganizationById(organizationId);
    if (!org) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 },
      );
    }

    // TODO: Add proper org membership check once user-org mapping is set up
    // For now, admins can access any org

    const websites = await getOrganizationWebsites(organizationId);

    return NextResponse.json({
      success: true,
      websites,
      total: websites.length,
    });
  } catch (error: unknown) {
    console.error("[websites][GET] Failed to fetch websites", { error });
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

    if (sessionUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const {
      organizationId,
      name,
      domain,
      description,
      primary_color,
      logo_url,
    } = body;

    // Validate required fields
    if (!organizationId || !name || !domain || !primary_color) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: organizationId, name, domain, primary_color",
        },
        { status: 400 },
      );
    }

    // Verify organization exists
    const org = await getOrganizationById(organizationId);
    if (!org) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 },
      );
    }

    // Validate domain format (basic validation)
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
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
        { success: false, error: "Invalid primary_color format. Use hex color (#RRGGBB)" },
        { status: 400 },
      );
    }

    // Create website
    const website = await createWebsite({
      organization_id: organizationId,
      name: name.trim(),
      domain: domain.trim().toLowerCase(),
      description: description ? description.trim() : null,
      logo_url: logo_url || null,
      primary_color,
      api_key: null,
      is_active: true,
    });

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
    console.error("[websites][POST] Failed to create website", { error });
    return NextResponse.json(
      { success: false, error: "Failed to create website" },
      { status: 500 },
    );
  }
}
