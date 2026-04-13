"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

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
  const [orgId, setOrgId] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchCurrentOrganization();
  }, []);

  useEffect(() => {
    if (orgId) {
      loadCustomers();
    }
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

  const fetchCurrentOrganization = async () => {
    try {
      const response = await fetch("/api/admin/organizations/current");
      if (!response.ok) {
        throw new Error("Failed to fetch organization");
      }
      const data = await response.json();
      setOrgId(data.organization.id);
    } catch (err) {
      console.error("Error fetching current organization:", err);
      setError("Failed to load organization");
      setLoading(false);
    }
  };

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
      toast.error("Failed to load customers");
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
      <div
        className="min-h-screen bg-background p-8"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        }}
      >
        <div className="flex items-center justify-center h-screen flex-col gap-4">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-muted-foreground font-medium">
            Loading customers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/admin-dashboard"
            className="text-sm font-medium text-primary hover:opacity-80 transition-opacity inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-foreground mt-4">Customers</h1>
          <p className="text-muted-foreground mt-3 text-base">
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
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={loadCustomers}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 transition-opacity font-medium"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-red-200/50 bg-red-50/50 backdrop-blur-sm">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
              <p className="text-sm text-muted-foreground font-medium">
                Total Customers
              </p>
              <p className="text-4xl font-bold text-primary mt-2">
                {customers.length}
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
              <p className="text-sm text-muted-foreground font-medium">
                With Phone
              </p>
              <p className="text-4xl font-bold text-primary mt-2">
                {customers.filter((c) => c.phone).length}
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors">
              <p className="text-sm text-muted-foreground font-medium">
                Total Tickets
              </p>
              <p className="text-4xl font-bold text-primary mt-2">
                {customers.reduce((sum, c) => sum + c.ticket_count, 0)}
              </p>
            </div>
          </div>

          {/* Customers Table */}
          {filteredCustomers.length === 0 && searchQuery === "" ? (
            <div className="text-center py-16 rounded-lg border border-dashed border-border bg-muted/30">
              <p className="text-muted-foreground text-lg font-medium">
                No customers yet
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Customers will appear here when they submit tickets via the
                widget
              </p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-16 rounded-lg border border-dashed border-border bg-muted/30">
              <p className="text-muted-foreground text-lg font-medium">
                No customers match your search
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
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
                        className="border-b border-border hover:bg-muted/40 transition-colors"
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
                          <span className="inline-block px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
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
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
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
          <p className="text-sm text-muted-foreground font-medium">
            Showing{" "}
            <span className="text-foreground font-semibold">
              {filteredCustomers.length}
            </span>{" "}
            of{" "}
            <span className="text-foreground font-semibold">
              {customers.length}
            </span>{" "}
            customers
          </p>
        </div>
      </main>
    </div>
  );
}
