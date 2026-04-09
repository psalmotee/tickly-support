"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FormError } from "@/components/form-error";

interface InviteDetails {
  email: string;
  organization: {
    id: string;
    name: string;
  };
}

export function CustomerSignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate invite token
  useEffect(() => {
    if (!token) {
      setError("No invite token provided");
      setLoading(false);
      return;
    }

    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/customer-invites/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid or expired invite");
          setLoading(false);
          return;
        }

        setInviteDetails({
          email: data.email,
          organization: data.organization,
        });
        setEmail(data.email);
        setLoading(false);
      } catch (err) {
        setError("Failed to validate invite");
        setLoading(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!email || !fullName) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    if (!token) {
      setError("Invalid invite token");
      setSubmitting(false);
      return;
    }

    if (inviteDetails && email !== inviteDetails.email) {
      setError("Email must match the invite address");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/customers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          fullName,
          phone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setSubmitting(false);
        return;
      }

      setSuccess(true);

      // Redirect to customer dashboard after a short delay
      setTimeout(() => {
        router.push("/customer-dashboard");
      }, 1500);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Loading invite details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">
              Invalid Invite
            </h1>
            <p className="text-muted-foreground mb-6">
              {error || "This invite link is invalid or has expired."}
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              Welcome to {inviteDetails.organization.name}!
            </h1>
            <p className="text-muted-foreground">
              Your account has been created successfully. Redirecting to your
              dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create Your Account
          </h1>
          <p className="text-muted-foreground mb-6">
            Join{" "}
            <span className="font-semibold">
              {inviteDetails.organization.name}
            </span>{" "}
            to manage your support requests
          </p>

          {error && <FormError message={error} />}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={submitting}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must match the email address the invite was sent to
              </p>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={submitting}
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
