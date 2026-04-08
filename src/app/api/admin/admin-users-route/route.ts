import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestSessionUser } from "@/lib/server-session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
);

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
    let countQuery = supabase.from("users").select("*", { count: "exact" });
    let dataQuery = supabase
      .from("users")
      .select("id, email, full_name, role")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query) {
      const searchTerm = `%${query}%`;
      countQuery = countQuery.or(
        `email.ilike.${searchTerm},full_name.ilike.${searchTerm}`,
      );
      dataQuery = dataQuery.or(
        `email.ilike.${searchTerm},full_name.ilike.${searchTerm}`,
      );
    }

    const { count: total } = await countQuery;
    const { data: userData, error } = await dataQuery;

    if (error) {
      console.error("[admin-users][GET] Error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const users = (userData || []).map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name || "Unknown User",
      role: user.role,
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
