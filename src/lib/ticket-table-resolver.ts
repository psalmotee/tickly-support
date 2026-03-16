import { manta } from "@/lib/manta-client";

const MANTA_TICKETS_TABLE = process.env.MANTA_TICKETS_TABLE;

const TICKET_TABLE = [MANTA_TICKETS_TABLE].filter(
  Boolean,
) as string[];

let cachedTicketTable: string | null = null;

export async function resolveTicketTable(): Promise<string> {
  if (cachedTicketTable) return cachedTicketTable;

  for (const table of TICKET_TABLE) {
    try {
      await manta.fetchAllRecords({ table, list: 1 });
      cachedTicketTable = table;
      console.info("[ticket-table-resolver] Resolved ticket table", {
        table,
      });
      return table;
    } catch (error: unknown) {
      console.warn("[ticket-table-resolver] Table probe failed", {
        table,
        error,
      });
    }
  }

  throw new Error(
    `Configured ticket table '${MANTA_TICKETS_TABLE}' is not accessible. Ensure MANTA_TICKETS_TABLE is correct and the SDK key has access to this table.`,
  );
}
