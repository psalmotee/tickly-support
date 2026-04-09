// used
import { NextRequest, NextResponse } from "next/server";
import { createCustomerTicket, getCustomerById } from "@/lib/supabase-helpers";

export async function POST(request: NextRequest) {
  try {
    const { customerId, title, description, priority } = await request.json();

    // Validate inputs
    if (!customerId || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get customer to verify they exist and get organization ID
    const customer = await getCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Create the ticket
    const ticket = await createCustomerTicket(
      customerId,
      customer.organization_id,
      {
        title,
        description,
        priority: priority || "medium",
      },
    );

    if (!ticket) {
      return NextResponse.json(
        { error: "Failed to create ticket" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Error creating customer ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
