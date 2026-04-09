// used
"use client";

import { useState, useEffect } from "react";

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

interface WidgetFormProps {
  websiteId: string;
  organizationId?: string;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
  onSubmitSuccess?: () => void;
}

export function WidgetForm({
  websiteId,
  organizationId,
  theme = {},
  onSubmitSuccess,
}: WidgetFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    priority: "medium" as const,
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string>
  >({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const primaryColor = theme.primaryColor || "#3b82f6";
  const fontFamily = theme.fontFamily || "system-ui, -apple-system, sans-serif";

  // Load custom fields for the organization
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!organizationId) return;

      try {
        setLoadingFields(true);
        const response = await fetch(
          `/api/admin/organizations/${organizationId}/custom-fields`,
        );

        if (response.ok) {
          const data = await response.json();
          setCustomFields(data.fields || []);

          // Initialize custom field values
          const initialValues: Record<string, string> = {};
          (data.fields || []).forEach((field: CustomField) => {
            initialValues[field.id] = "";
          });
          setCustomFieldValues(initialValues);
        }
      } catch (err) {
        console.error("Failed to load custom fields:", err);
      } finally {
        setLoadingFields(false);
      }
    };

    loadCustomFields();
  }, [organizationId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.id] || "";
    const inputStyle = {
      width: "100%",
      padding: "10px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "14px",
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
    };

    const labelStyle = {
      display: "block" as const,
      marginBottom: "6px",
      fontSize: "14px",
      fontWeight: "500" as const,
      color: "#374151",
    };

    if (field.field_type === "select") {
      return (
        <div key={field.id} style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>
            {field.label}
            {field.required && <span style={{ color: "#dc2626" }}> *</span>}
          </label>
          <select
            value={value}
            onChange={(e) =>
              setCustomFieldValues({
                ...customFieldValues,
                [field.id]: e.target.value,
              })
            }
            required={field.required}
            style={inputStyle}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.field_type === "textarea") {
      return (
        <div key={field.id} style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>
            {field.label}
            {field.required && <span style={{ color: "#dc2626" }}> *</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) =>
              setCustomFieldValues({
                ...customFieldValues,
                [field.id]: e.target.value,
              })
            }
            placeholder={field.placeholder || ""}
            required={field.required}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" as const }}
          />
        </div>
      );
    }

    return (
      <div key={field.id} style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>
          {field.label}
          {field.required && <span style={{ color: "#dc2626" }}> *</span>}
        </label>
        <input
          type={field.field_type}
          value={value}
          onChange={(e) =>
            setCustomFieldValues({
              ...customFieldValues,
              [field.id]: e.target.value,
            })
          }
          placeholder={field.placeholder || ""}
          required={field.required}
          style={inputStyle}
        />
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required custom fields
    for (const field of customFields) {
      if (field.required && !customFieldValues[field.id]?.trim()) {
        setError(`${field.label} is required`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/v1/public/widget/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteId,
          ...formData,
          customFieldValues,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit ticket");
      }

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        priority: "medium",
      });

      const resetCustomFields: Record<string, string> = {};
      customFields.forEach((field) => {
        resetCustomFields[field.id] = "";
      });
      setCustomFieldValues(resetCustomFields);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily,
        maxWidth: "500px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {submitted ? (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#dcfce7",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h3 style={{ color: "#166534", marginTop: 0 }}>✓ Ticket Submitted</h3>
          <p style={{ color: "#15803d", marginBottom: 0 }}>
            We'll get back to you soon!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 style={{ marginTop: 0, color: primaryColor }}>Get Help</h2>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="name"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder="Your name"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder="your@email.com"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="phone"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder="Optional"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="subject"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Subject
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              placeholder="What do you need help with?"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="priority"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="message"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#374151",
              }}
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                resize: "vertical",
              }}
              placeholder="Describe your issue in detail..."
            />
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: primaryColor,
                }}
              >
                Additional Information
              </h3>
              {customFields.map((field) => renderCustomField(field))}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: primaryColor,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      )}
    </div>
  );
}
