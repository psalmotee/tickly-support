import { isValidTicketId, formatTicketIdForDisplay } from "./ticket-id";

export function resolvePublicTicketNumber(
  record: Record<string, unknown>,
): string {
  const explicit =
    (record.ticket_id as string) || (record.ticketId as string) || "";

  if (explicit.trim() && isValidTicketId(explicit.trim())) {
    return explicit.trim();
  }

  const uuid = (record.id as string) || (record._id as string) || "";

  return formatTicketIdForDisplay(uuid);
}
