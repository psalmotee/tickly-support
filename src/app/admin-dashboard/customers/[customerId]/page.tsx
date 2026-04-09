"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Note {
  id: string;
  note: string;
  created_at: string;
  created_by?: { full_name: string; email: string };
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  tags?: string[];
  created_at: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const organizationId = (params.id as string) || "";
  const customerId = (params.customerId as string) || "";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [addingTag, setAddingTag] = useState(false);

  useEffect(() => {
    if (!organizationId || !customerId) {
      setLoading(false);
      return;
    }
    loadCustomerDetails();
  }, [organizationId, customerId]);

  const loadCustomerDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/organizations/${organizationId}/customers/${customerId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load customer");
      }

      const data = await response.json();
      setCustomer(data.customer);
      setTickets(data.customer.tickets || []);
      setNotes(data.notes || []);
      setTags(data.customer.tags || []);
    } catch (err) {
      console.error("Error loading customer:", err);
      setError("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/customers/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_note",
            data: { note: newNote },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      const data = await response.json();
      setNotes(data.notes || []);
      setNewNote("");
    } catch (err) {
      console.error("Error adding note:", err);
      setError("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !customer) return;

    setAddingTag(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/customers/${customer.id}/tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_tag",
            tag: newTag.trim().toLowerCase(),
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to add tag");

      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag("");
    } catch (err) {
      console.error("Error adding tag:", err);
      setError("Failed to add tag");
    } finally {
      setAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!customer) return;

    setAddingTag(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/customers/${customer.id}/tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "remove_tag",
            tag: tagToRemove,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to remove tag");

      setTags(tags.filter((t) => t !== tagToRemove));
    } catch (err) {
      console.error("Error removing tag:", err);
      setError("Failed to remove tag");
    } finally {
      setAddingTag(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-red-600">Customer not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/admin-dashboard/customers`}
            className="text-sm text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            {customer.full_name}
          </h1>
          <p className="text-muted-foreground mt-2">{customer.email}</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Customer Info
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Name
                  </dt>
                  <dd className="text-sm text-foreground mt-1">
                    {customer.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Email
                  </dt>
                  <dd className="text-sm text-foreground mt-1">
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {customer.email}
                    </a>
                  </dd>
                </div>
                {customer.phone && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Phone
                    </dt>
                    <dd className="text-sm text-foreground mt-1">
                      {customer.phone}
                    </dd>
                  </div>
                )}
                {customer.company_name && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Company
                    </dt>
                    <dd className="text-sm text-foreground mt-1">
                      {customer.company_name}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Joined
                  </dt>
                  <dd className="text-sm text-foreground mt-1">
                    {formatDate(customer.created_at)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">
                Total Tickets
              </p>
              <p className="text-3xl font-bold text-foreground">
                {tickets.length}
              </p>
            </div>

            {/* Tags Section */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Tags
              </h3>

              {/* Display existing tags */}
              <div className="mb-4">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-4">
                    No tags assigned
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          disabled={addingTag}
                          className="ml-1 hover:text-blue-600 disabled:opacity-50"
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag();
                    }
                  }}
                  placeholder="Add new tag (e.g., vip, priority)"
                  disabled={addingTag}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder-muted-foreground disabled:opacity-50"
                />
                <button
                  onClick={handleAddTag}
                  disabled={addingTag || !newTag.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingTag ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* Tickets & Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tickets */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Tickets ({tickets.length})
              </h2>

              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tickets submitted
                </p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/admin-dashboard/tickets-list/${ticket.id}`}
                      className="p-4 rounded-lg border border-border hover:border-blue-400 transition block"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {ticket.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(ticket.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              ticket.status === "open"
                                ? "bg-blue-50 text-blue-700"
                                : ticket.status === "resolved"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            {ticket.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              ticket.priority === "high"
                                ? "bg-red-50 text-red-700"
                                : ticket.priority === "medium"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-green-50 text-green-700"
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Notes ({notes.length})
              </h2>

              <div className="space-y-4">
                {/* Add Note Form */}
                <div className="space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note about this customer..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {addingNote ? "Adding..." : "Add Note"}
                  </button>
                </div>

                {/* Notes List */}
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                ) : (
                  <div className="space-y-3 border-t border-border pt-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg bg-muted border border-border"
                      >
                        <p className="text-sm text-foreground">{note.note}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.created_by?.full_name} •{" "}
                          {formatDate(note.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
