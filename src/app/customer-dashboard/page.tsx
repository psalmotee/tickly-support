"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CustomerSession {
  id: string;
  email: string;
  fullName: string;
  organizationId: string;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        if (!response.ok || !data.session) {
          router.push("/customer-signup");
          return;
        }

        // For now,  show basic message
        // In full implementation, load customer data
        setLoading(false);
      } catch (err) {
        setError("Failed to load dashboard");
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-foreground">Welcome!</h1>
          <button
            onClick={() => {
              document.cookie =
                "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
              router.push("/");
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sign Out
          </button>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Status Card */}
          <div className="rounded-lg border border-border bg-card p-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Getting Started
            </h2>
            <p className="text-muted-foreground mb-6">
              Your account has been successfully created. Here's what you can
              do:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    View Your Tickets
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Track the status of all your support requests in one place
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Submit a New Ticket
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create a new support request whenever you need assistance
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Manage Your Profile
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Update your contact information and preferences
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/customer/tickets"
              className="rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-card/50 transition group"
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary transition mb-2">
                View My Tickets
              </h3>
              <p className="text-sm text-muted-foreground">
                View and manage your support tickets
              </p>
            </Link>

            <Link
              href="/customer/submit"
              className="rounded-lg border border-border bg-card p-6 hover:border-primary hover:bg-card/50 transition group"
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary transition mb-2">
                Create New Ticket
              </h3>
              <p className="text-sm text-muted-foreground">
                Submit a new support request
              </p>
            </Link>
          </div>

          {/* Help Section */}
          <div className="rounded-lg border border-border/50 bg-muted p-6">
            <h3 className="font-semibold text-foreground mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              Check our{" "}
              <Link href="#" className="text-primary hover:underline">
                help center
              </Link>{" "}
              or{" "}
              <Link href="#" className="text-primary hover:underline">
                contact support
              </Link>{" "}
              for additional assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
