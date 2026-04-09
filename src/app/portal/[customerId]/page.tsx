"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
}

interface CustomerPortalView {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_tickets: number;
  tickets: Ticket[];
}

export default function CustomerPortalPage() {
  const params = useParams();
  const customerId = (params.customerId as string) || "";

  const [portalData, setPortalData] = useState<CustomerPortalView | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomerPortal();
  }, [customerId]);

  const loadCustomerPortal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/public/customers/${customerId}`);

      if (!response.ok) {
        throw new Error("Failed to load portal");
      }

      const data = await response.json();
      setPortalData(data.data);
      setError("");
    } catch (err) {
      console.error("Error loading portal:", err);
      setError("Unable to load your tickets. Please check the link.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
      case "closed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "text-red-600 font-semibold";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portalData || error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Load Portal
            </h2>
            <p className="text-red-700">
              {error || "The customer link is invalid or expired."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tickly</h1>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Support Portal
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            View and track your support tickets
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Customer Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Customer Name
              </h3>
              <p className="text-lg font-semibold text-gray-900">
                {portalData.customer_name}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Total Tickets
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {portalData.total_tickets}
              </p>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Your Tickets
          </h3>

          {portalData.tickets.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
              <p className="text-gray-600">
                You haven't submitted any tickets yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {portalData.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-md cursor-pointer transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-mono font-semibold">
                          #{ticket.ticket_number}
                        </span>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 mb-1 truncate">
                        {ticket.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Submitted: {formatDate(ticket.created_at)}</span>
                        {ticket.assigned_to_name && (
                          <span>Assigned to: {ticket.assigned_to_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated: {formatDate(ticket.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 p-6 sticky top-0 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-mono font-semibold">
                        #{selectedTicket.ticket_number}
                      </span>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}
                      >
                        {selectedTicket.status
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedTicket.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      Priority
                    </h4>
                    <span
                      className={`text-base font-medium ${getPriorityColor(selectedTicket.priority)}`}
                    >
                      {selectedTicket.priority
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      Status
                    </h4>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}
                    >
                      {selectedTicket.status
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      Submitted
                    </h4>
                    <p className="text-gray-900">
                      {formatDate(selectedTicket.created_at)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      Last Updated
                    </h4>
                    <p className="text-gray-900">
                      {formatDate(selectedTicket.updated_at)}
                    </p>
                  </div>
                </div>

                {selectedTicket.assigned_to_name && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      Assigned To
                    </h4>
                    <p className="text-gray-900">
                      {selectedTicket.assigned_to_name}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
          <p>
            This support portal is provided by{" "}
            <span className="font-semibold text-gray-900">Tickly</span>
          </p>
        </div>
      </main>
    </div>
  );
}
