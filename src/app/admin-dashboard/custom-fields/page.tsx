// used
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CustomField {
  id: string;
  name: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  display_order: number;
}

export default function CustomFieldsPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    field_type: "text",
    label: "",
    placeholder: "",
    required: false,
    options: "",
    display_order: 0,
  });

  useEffect(() => {
    loadFields();
  }, [orgId]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/organizations/${orgId}/custom-fields`,
      );

      if (!response.ok) {
        throw new Error("Failed to load fields");
      }

      const data = await response.json();
      setFields(data.fields || []);
      setError("");
    } catch (err) {
      console.error("Error loading fields:", err);
      setError("Failed to load fields");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      field_type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: "",
      display_order: 0,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const options = formData.options
        ? formData.options.split("\n").filter((o) => o.trim())
        : null;

      const payload = {
        name: formData.name,
        field_type: formData.field_type,
        label: formData.label,
        placeholder: formData.placeholder || null,
        required: formData.required,
        options,
        display_order: parseInt(String(formData.display_order)) || 0,
      };

      if (editingId) {
        // Update
        const response = await fetch(
          `/api/admin/organizations/${orgId}/custom-fields`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fieldId: editingId, ...payload }),
          },
        );

        if (!response.ok) throw new Error("Failed to update field");

        const data = await response.json();
        setFields(fields.map((f) => (f.id === editingId ? data.field : f)));
      } else {
        // Create
        const response = await fetch(
          `/api/admin/organizations/${orgId}/custom-fields`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) throw new Error("Failed to create field");

        const data = await response.json();
        setFields([...fields, data.field]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field?")) return;

    try {
      const response = await fetch(
        `/api/admin/organizations/${orgId}/custom-fields?fieldId=${fieldId}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to delete field");

      setFields(fields.filter((f) => f.id !== fieldId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete field");
    }
  };

  const handleEdit = (field: CustomField) => {
    setFormData({
      name: field.name,
      field_type: field.field_type,
      label: field.label,
      placeholder: field.placeholder || "",
      required: field.required,
      options: field.options ? field.options.join("\n") : "",
      display_order: field.display_order,
    });
    setEditingId(field.id);
    setIsAdding(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin-dashboard"
            className="text-sm text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Custom Fields</h1>
          <p className="text-muted-foreground mt-2">
            Define custom fields for your support tickets
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Field List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Your Fields
              </h2>
              {!isAdding && (
                <button
                  onClick={() => {
                    resetForm();
                    setIsAdding(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  + Add Field
                </button>
              )}
            </div>

            {fields.length === 0 && !isAdding ? (
              <div className="text-center py-12 rounded-lg border border-dashed border-border">
                <p className="text-muted-foreground">No custom fields yet</p>
                <button
                  onClick={() => {
                    resetForm();
                    setIsAdding(true);
                  }}
                  className="mt-4 text-blue-600 hover:underline text-sm"
                >
                  Create your first field
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-lg border border-border bg-card hover:border-blue-400 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {field.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {field.name} • {field.field_type}
                          {field.required ? " (required)" : ""}
                        </p>
                        {field.placeholder && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Placeholder: {field.placeholder}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(field)}
                          className="px-3 py-1 text-sm rounded hover:bg-muted transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(field.id)}
                          className="px-3 py-1 text-sm rounded hover:bg-red-50 text-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          {isAdding && (
            <div className="lg:col-span-1 p-6 rounded-lg border border-border bg-card sticky top-4 h-fit">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {editingId ? "Edit Field" : "Add New Field"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Field Name (internal)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    placeholder="e.g., ticket_category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Label (visible to users)
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    placeholder="e.g., Ticket Category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Field Type
                  </label>
                  <select
                    value={formData.field_type}
                    onChange={(e) =>
                      setFormData({ ...formData, field_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="number">Number</option>
                    <option value="textarea">Text Area</option>
                    <option value="select">Select (Dropdown)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={formData.placeholder}
                    onChange={(e) =>
                      setFormData({ ...formData, placeholder: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    placeholder="Optional"
                  />
                </div>

                {formData.field_type === "select" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Options (one per line)
                    </label>
                    <textarea
                      value={formData.options}
                      onChange={(e) =>
                        setFormData({ ...formData, options: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono"
                      rows={4}
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) =>
                      setFormData({ ...formData, required: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <label className="text-sm text-foreground">
                    Required field
                  </label>
                </div>

                {error && (
                  <div className="p-3 rounded bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
