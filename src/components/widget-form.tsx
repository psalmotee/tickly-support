// used
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

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

  // Design system colors for embedded widgets
  const primaryColor = theme.primaryColor || "#3b82f6";
  const fontFamily =
    theme.fontFamily ||
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";
  const colors = {
    foreground: "#1f2937",
    mutedForeground: "#6b7280",
    border: "#e5e7eb",
    background: "#ffffff",
    cardBg: "#f9fafb",
    errorBg: "#fee2e2",
    errorFg: "#991b1b",
    successBg: "#dcfce7",
    successFg: "#166534",
  };

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
  };

  const renderCustomField = (field: CustomField) => {
    const value = customFieldValues[field.id] || "";
    const inputStyle = {
      width: "100%",
      padding: "10px 12px",
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      fontSize: "14px",
      boxSizing: "border-box" as const,
      fontFamily: "inherit",
      color: colors.foreground,
      backgroundColor: colors.background,
      transition: "border-color 0.2s",
    };

    const labelStyle = {
      display: "block" as const,
      marginBottom: "6px",
      fontSize: "13px",
      fontWeight: "600" as const,
      color: colors.foreground,
      letterSpacing: "0.3px",
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

    // Validate required custom fields
    for (const field of customFields) {
      if (field.required && !customFieldValues[field.id]?.trim()) {
        toast.error(`${field.label} is required`, {
          position: "top-right",
          autoClose: 3000,
        });
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

      // Success notification
      toast.success(
        "✓ Ticket submitted successfully! We'll get back to you soon.",
        {
          position: "top-right",
          autoClose: 4000,
        },
      );

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
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
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
        padding: "24px",
        backgroundColor: colors.background,
      }}
    >
      {submitted ? (
        <div
          style={{
            padding: "16px",
            backgroundColor: colors.successBg,
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              color: colors.successFg,
              marginTop: 0,
              marginBottom: "8px",
            }}
          >
            ✓ Ticket Submitted
          </h3>
          <p
            style={{
              color: colors.successFg,
              marginBottom: 0,
              fontSize: "14px",
            }}
          >
            We'll get back to you soon!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "4px",
              color: colors.foreground,
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            Get Help
          </h2>
          <p
            style={{
              marginBottom: "20px",
              color: colors.mutedForeground,
              fontSize: "14px",
            }}
          >
            We're here to help. Fill out the form below.
          </p>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="name"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: "0.3px",
              }}
            >
              Name <span style={{ color: primaryColor }}>*</span>
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
                padding: "10px 12px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
              placeholder="Your full name"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: "0.3px",
              }}
            >
              Email <span style={{ color: primaryColor }}>*</span>
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
                padding: "10px 12px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: colors.foreground,
                backgroundColor: colors.background,
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
                fontSize: "13px",
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: "0.3px",
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
                padding: "10px 12px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="subject"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: "0.3px",
              }}
            >
              Subject <span style={{ color: primaryColor }}>*</span>
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
                padding: "10px 12px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: colors.foreground,
                backgroundColor: colors.background,
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
                fontSize: "13px",
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: "0.3px",
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
                padding: "10px 12px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
            >
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Something isn't working</option>
              <option value="high">High - Urgent issue</option>
              <option value="critical">Critical - System down</option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="message"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: "600",
                color: colors.foreground,
                letterSpacing: "0.3px",
              }}
            >
              Message <span style={{ color: primaryColor }}>*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "inherit",
                color: colors.foreground,
                backgroundColor: colors.background,
                resize: "vertical",
              }}
              placeholder="Please describe your issue in detail..."
            />
          </div>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <div
              style={{
                marginBottom: "20px",
                paddingTop: "16px",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: colors.foreground,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Additional Information
              </h3>
              {customFields.map((field) => renderCustomField(field))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: primaryColor,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
              letterSpacing: "0.3px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Submitting..." : "Submit Support Ticket"}
          </button>
        </form>
      )}
    </div>
  );
}
