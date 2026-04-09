import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  getCustomerWithTickets,
  getCustomerNotes,
  addCustomerNote,
  updateCustomer,
} from "@/lib/supabase-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; customerId: string }> },
) {
  try {
    const { id, customerId } = await params;

    const session = await getRequestSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const customer = await getCustomerWithTickets(customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    const notes = await getCustomerNotes(customerId);

    return NextResponse.json(
      {
        success: true,
        customer,
        notes,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; customerId: string }> },
) {
  try {
    const { id, customerId } = await params;

    const session = await getRequestSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === "add_note") {
      const note = await addCustomerNote(customerId, session.id, data.note);
      if (!note) {
        return NextResponse.json(
          { success: false, message: "Failed to add note" },
          { status: 400 },
        );
      }

      // Fetch updated notes
      const notes = await getCustomerNotes(customerId);

      return NextResponse.json(
        {
          success: true,
          message: "Note added successfully",
          note,
          notes,
        },
        { status: 201 },
      );
    }

    if (action === "update_customer") {
      const updated = await updateCustomer(customerId, data);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Failed to update customer" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Customer updated successfully",
          customer: updated,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
