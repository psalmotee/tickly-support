// used
import { Metadata } from "next";
import { Suspense } from "react";
import { JoinOrganizationPageContent } from "@/components/join-organization-content";

export const metadata: Metadata = {
  title: "Join Organization | Tickly",
  description: "Accept your organization invite",
};

export default function JoinOrganizationPage() {
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
      <JoinOrganizationPageContent />
    </Suspense>
  );
}
