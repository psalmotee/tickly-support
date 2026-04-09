// used
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormError } from "@/components/form-error";

export default function CustomerSubmitTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!title || !description) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    try {
      const customerId = localStorage.getItem("customerId");
      if (!customerId) {
        setError("Customer information not found");
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/customers/submit-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          title,
          description,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit ticket");
        setSubmitting(false);
        return;
      }

      setSuccess(true);

      // Clear form
      setTitle("");
      setDescription("");
      setPriority("medium");

      // Redirect after success
      setTimeout(() => {
        router.push("/customer/tickets");
      }, 1500);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Ticket Created!
            </h1>
            <p className="text-muted-foreground">
              Your support ticket has been submitted. Our team will review it
              shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to your tickets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/customer/tickets"
            className="text-primary hover:underline mb-4 inline-flex items-center gap-2"
          >
            ← Back to Tickets
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create a Support Ticket
          </h1>
          <p className="text-muted-foreground">
            Describe your issue and we'll help you as soon as possible
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-border bg-card p-8">
          {error && <FormError message={error} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Subject
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={submitting}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                disabled={submitting}
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as "low" | "medium" | "high" | "urgent",
                  )
                }
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={submitting}
              >
                <option value="low">Low - General inquiry</option>
                <option value="medium">Medium - Standard issue</option>
                <option value="high">High - Urgent issue</option>
                <option value="urgent">Urgent - Severe problem</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating Ticket..." : "Create Ticket"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground mt-6 text-center">
            We typically respond to tickets within 24 hours during business days
          </p>
        </div>
      </div>
    </div>
  );
}
