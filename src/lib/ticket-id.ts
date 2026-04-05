/**
 * Single source of truth for ticket ID generation.
 * Format: TCK_AB12CD (6 random uppercase alphanumeric chars)
 */
export function generateTicketId(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TCK_${random}`;
}

export function isValidTicketId(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return /^TCK[_-][A-Z0-9]{4,}$/.test(value);
}

/**
 * Formats any raw ID into a display-safe string.
 * Falls back gracefully for old records that predate ticketId saving.
 */
export function formatTicketIdForDisplay(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "N/A";
  if (isValidTicketId(value)) return value;
  // Legacy: shorten a UUID for display only
  if (/^[a-f0-9-]{20,}$/i.test(value)) {
    return `TCK-${value.replace(/-/g, "").slice(-6).toUpperCase()}`;
  }
  return value;
}
