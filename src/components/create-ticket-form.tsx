"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { validateTicketForm } from "@/lib/form-validation";
import { useAuth } from "./auth-provider";
import type { Ticket } from "@/lib/ticket-local-store";

interface CreateTicketFormProps {
  onSuccess: (ticket?: Ticket) => void;
}

export function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const validation = validateTicketForm(title, description);
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err.message));
      setIsLoading(false);
      return;
    }

    if (!session) {
      toast.error("Not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
        }),
      });

      const result = await res.json();
      const isSuccess =
        Boolean(result.success) ||
        (typeof result.message === "string" &&
          result.message.toLowerCase().includes("successfully processed"));

      if (!isSuccess) {
        toast.error(result.error || "Failed to create ticket");
        setIsLoading(false);
        return;
      }

      const createdTicket: Ticket | undefined = result.ticket;

      setTitle("");
      setDescription("");
      setPriority("medium");
      setIsLoading(false);
      toast.success("Ticket created successfully!");
      onSuccess(createdTicket);
      return;
    } catch (error: unknown) {
      console.error("[create-ticket-form] Failed to create ticket", { error });
      toast.error("Failed to create ticket");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Inputs */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ticket title"
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ticket description"
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Priority
        </label>
        <select
          title="Priority"
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as "low" | "medium" | "high")
          }
          className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={isLoading}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}
