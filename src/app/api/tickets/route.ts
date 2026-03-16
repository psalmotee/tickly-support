import { NextResponse } from "next/server";
import { manta } from "@/lib/manta-client";
import { resolveTicketTable } from "@/lib/ticket-table-resolver";
import { isTicketDeletedByAdmin } from "@/lib/ticket-soft-delete";
import { getRequestSessionUser } from "@/lib/server-session";
import { resolvePublicTicketNumber } from "@/lib/ticket-number";
import {
  validateTicketCreateInput,
  VALID_TICKET_PRIORITIES,
} from "@/lib/ticket-rules";

const TICKET_ID_PREFIX = "TCK";
const TICKET_ID_PADDING = 4;
const MAX_TICKET_ID_RETRIES = 5;

function isDuplicateTicketIdError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("duplicate") ||
    normalized.includes("already exists") ||
    normalized.includes("unique") ||
    normalized.includes("conflict")
  );
}

function isUnknownFieldError(message: string): boolean {
  return message.toLowerCase().includes("unknown field");
}

function extractUnknownFields(message: string): string[] {
  const matches = message.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
  if (!matches) return [];

  const reserved = new Set([
    "unknown",
    "field",
    "fields",
    "present",
    "in",
    "data",
    "and",
    "or",
  ]);

  return Array.from(
    new Set(
      matches
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .filter((token) => !reserved.has(token.toLowerCase())),
    ),
  );
}

function stripUnknownFieldsFromPayload(
  payload: Record<string, unknown>,
  message: string,
): Record<string, unknown> | null {
  const fields = extractUnknownFields(message);
  if (fields.length === 0) return null;

  const nextPayload = { ...payload };
  let removed = false;

  for (const field of fields) {
    if (field in nextPayload) {
      delete nextPayload[field];
      removed = true;
    }
  }

  if (!removed) return null;
  if (!nextPayload.title || !nextPayload.description) return null;

  return nextPayload;
}

function mapTicketRecord(record: Record<string, unknown>) {
  const internalNotes =
    (record.internalNotes as string) || (record.internal_notes as string) || "";
  const recordId = (record.id as string) || (record._id as string) || "";
  const ticketId = resolvePublicTicketNumber(record);

  return {
    id: recordId,
    ticketId,
    title: (record.title as string) || "",
    description: (record.description as string) || "",
    priority: (record.priority as string) || "medium",
    status: (record.status as string) || "open",
    userId:
      (record.userId as string) ||
      (record.user_id as string) ||
      (record.userid as string) ||
      "",
    createdAt:
      (record.createdAt as string) || (record.created_at as string) || "",
    updatedAt:
      (record.updatedAt as string) ||
      (record.updated_at as string) ||
      (record.createdAt as string) ||
      (record.created_at as string) ||
      "",
    internalNotes,
    deletedByAdmin: isTicketDeletedByAdmin(internalNotes),
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getCreatedTimestampFromRecord(
  record: Record<string, unknown>,
): string {
  const createdAtCandidates = [record.created_at, record.createdAt];
  for (const candidate of createdAtCandidates) {
    if (isNonEmptyString(candidate)) {
      return candidate;
    }
  }

  return "";
}

async function ensureCreatedTimestampPersisted(params: {
  ticketTable: string;
  createdRecord: Record<string, unknown>;
  generatedTicketId: string;
  resolvedUserId: string;
  now: string;
  normalizedTitle: string;
  normalizedDescription: string;
  fromApiResponse: boolean;
}): Promise<Record<string, unknown>> {
  const {
    ticketTable,
    createdRecord,
    generatedTicketId,
    resolvedUserId,
    now,
    normalizedTitle,
    normalizedDescription,
    fromApiResponse,
  } = params;

  const persistedTicketId =
    (createdRecord.ticket_id as string) ||
    (createdRecord.ticketId as string) ||
    "";

  if (
    fromApiResponse &&
    getCreatedTimestampFromRecord(createdRecord) &&
    isNonEmptyString(persistedTicketId)
  ) {
    return createdRecord;
  }

  const whereCandidates: Array<Record<string, unknown>> = [];
  const whereKeySet = new Set<string>();

  const pushWhereCandidate = (where: Record<string, unknown>) => {
    const key = JSON.stringify(where);
    if (!whereKeySet.has(key)) {
      whereKeySet.add(key);
      whereCandidates.push(where);
    }
  };

  if (isNonEmptyString(createdRecord.id)) {
    pushWhereCandidate({ id: createdRecord.id });
  }

  if (isNonEmptyString(createdRecord._id)) {
    pushWhereCandidate({ _id: createdRecord._id });
  }

  if (isNonEmptyString(createdRecord.ticket_id)) {
    pushWhereCandidate({ ticket_id: createdRecord.ticket_id });
  }

  if (isNonEmptyString(createdRecord.ticketId)) {
    pushWhereCandidate({ ticketId: createdRecord.ticketId });
  }

  pushWhereCandidate({ ticket_id: generatedTicketId });
  pushWhereCandidate({ ticketId: generatedTicketId });

  if (isNonEmptyString(createdRecord.user_id)) {
    pushWhereCandidate({
      user_id: createdRecord.user_id,
      ticket_id: generatedTicketId,
    });
  }

  pushWhereCandidate({ user_id: resolvedUserId, ticket_id: generatedTicketId });

  const updateCandidates: Array<Record<string, unknown>> = [
    { created_at: now, ticket_id: generatedTicketId },
    { createdAt: now, ticketId: generatedTicketId },
    {
      created_at: now,
      createdAt: now,
      ticket_id: generatedTicketId,
      ticketId: generatedTicketId,
    },
    { ticket_id: generatedTicketId },
    { ticketId: generatedTicketId },
    { created_at: now },
    { createdAt: now },
  ];

  const applyBackfillByWhere = async (
    where: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    for (const data of updateCandidates) {
      try {
        const response = await manta.updateRecords({
          table: ticketTable,
          where,
          data,
        });

        if (response.status) {
          return {
            ...createdRecord,
            ...data,
          };
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";

        if (!isUnknownFieldError(message)) {
          continue;
        }
      }
    }

    return null;
  };

  for (const where of whereCandidates) {
    const updatedRecord = await applyBackfillByWhere(where);
    if (updatedRecord) {
      return updatedRecord;
    }
  }

  const userWhereCandidates: Array<Record<string, unknown>> = [
    { user_id: resolvedUserId },
    { userId: resolvedUserId },
    { userid: resolvedUserId },
  ];

  for (const userWhere of userWhereCandidates) {
    try {
      const lookup = await manta.fetchAllRecords({
        table: ticketTable,
        where: userWhere,
        list: 20,
      });

      if (
        !lookup.status ||
        !Array.isArray(lookup.data) ||
        lookup.data.length === 0
      ) {
        continue;
      }

      const matched = lookup.data.find((raw) => {
        const row = raw as Record<string, unknown>;
        const rowTitle = typeof row.title === "string" ? row.title.trim() : "";
        const rowDescription =
          typeof row.description === "string" ? row.description.trim() : "";
        return (
          rowTitle === normalizedTitle &&
          rowDescription === normalizedDescription
        );
      }) as Record<string, unknown> | undefined;

      if (!matched) {
        continue;
      }

      const rowWhereCandidates: Array<Record<string, unknown>> = [];
      if (isNonEmptyString(matched.id)) {
        rowWhereCandidates.push({ id: matched.id });
      }
      if (isNonEmptyString(matched._id)) {
        rowWhereCandidates.push({ _id: matched._id });
      }
      if (isNonEmptyString(matched.ticket_id)) {
        rowWhereCandidates.push({ ticket_id: matched.ticket_id });
      }

      for (const rowWhere of rowWhereCandidates) {
        const updatedRecord = await applyBackfillByWhere(rowWhere);
        if (updatedRecord) {
          return {
            ...matched,
            ...updatedRecord,
          };
        }
      }
    } catch (lookupError: unknown) {
      console.error("[tickets][POST] Failed lookup backfill for created_at", {
        userWhere,
        lookupError,
      });
    }
  }

  return {
    ...createdRecord,
    created_at: now,
  };
}

async function resolveExistingUserId(sessionUser: {
  id: string;
  email: string;
}): Promise<string | null> {
  const whereCandidates: Array<Record<string, string>> = [
    { id: sessionUser.id },
    { user_id: sessionUser.id },
    { email: sessionUser.email },
  ];

  for (const where of whereCandidates) {
    try {
      const response = await manta.fetchAllRecords({
        table: "tickly-auth",
        where,
        list: 1,
      });

      if (response.status && response.data.length > 0) {
        const user = response.data[0] as Record<string, unknown>;
        return (
          (user.id as string) ||
          (user.user_id as string) ||
          (user.userid as string) ||
          sessionUser.id
        );
      }
    } catch (error: unknown) {
      console.error("[tickets][POST] Failed resolving user", {
        where,
        error,
      });
    }
  }

  return null;
}

function buildReadableTicketId(sequence: number): string {
  return `${TICKET_ID_PREFIX}-${String(sequence).padStart(
    TICKET_ID_PADDING,
    "0",
  )}`;
}

async function generateReadableTicketId(ticketTable: string): Promise<string> {
  const ticketIdPattern = new RegExp(
    `^${TICKET_ID_PREFIX}-(\\d{${TICKET_ID_PADDING}})$`,
  );

  try {
    const response = await manta.fetchAllRecords({
      table: ticketTable,
      fields: ["ticket_id"],
      orderBy: "created_at",
      order: "desc",
    });

    let maxSequence = 0;

    if (Array.isArray(response.data)) {
      for (const rawRecord of response.data) {
        const record = rawRecord as Record<string, unknown>;
        const candidateId =
          (record.ticket_id as string) || (record.ticketId as string) || "";

        const match = ticketIdPattern.exec(candidateId);
        if (!match) continue;

        const sequence = Number.parseInt(match[1], 10);
        if (Number.isNaN(sequence)) continue;

        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }

    return buildReadableTicketId(maxSequence + 1);
  } catch (error: unknown) {
    console.error("[tickets][POST] Failed to generate readable ticket ID", {
      error,
    });

    const fallbackSequence = Math.floor(Date.now() % 10000);
    return buildReadableTicketId(fallbackSequence);
  }
}

export async function GET(req: Request) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    if (sessionUser.role !== "admin" && sessionUser.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const ticketTable = await resolveTicketTable();

    const mergedTickets = new Map<string, ReturnType<typeof mapTicketRecord>>();
    const userIdFieldCandidates = ["user_id", "userId", "userid"];

    for (const userIdField of userIdFieldCandidates) {
      try {
        const response = await manta.fetchAllRecords({
          table: ticketTable,
          where: { [userIdField]: userId },
          orderBy: "created_at",
          order: "desc",
        });

        if (Array.isArray(response.data)) {
          for (const record of response.data) {
            const mapped = mapTicketRecord(record as Record<string, unknown>);
            const key = mapped.id || JSON.stringify(record);
            mergedTickets.set(key, mapped);
          }
        }
      } catch (candidateError: unknown) {
        console.error("[tickets][GET] Failed fetching ticket candidate field", {
          userIdField,
          userId,
          candidateError,
        });
      }
    }

    const tickets = Array.from(mergedTickets.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error: unknown) {
    console.error("[tickets][GET] Failed to fetch tickets", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch((parseError: unknown) => {
      console.error("[tickets][POST] Invalid JSON body", { parseError });
      return null;
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const { title, description, priority } = body as {
      title?: unknown;
      description?: unknown;
      priority?: unknown;
    };

    const resolvedUserId = await resolveExistingUserId(sessionUser);
    if (!resolvedUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authenticated user profile was not found",
        },
        { status: 400 },
      );
    }

    const validationError = validateTicketCreateInput({
      title,
      description,
      priority,
      userId: resolvedUserId,
    });
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 },
      );
    }

    const normalizedTitle = (title as string).trim();
    const normalizedDescription = (description as string).trim();
    const normalizedPriority =
      priority as (typeof VALID_TICKET_PRIORITIES)[number];

    const ticketTable = await resolveTicketTable();

    let lastError = "Failed to create ticket";
    const attemptedFieldSets = new Set<string>();

    for (let retry = 0; retry < MAX_TICKET_ID_RETRIES; retry += 1) {
      const now = new Date().toISOString();
      const generatedTicketId = await generateReadableTicketId(ticketTable);
      const commonFields = {
        title: normalizedTitle,
        description: normalizedDescription,
        priority: normalizedPriority,
        status: "open",
      };

      const payloadCandidates: Array<Record<string, unknown>> = [
        {
          ...commonFields,
          ticket_id: generatedTicketId,
          user_id: resolvedUserId,
          created_at: now,
          updated_at: now,
        },
        {
          ...commonFields,
          ticketId: generatedTicketId,
          user_id: resolvedUserId,
          created_at: now,
          updated_at: now,
        },
        {
          ...commonFields,
          ticket_id: generatedTicketId,
          user_id: resolvedUserId,
          created_at: now,
          updated_at: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          ...commonFields,
          id: generatedTicketId,
          user_id: resolvedUserId,
          created_at: now,
          updated_at: now,
        },
        {
          ...commonFields,
          ticket_id: generatedTicketId,
          user_id: resolvedUserId,
          createdAt: now,
          updatedAt: now,
        },
        {
          ...commonFields,
          ticketId: generatedTicketId,
          user_id: resolvedUserId,
          createdAt: now,
          updatedAt: now,
        },
        {
          ...commonFields,
          id: generatedTicketId,
          user_id: resolvedUserId,
          createdAt: now,
          updatedAt: now,
        },
        // Legacy fallback payloads.
        {
          ...commonFields,
          ticket_id: generatedTicketId,
          userId: resolvedUserId,
          createdAt: now,
          updatedAt: now,
        },
        {
          ...commonFields,
          ticket_id: generatedTicketId,
          userid: resolvedUserId,
          created_at: now,
          updated_at: now,
        },
        {
          title: normalizedTitle,
          description: normalizedDescription,
          ticket_id: generatedTicketId,
          user_id: resolvedUserId,
        },
        {
          title: normalizedTitle,
          description: normalizedDescription,
          ticketId: generatedTicketId,
          user_id: resolvedUserId,
        },
        {
          title: normalizedTitle,
          description: normalizedDescription,
          id: generatedTicketId,
          user_id: resolvedUserId,
        },
        {
          ...commonFields,
          user_id: resolvedUserId,
          created_at: now,
          updated_at: now,
        },
        {
          ...commonFields,
          user_id: resolvedUserId,
        },
        {
          ...commonFields,
          userId: resolvedUserId,
        },
        {
          title: normalizedTitle,
          description: normalizedDescription,
          user_id: resolvedUserId,
        },
      ];

      let shouldRetryWithNewTicketId = false;

      for (const payload of payloadCandidates) {
        attemptedFieldSets.add(Object.keys(payload).sort().join(","));

        try {
          const createRes = await manta.createRecords({
            table: ticketTable,
            data: [payload],
          });

          const createSucceeded =
            Boolean((createRes as { success?: boolean }).success) ||
            Boolean((createRes as { status?: boolean }).status) ||
            (typeof (createRes as { message?: string }).message === "string" &&
              (createRes as { message?: string }).message
                ?.toLowerCase()
                .includes("successfully processed"));

          if (createSucceeded) {
            const createData = (createRes as { data?: unknown }).data as
              | {
                  results?: Array<{
                    record?: Record<string, unknown>;
                  }>;
                }
              | undefined;

            const firstResultRecord = Array.isArray(createData?.results)
              ? createData?.results[0]?.record
              : undefined;

            const fromApiResponse = Boolean(
              firstResultRecord && typeof firstResultRecord === "object",
            );
            const createdRecord = fromApiResponse
              ? (firstResultRecord as Record<string, unknown>)
              : payload;

            const recordWithCreatedTimestamp =
              await ensureCreatedTimestampPersisted({
                ticketTable,
                createdRecord,
                generatedTicketId,
                resolvedUserId,
                now,
                normalizedTitle,
                normalizedDescription,
                fromApiResponse,
              });

            return NextResponse.json({
              success: true,
              ticketIdRetriesUsed: retry,
              ticket: mapTicketRecord({
                ...recordWithCreatedTimestamp,
                ticket_id:
                  (recordWithCreatedTimestamp.ticket_id as string) ||
                  generatedTicketId,
                created_at:
                  (recordWithCreatedTimestamp.created_at as string) ||
                  (recordWithCreatedTimestamp.createdAt as string) ||
                  now,
                updated_at:
                  (recordWithCreatedTimestamp.updated_at as string) ||
                  (recordWithCreatedTimestamp.updatedAt as string) ||
                  now,
              }),
            });
          }

          lastError =
            (createRes as { message?: string }).message ||
            "Failed to create ticket";

          if (isDuplicateTicketIdError(lastError)) {
            shouldRetryWithNewTicketId = true;
            break;
          }

          if (!isUnknownFieldError(lastError)) {
            break;
          }

          const sanitizedPayload = stripUnknownFieldsFromPayload(
            payload,
            lastError,
          );

          if (!sanitizedPayload) {
            continue;
          }

          attemptedFieldSets.add(
            Object.keys(sanitizedPayload).sort().join(","),
          );

          try {
            const sanitizedCreateRes = await manta.createRecords({
              table: ticketTable,
              data: [sanitizedPayload],
            });

            const sanitizedSucceeded =
              Boolean((sanitizedCreateRes as { success?: boolean }).success) ||
              Boolean((sanitizedCreateRes as { status?: boolean }).status) ||
              (typeof (sanitizedCreateRes as { message?: string }).message ===
                "string" &&
                (sanitizedCreateRes as { message?: string }).message
                  ?.toLowerCase()
                  .includes("successfully processed"));

            if (sanitizedSucceeded) {
              const sanitizedData = (sanitizedCreateRes as { data?: unknown })
                .data as
                | {
                    results?: Array<{
                      record?: Record<string, unknown>;
                    }>;
                  }
                | undefined;

              const sanitizedRecord = Array.isArray(sanitizedData?.results)
                ? sanitizedData?.results[0]?.record
                : undefined;

              const sanitizedFromApiResponse = Boolean(
                sanitizedRecord && typeof sanitizedRecord === "object",
              );
              const createdRecord = sanitizedFromApiResponse
                ? (sanitizedRecord as Record<string, unknown>)
                : sanitizedPayload;

              const recordWithCreatedTimestamp =
                await ensureCreatedTimestampPersisted({
                  ticketTable,
                  createdRecord,
                  generatedTicketId,
                  resolvedUserId,
                  now,
                  normalizedTitle,
                  normalizedDescription,
                  fromApiResponse: sanitizedFromApiResponse,
                });

              return NextResponse.json({
                success: true,
                ticketIdRetriesUsed: retry,
                ticket: mapTicketRecord({
                  ...recordWithCreatedTimestamp,
                  ticket_id:
                    (recordWithCreatedTimestamp.ticket_id as string) ||
                    generatedTicketId,
                  created_at:
                    (recordWithCreatedTimestamp.created_at as string) ||
                    (recordWithCreatedTimestamp.createdAt as string) ||
                    now,
                  updated_at:
                    (recordWithCreatedTimestamp.updated_at as string) ||
                    (recordWithCreatedTimestamp.updatedAt as string) ||
                    now,
                }),
              });
            }
          } catch (sanitizedError: unknown) {
            const sanitizedMessage =
              sanitizedError instanceof Error
                ? sanitizedError.message
                : "Failed to create ticket";

            lastError = sanitizedMessage;

            if (isDuplicateTicketIdError(sanitizedMessage)) {
              shouldRetryWithNewTicketId = true;
              break;
            }

            if (!isUnknownFieldError(sanitizedMessage)) {
              break;
            }
          }
        } catch (candidateError: unknown) {
          const message =
            candidateError instanceof Error
              ? candidateError.message
              : "Failed to create ticket";

          console.error("[tickets][POST] Failed with payload candidate", {
            payload,
            candidateError,
          });

          lastError = message;

          if (isDuplicateTicketIdError(message)) {
            shouldRetryWithNewTicketId = true;
            break;
          }

          if (!isUnknownFieldError(message)) {
            break;
          }

          const sanitizedPayload = stripUnknownFieldsFromPayload(
            payload,
            message,
          );

          if (!sanitizedPayload) {
            continue;
          }

          attemptedFieldSets.add(
            Object.keys(sanitizedPayload).sort().join(","),
          );

          try {
            const sanitizedCreateRes = await manta.createRecords({
              table: ticketTable,
              data: [sanitizedPayload],
            });

            const sanitizedSucceeded =
              Boolean((sanitizedCreateRes as { success?: boolean }).success) ||
              Boolean((sanitizedCreateRes as { status?: boolean }).status) ||
              (typeof (sanitizedCreateRes as { message?: string }).message ===
                "string" &&
                (sanitizedCreateRes as { message?: string }).message
                  ?.toLowerCase()
                  .includes("successfully processed"));

            if (sanitizedSucceeded) {
              const sanitizedData = (sanitizedCreateRes as { data?: unknown })
                .data as
                | {
                    results?: Array<{
                      record?: Record<string, unknown>;
                    }>;
                  }
                | undefined;

              const sanitizedRecord = Array.isArray(sanitizedData?.results)
                ? sanitizedData?.results[0]?.record
                : undefined;

              const throwSanitizedFromApiResponse = Boolean(
                sanitizedRecord && typeof sanitizedRecord === "object",
              );
              const createdRecord = throwSanitizedFromApiResponse
                ? (sanitizedRecord as Record<string, unknown>)
                : sanitizedPayload;

              const recordWithCreatedTimestamp =
                await ensureCreatedTimestampPersisted({
                  ticketTable,
                  createdRecord,
                  generatedTicketId,
                  resolvedUserId,
                  now,
                  normalizedTitle,
                  normalizedDescription,
                  fromApiResponse: throwSanitizedFromApiResponse,
                });

              return NextResponse.json({
                success: true,
                ticketIdRetriesUsed: retry,
                ticket: mapTicketRecord({
                  ...recordWithCreatedTimestamp,
                  ticket_id:
                    (recordWithCreatedTimestamp.ticket_id as string) ||
                    generatedTicketId,
                  created_at:
                    (recordWithCreatedTimestamp.created_at as string) ||
                    (recordWithCreatedTimestamp.createdAt as string) ||
                    now,
                  updated_at:
                    (recordWithCreatedTimestamp.updated_at as string) ||
                    (recordWithCreatedTimestamp.updatedAt as string) ||
                    now,
                }),
              });
            }
          } catch (sanitizedError: unknown) {
            const sanitizedMessage =
              sanitizedError instanceof Error
                ? sanitizedError.message
                : "Failed to create ticket";
            lastError = sanitizedMessage;

            if (isDuplicateTicketIdError(sanitizedMessage)) {
              shouldRetryWithNewTicketId = true;
              break;
            }

            if (!isUnknownFieldError(sanitizedMessage)) {
              break;
            }
          }
        }
      }

      if (shouldRetryWithNewTicketId) {
        continue;
      }

      break;
    }

    return NextResponse.json(
      {
        success: false,
        error: lastError,
        resolvedTable: ticketTable,
        attemptedFieldSets: Array.from(attemptedFieldSets),
        hint: lastError.toLowerCase().includes("unknown field")
          ? "Schema mismatch: verify this exact table has fields id,title,description,priority,status,user_id,created_at,updated_at,internal_notes,ticket_id"
          : undefined,
      },
      { status: 500 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create ticket";

    console.error("[tickets][POST] Failed to create ticket", { error });

    if (
      typeof message === "string" &&
      (message.includes("Table not found") ||
        message.includes("No accessible ticket table found"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ticket table is not available for this SDK key. Configure MANTA_TICKETS_TABLE in .env to an existing Manta table and restart dev server.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
