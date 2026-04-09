import { getCustomerTicketsPublic } from "@/lib/supabase-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  try {
    const { customerId } = await params;

    // Get customer portal data
    const portalData = await getCustomerTicketsPublic(customerId);

    if (!portalData) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: portalData,
    });
  } catch (error) {
    console.error("Error fetching customer portal:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
