// used
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
} from "@/lib/supabase-helpers";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;
    const website = await getWebsiteById(id);

    if (!website) {
      return NextResponse.json(
        { success: false, error: "Website not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      website,
    });
  } catch (error: unknown) {
    console.error("[websites][id][GET] Failed to fetch website", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch website" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;

    // Verify website exists
    const website = await getWebsiteById(id);
    if (!website) {
      return NextResponse.json(
        { success: false, error: "Website not found" },
        { status: 404 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const { name, domain, description, logo_url, primary_color, is_active } =
      body;

    // Validate and prepare update payload
    const updatePayload: Record<string, any> = {};

    if (typeof name === "string") {
      updatePayload.name = name.trim();
    }

    if (typeof domain === "string") {
      const domainRegex =
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
      if (!domainRegex.test(domain)) {
        return NextResponse.json(
          { success: false, error: "Invalid domain format" },
          { status: 400 },
        );
      }
      updatePayload.domain = domain.trim().toLowerCase();
    }

    if (typeof description === "string") {
      updatePayload.description = description.trim();
    } else if (description === null) {
      updatePayload.description = null;
    }

    if (typeof logo_url === "string") {
      updatePayload.logo_url = logo_url;
    } else if (logo_url === null) {
      updatePayload.logo_url = null;
    }

    if (typeof primary_color === "string") {
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
      updatePayload.primary_color = primary_color;
    }

    if (typeof is_active === "boolean") {
      updatePayload.is_active = is_active;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    // Update website
    const updatedWebsite = await updateWebsite(id, updatePayload);

    if (!updatedWebsite) {
      return NextResponse.json(
        { success: false, error: "Failed to update website" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      website: updatedWebsite,
    });
  } catch (error: unknown) {
    console.error("[websites][id][PATCH] Failed to update website", { error });
    return NextResponse.json(
      { success: false, error: "Failed to update website" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;

    // Verify website exists
    const website = await getWebsiteById(id);
    if (!website) {
      return NextResponse.json(
        { success: false, error: "Website not found" },
        { status: 404 },
      );
    }

    // Soft delete
    const success = await deleteWebsite(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete website" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error: unknown) {
    console.error("[websites][id][DELETE] Failed to delete website", {
      error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to delete website" },
      { status: 500 },
    );
  }
}
