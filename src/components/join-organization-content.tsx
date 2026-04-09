"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { FormError } from "@/components/form-error";

interface InviteDetails {
  email: string;
  role: "admin" | "agent" | "viewer";
  organizationName: string;
  sendersName?: string;
}

export function JoinOrganizationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setSession } = useAuth();
  const token = searchParams.get("token");

  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(
    null,
  );
  const [email, setEmail] = useState("");
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("No invite token provided");
      setLoading(false);
      return;
    }

    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/invites/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid or expired invite");
          setLoading(false);
          return;
        }

        setInviteDetails({
          email: data.invite.email,
          role: data.invite.role,
          organizationName: data.organization.name,
          sendersName: data.organization.name,
        });

        setEmail(data.invite.email);
        setLoading(false);
      } catch (err) {
        setError("Failed to validate invite. Please try again later.");
        setLoading(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptingInvite(true);
    setError("");

    if (!email || !token) {
      setError("Invalid invite or email");
      setAcceptingInvite(false);
      return;
    }

    if (inviteDetails && email !== inviteDetails.email) {
      setError("Email must match the invite address");
      setAcceptingInvite(false);
      return;
    }

    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invite");
        setAcceptingInvite(false);
        return;
      }

      // Update session if provided
      if (data.session) {
        setSession(data.session);
      }

      // Redirect to dashboard
      router.push("/user-dashboard");
    } catch (err) {
      setError("Failed to accept invite. Please try again.");
      setAcceptingInvite(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            You're invited!
          </h1>
          <p className="text-muted-foreground mb-2">
            Join{" "}
            <span className="font-semibold text-foreground">
              {inviteDetails.organizationName}
            </span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            You're invited as a{" "}
            <span className="font-medium text-foreground capitalize">
              {inviteDetails.role}
            </span>
          </p>

          {error && <FormError message={error} />}

          <form onSubmit={handleAcceptInvite} className="space-y-4">
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
                disabled={acceptingInvite}
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Must match the email this invite was sent to
              </p>
            </div>

            <button
              type="submit"
              disabled={acceptingInvite}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {acceptingInvite ? "Accepting..." : "Accept Invite"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
