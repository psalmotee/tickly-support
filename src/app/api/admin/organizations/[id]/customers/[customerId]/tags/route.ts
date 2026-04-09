import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  addTagToCustomer,
  removeTagFromCustomer,
  getCustomersWithTag,
  getOrganizationTags,
  bulkAddTagToCustomers,
} from "@/lib/supabase-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const { id, customerId } = await params;

    const session = await getRequestSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const action = request.nextUrl.searchParams.get("action");

    if (action === "org_tags") {
      // Get all tags in organization
      const tags = await getOrganizationTags(id);
      return NextResponse.json(
        { success: true, tags },
        { status: 200 }
      );
    }

    if (action === "by_tag") {
      // Get customers with specific tag
      const tag = request.nextUrl.searchParams.get("tag") || "";
      const customers = await getCustomersWithTag(id, tag);
      return NextResponse.json(
        { success: true, customers },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const { id, customerId } = await params;

    const session = await getRequestSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, tag, tags } = body;

    if (action === "add_tag") {
      const success = await addTagToCustomer(customerId, tag);
      if (!success) {
        return NextResponse.json(
          { success: false, message: "Failed to add tag" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Tag added successfully" },
        { status: 201 }
      );
    }

    if (action === "remove_tag") {
      const success = await removeTagFromCustomer(customerId, tag);
      if (!success) {
        return NextResponse.json(
          { success: false, message: "Failed to remove tag" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: true, message: "Tag removed successfully" },
        { status: 200 }
      );
    }

    if (action === "bulk_add_tag") {
      if (!Array.isArray(tags) || !tag) {
        return NextResponse.json(
          { success: false, message: "Invalid bulk add parameters" },
          { status: 400 }
        );
      }

      const count = await bulkAddTagToCustomers(tags, tag);

      return NextResponse.json(
        {
          success: true,
          message: `Tag added to ${count} customers`,
          count,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error managing tags:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
