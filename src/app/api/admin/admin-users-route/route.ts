import { NextResponse } from "next/server";
import { manta } from "@/lib/manta-client";
import type { FetchAllRecordsParams } from "mantahq-sdk/dist/types/api";
import { getRequestSessionUser } from "@/lib/server-session";

interface QueryMeta {
  page: number;
  list: number;
  total: number;
  totalPages: number;
}

interface RawUserRecord {
  id?: string;
  user_id?: string;
  _id?: string;
  email?: string;
  fullName?: string;
  fullname?: string;
  first_name?: string;
  last_name?: string;
  role?: "admin" | "user";
}

function normalizeRole(role?: string): "admin" | "user" {
  const value = role?.toLowerCase().trim();
  if (value === "admin" || value === "amin" || value === "administrator") {
    return "admin";
  }

  return "user";
}

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

  try {
    const options: FetchAllRecordsParams = {
      table: "tickly-auth",
      fields: ["id", "fullname", "email", "role"],
      page,
      list: limit,
    };

    if (query) {
      options.search = {
        columns: ["fullname", "email"],
        query,
      };
    }

    const response = (await manta.fetchAllRecords(options)) as {
      status: boolean;
      data: RawUserRecord[];
      meta?: QueryMeta;
    };

    const users = (response.data || []).map((user) => ({
      id: user.id || user.user_id || "",
      email: user.email || "",
      fullName:
        user.fullName ||
        user.fullname ||
        (user.first_name
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : ""),
      role: normalizeRole(user.role),
    }));

    return NextResponse.json({
      success: true,
      users,
      meta: response.meta ?? null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
