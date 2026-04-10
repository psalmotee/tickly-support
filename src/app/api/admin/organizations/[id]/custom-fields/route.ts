// used
import { NextRequest, NextResponse } from "next/server";
import {
  getOrganizationCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
} from "@/lib/supabase-helpers";
import { getRequestSessionUser } from "@/lib/server-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: organizationId } = await params;

    const fields = await getOrganizationCustomFields(organizationId);

    return NextResponse.json({
      success: true,
      fields,
    });
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: organizationId } = await params;
    const session = await getRequestSessionUser();

    if (!session?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      name,
      field_type,
      label,
      placeholder,
      required,
      options,
      display_order,
    } = body;

    if (!name || !field_type || !label) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const field = await createCustomField(organizationId, {
      name,
      field_type,
      label,
      placeholder: placeholder || null,
      required: required || false,
      options: options || null,
      display_order: display_order || 0,
      is_active: true,
    });

    if (!field) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create field - check server logs",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        field,
      },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating custom field:", errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: `Failed to create field: ${errorMessage}`,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: organizationId } = await params;
    const session = await getRequestSessionUser();

    if (!session?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { fieldId, ...updates } = body;

    if (!fieldId) {
      return NextResponse.json(
        { success: false, message: "Missing fieldId" },
        { status: 400 },
      );
    }

    const field = await updateCustomField(organizationId, fieldId, updates);

    if (!field) {
      return NextResponse.json(
        { success: false, message: "Failed to update field" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      field,
    });
  } catch (error) {
    console.error("Error updating custom field:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: organizationId } = await params;
    const session = await getRequestSessionUser();

    if (!session?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");

    if (!fieldId) {
      return NextResponse.json(
        { success: false, message: "Missing fieldId" },
        { status: 400 },
      );
    }

    const success = await deleteCustomField(organizationId, fieldId);

    if (!success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete field" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
