const SERIAL_FIELD_CANDIDATES = [
  "sn",
  "SN",
  "s_n",
  "S_N",
  "s/n",
  "serial",
  "serial_no",
  "serialNo",
  "serial_number",
  "serialNumber",
  "sequence",
  "sequence_no",
  "sequenceNo",
  "number",
  "no",
  "S/N",
] as const;

const SHORT_FALLBACK_PREFIX = "TCK";
const SHORT_FALLBACK_LENGTH = 6;

export function extractTicketSerial(
  record: Record<string, unknown>,
): number | null {
  for (const key of SERIAL_FIELD_CANDIDATES) {
    const rawValue = record[key];

    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return rawValue;
    }

    if (typeof rawValue === "string") {
      const numeric = Number.parseInt(rawValue.replace(/[^0-9]/g, ""), 10);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }
  }

  return null;
}

export function formatPublicTicketNumber(serial: number): string {
  return `TCK-${String(serial).padStart(4, "0")}`;
}

function toShortPublicTicketFromValue(value: string): string {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!compact) {
    return `${SHORT_FALLBACK_PREFIX}-UNSET`;
  }

  const shortToken = compact.slice(-SHORT_FALLBACK_LENGTH);
  return `${SHORT_FALLBACK_PREFIX}-${shortToken}`;
}

export function resolvePublicTicketNumber(
  record: Record<string, unknown>,
): string {
  const explicitTicketId =
    (record.ticket_id as string) || (record.ticketId as string) || "";

  if (explicitTicketId.trim().length > 0) {
    return explicitTicketId;
  }

  const serial = extractTicketSerial(record);
  if (serial !== null) {
    return formatPublicTicketNumber(serial);
  }

  const internalId =
    (record.id as string) ||
    (record._id as string) ||
    (record.uuid as string) ||
    "";

  if (internalId.trim().length > 0) {
    return toShortPublicTicketFromValue(internalId);
  }

  return `${SHORT_FALLBACK_PREFIX}-PENDING`;
}
