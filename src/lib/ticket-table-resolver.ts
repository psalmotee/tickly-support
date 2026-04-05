import { manta } from "@/lib/manta-client";

const MANTA_TICKETS_TABLE = process.env.MANTA_TICKETS_TABLE;

/**
 * No in-memory cache — the cached value survives hot reloads in dev
 * and causes the admin dashboard to keep hitting the wrong table after
 * an .env change. We read the env var fresh on every cold start instead.
 */
export async function resolveTicketTable(): Promise<string> {
  const tableName = process.env.MANTA_TICKETS_TABLE || MANTA_TICKETS_TABLE;

  if (!tableName) {
    throw new Error(
      "MANTA_TICKETS_TABLE is not set in .env. Add it and restart the dev server.",
    );
  }

  try {
    await manta.fetchAllRecords({ table: tableName, list: 1 });
    return tableName;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Ticket table "${tableName}" is not accessible: ${message}. ` +
        `Check MANTA_TICKETS_TABLE in .env and restart the dev server.`,
    );
  }
}
