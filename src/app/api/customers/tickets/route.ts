// used
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCustomerTickets } from "@/lib/supabase-helpers";

export async function GET(request: NextRequest) {
  try {
    // Get customer ID from session token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("customer_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, we'll get the customer ID from a query param
    // In a full implementation, you'd validate the session token
    const customerId = request.nextUrl.searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    const tickets = await getCustomerTickets(customerId);

    return NextResponse.json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Error fetching customer tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
