"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  created_at: string;
  ticket_count: number;
}

export default function CustomersPage() {
  const params = useParams();
  const orgId = (params.id as string) || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    loadCustomers();
  }, [orgId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(
        (c) =>
          c.full_name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.company_name?.toLowerCase().includes(query),
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/organizations/${orgId}/customers`,
      );

      if (!response.ok) {
        throw new Error("Failed to load customers");
      }

      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin-dashboard"
            className="text-sm text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all customers who submitted tickets
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadCustomers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {customers.length}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">With Phone</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {customers.filter((c) => c.phone).length}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">Total Tickets</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {customers.reduce((sum, c) => sum + c.ticket_count, 0)}
              </p>
            </div>
          </div>

          {/* Customers Table */}
          {filteredCustomers.length === 0 && searchQuery === "" ? (
            <div className="text-center py-12 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">No customers yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Customers will appear here when they submit tickets via the
                widget
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">
                No customers match your search
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                        Company
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                        Phone
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-foreground">
                        Tickets
                      </th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                        Joined
                      </th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-border hover:bg-muted transition"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">
                            {customer.full_name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">
                            {customer.company_name || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">
                            {customer.phone || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium">
                            {customer.ticket_count}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(customer.created_at)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/admin-dashboard/customers/${customer.id}`}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Show count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
      </main>
    </div>
  );
}
