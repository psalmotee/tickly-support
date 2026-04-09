import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  getOrganizationCustomers,
  searchCustomers,
} from "@/lib/supabase-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: organizationId } = await params;

    const session = await getRequestSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const searchQuery = request.nextUrl.searchParams.get("search") || "";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

    let result;

    if (searchQuery.trim()) {
      // Search customers
      result = await searchCustomers(organizationId, searchQuery);
    } else {
      // Get all customers
      result = await getOrganizationCustomers(organizationId, {
        limit,
        offset,
        sortBy: "created_at",
        order: "desc",
      });
    }

    return NextResponse.json(
      {
        success: true,
        customers: result || [],
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
