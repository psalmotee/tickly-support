import { Metadata } from "next";
import { Suspense } from "react";
import { CustomerSignupContent } from "@/components/customer-signup-content";

export const metadata: Metadata = {
  title: "Create Account | Tickly",
  description: "Create your customer account to access support",
};

export default function CustomerSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">Loading invite details...</p>
            </div>
          </div>
        </div>
      }
    >
      <CustomerSignupContent />
    </Suspense>
  );
}
