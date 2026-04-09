"use client";

import Link from "next/link";

export default function PortalLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tickly</h1>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Customer Support Portal
          </h2>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Track Your Support Tickets
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Stay updated on your support requests with our customer portal.
              View ticket status, assigned representatives, and communication
              history all in one place.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Real-time Updates
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get instant notifications on ticket progress
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Easy Access</h3>
                  <p className="text-gray-600 text-sm">
                    No account needed - just use your personal link
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Priority Visibility
                  </h3>
                  <p className="text-gray-600 text-sm">
                    See ticket priority and assignment details
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              How to Access Your Portal
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Submit a Ticket
                  </h4>
                  <p className="text-gray-600 text-sm">
                    When you submit a support ticket through our widget or
                    contact form, you'll receive a unique portal link
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Use Your Link
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Click the link in your confirmation email to access your
                    customer portal
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Track Progress
                  </h4>
                  <p className="text-gray-600 text-sm">
                    View all your tickets and their current status in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Ticket Status</h3>
            <p className="text-gray-600 text-sm">
              See your ticket's current status at a glance - from new to
              resolved
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast Support</h3>
            <p className="text-gray-600 text-sm">
              Get assigned to a support specialist who will help resolve your
              issue quickly
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Always Available
            </h3>
            <p className="text-gray-600 text-sm">
              Check your tickets 24/7 from any device with internet access
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Don't Have a Portal Link?
          </h3>
          <p className="text-gray-600 mb-6">
            Submit a support ticket and we'll send you a personalized portal
            link
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Submit a Ticket
          </Link>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
          <p>
            Powered by{" "}
            <span className="font-semibold text-gray-900">Tickly</span> - Your
            All-in-One Support Solution
          </p>
        </div>
      </main>
    </div>
  );
}
