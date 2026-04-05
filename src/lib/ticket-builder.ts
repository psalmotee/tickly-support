import { randomUUID } from "crypto";
import type { TicketPriority } from "./ticket-local-store";
import { VALID_TICKET_PRIORITIES } from "./ticket-rules";
import { generateTicketId } from "./ticket-id";

/**
 * Confirmed schema for tickets-table (probe-verified 2026-04-03)
 *
 * INSERT accepts (camelCase):  title, description, status, priority,
 *                              userId, ticketId, internalNotes
 * UPDATE accepts (camelCase):  ticketId, internalNotes, createdAt,
 *                              updatedAt, status, priority, userId
 * READ returns  (snake_case):  ticket_id, internal_notes, user_id,
 *                              created_at, updated_at, createdAt, updatedAt
 *
 * created_at / updated_at cannot be set on INSERT — Manta controls them.
 * We set createdAt / updatedAt via a follow-up UPDATE call instead.
 */

export interface InsertTicketPayload {
  title: string;
  description: string;
  status: "open";
  priority: TicketPriority;
  userId: string;
  ticketId: string;
  internalNotes: string;
}

export interface BuildTicketInput {
  title: string;
  description: string;
  priority: TicketPriority;
  userId: string;
}

/**
 * Builds a complete, validated ticket insert payload.
 * Uses only the field names Manta accepts on INSERT.
 * ticketId is generated here — never passed from the frontend.
 */
export function buildTicket(input: BuildTicketInput): InsertTicketPayload {
  const { title, description, priority, userId } = input;

  if (!title?.trim()) throw new Error("title is required");
  if (!description?.trim()) throw new Error("description is required");
  if (!userId?.trim()) throw new Error("userId is required");

  const normalizedPriority: TicketPriority = (
    VALID_TICKET_PRIORITIES as readonly string[]
  ).includes(priority)
    ? priority
    : "medium";

  return {
    title: title.trim(),
    description: description.trim(),
    status: "open",
    priority: normalizedPriority,
    userId,
    ticketId: generateTicketId(),
    internalNotes: "",
  };
}

/**
 * Generates a unique correlation token embedded in internalNotes
 * so we can find the exact record we just inserted — immune to
 * duplicate title/description matches.
 */
export function buildInsertCorrelationToken(): string {
  return `__insert_token__:${randomUUID()}:${Date.now()}`;
}

export function extractCorrelationToken(notes: string): string | null {
  const match = notes.match(/__insert_token__:[a-z0-9-]+:\d+/);
  return match ? match[0] : null;
}

export function stripCorrelationToken(notes: string): string {
  return notes.replace(/__insert_token__:[a-z0-9-]+:\d+\n?/g, "").trim();
}
