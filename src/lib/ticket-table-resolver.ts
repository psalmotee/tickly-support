import { manta } from "@/lib/manta-client";

const MANTA_TICKETS_TABLE = process.env.MANTA_TICKETS_TABLE;

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
