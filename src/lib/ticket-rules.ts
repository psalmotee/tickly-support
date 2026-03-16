export const VALID_TICKET_PRIORITIES = ["low", "medium", "high"] as const;
export const VALID_TICKET_STATUSES = ["open", "in-progress", "closed"] as const;

export type ValidTicketPriority = (typeof VALID_TICKET_PRIORITIES)[number];
export type ValidTicketStatus = (typeof VALID_TICKET_STATUSES)[number];

const STATUS_TRANSITIONS: Record<ValidTicketStatus, ValidTicketStatus[]> = {
  open: ["in-progress", "closed"],
  "in-progress": ["closed"],
  closed: [],
};

export function normalizeIncomingStatus(
  value?: unknown,
): ValidTicketStatus | null {
  if (typeof value !== "string") return null;

  const normalized = value.toLowerCase().trim().replace(/_/g, "-");
  if (normalized === "resolved") return "closed";

  return (VALID_TICKET_STATUSES as readonly string[]).includes(normalized)
    ? (normalized as ValidTicketStatus)
    : null;
}

export function canTransitionStatus(
  currentStatus: ValidTicketStatus,
  nextStatus: ValidTicketStatus,
): boolean {
  if (currentStatus === nextStatus) return true;
  return STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function allowedTransitions(
  currentStatus: ValidTicketStatus,
): ValidTicketStatus[] {
  return STATUS_TRANSITIONS[currentStatus];
}

export function validateTicketCreateInput(input: {
  title: unknown;
  description: unknown;
  priority: unknown;
  userId: unknown;
}): string | null {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";

  if (!title || !description || !userId) {
    return "Missing required fields";
  }

  if (title.length < 3) return "Title must be at least 3 characters";
  if (description.length < 5) {
    return "Description must be at least 5 characters";
  }

  if (
    typeof input.priority !== "string" ||
    !(VALID_TICKET_PRIORITIES as readonly string[]).includes(input.priority)
  ) {
    return "Invalid priority value";
  }

  return null;
}
