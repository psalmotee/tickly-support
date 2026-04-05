export function generateTicketId(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TCK_${random}`;
}

export function isValidTicketId(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return /^TCK[_-][A-Z0-9]{4,}$/.test(value);
}

export function formatTicketIdForDisplay(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "N/A";
  if (isValidTicketId(value)) return value;
  // Legacy: shorten a UUID for display only
  const legacyValue = value as string;
  if (/^[a-f0-9-]{20,}$/i.test(legacyValue)) {
    return `TCK-${legacyValue.replace(/-/g, "").slice(-6).toUpperCase()}`;
  }
  return legacyValue;
}
