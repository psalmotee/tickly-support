"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  description: string;
  organizationId: string;
}

interface SubmitResponse {
  success: boolean;
  ticketNumber?: string;
  customerId?: string;
  error?: string;
  message?: string;
}

export default function WidgetTestPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    description: "",
    organizationId: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [response, setResponse] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchingOrgId, setFetchingOrgId] = useState(true);

  // Fetch organization ID on mount
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const response = await fetch("/api/admin/organizations/current");
        const data = await response.json();
        if (response.ok && data.organization) {
          setFormData((prev) => ({
            ...prev,
            organizationId: data.organization.id,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch organization ID:", err);
      } finally {
        setFetchingOrgId(false);
      }
    };

    fetchOrgId();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.organizationId.trim()) {
      setError("Organization ID is required for testing");
      return false;
    }
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    if (!formData.title.trim()) {
      setError("Issue title is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Issue description is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/public/tickets/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: formData.organizationId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          title: formData.title,
          description: formData.description,
        }),
      });

      const data: SubmitResponse = await res.json();

      if (data.success) {
        setResponse(data);
        setSubmitted(true);
        setFormData({
          ...formData,
          name: "",
          email: "",
          phone: "",
          company: "",
          title: "",
          description: "",
        });
      } else {
        setError(data.error || "Failed to submit ticket");
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An error occurred while submitting the form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/admin-dashboard"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to dashboard
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Test Widget
          </h1>
          <p className="text-lg text-slate-600">
            Test the public ticket submission widget. Enter your organization ID
            below.
          </p>
        </div>

        {/* Success Message */}
        {submitted && response && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">✓</div>
              <h2 className="text-xl font-semibold text-green-900">
                Ticket Submitted Successfully
              </h2>
            </div>
            <div className="space-y-3 bg-white p-4 rounded border border-green-100 mb-4">
              <div>
                <p className="text-sm text-slate-600">Ticket ID</p>
                <p className="text-2xl font-bold text-green-700">
                  {response.ticketNumber}
                </p>
              </div>
              {response.customerId && (
                <div>
                  <p className="text-sm text-slate-600">Customer ID</p>
                  <p className="font-mono text-sm text-slate-700">
                    {response.customerId}
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-4">{response.message}</p>
            <button
              onClick={() => {
                setSubmitted(false);
                setResponse(null);
              }}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Submit Another
            </button>
          </div>
        )}

        {/* Form */}
        {!submitted && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-lg p-8"
          >
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Organization ID */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label
                htmlFor="organizationId"
                className="block text-sm font-medium text-blue-900 mb-2"
              >
                Organization ID{" "}
                {!formData.organizationId && "(not auto-filled?)"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="organizationId"
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleChange}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-mono text-sm"
                  placeholder="e.g., f47ac10b-58cc-4372-a567-0e02b2c3d479"
                />
                {formData.organizationId && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.organizationId);
                      alert("Organization ID copied to clipboard!");
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Copy
                  </button>
                )}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {fetchingOrgId ? (
                  <>Loading your Organization ID...</>
                ) : formData.organizationId ? (
                  <>
                    ✓ Auto-filled from your admin account. This is your unique
                    organization identifier.
                  </>
                ) : (
                  <>
                    If not auto-filled: Go to admin dashboard → Settings →
                    Organization → copy the Organization ID from the settings
                    tab.
                  </>
                )}
              </p>
            </div>

            {/* Your Information Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Your Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                    placeholder="Your Company"
                  />
                </div>
              </div>
            </div>

            {/* Issue Information Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                Issue Details
              </h2>

              {/* Title */}
              <div className="mb-6">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Issue Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  placeholder="e.g., Payment not processing"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  placeholder="Please provide details about the issue..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Submitting...
                  </span>
                ) : (
                  "Submit Ticket"
                )}
              </button>
              <button
                type="reset"
                onClick={() => {
                  setFormData({
                    ...formData,
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    title: "",
                    description: "",
                  });
                  setError(null);
                }}
                disabled={loading}
                className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50 transition"
              >
                Clear
              </button>
            </div>

            {/* Help Text */}
            <p className="mt-6 text-sm text-slate-600">
              <span className="font-medium">*</span> Required fields
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
