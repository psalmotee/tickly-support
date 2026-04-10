import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-client";
import { getRequestSessionUser } from "@/lib/server-session";

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const query = searchParams.get("query") || "";
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    // Get user's organization
    const { data: memberships } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", sessionUser.id);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const orgId = memberships[0].organization_id;

    // Get organization members with user details
    let countQuery = supabaseAdmin
      .from("organization_members")
      .select("user_id", { count: "exact" })
      .eq("organization_id", orgId);

    let dataQuery = supabaseAdmin
      .from("organization_members")
      .select("user_id, role, users(id, email, full_name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query) {
      const searchTerm = `%${query}%`;
      countQuery = countQuery.or(
        `users.email.ilike.${searchTerm},users.full_name.ilike.${searchTerm}`,
      );
      dataQuery = dataQuery.or(
        `users.email.ilike.${searchTerm},users.full_name.ilike.${searchTerm}`,
      );
    }

    const { count: total } = await countQuery;
    const { data: memberData, error } = await dataQuery;

    if (error) {
      console.error("[admin-users][GET] Error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Map organization members to user format
    const users = (memberData || [])
      .filter((item: any) => item.users) // Filter out null user references
      .map((item: any) => ({
        id: item.users.id,
        email: item.users.email,
        fullName: item.users.full_name || "Unknown User",
        role: item.role,
      }));

    return NextResponse.json({
      success: true,
      users,
      meta: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    console.error("[admin-users][GET] Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
