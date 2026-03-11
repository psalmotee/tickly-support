import { manta } from "@/lib/manta-client";

const ENV_TICKET_TABLE = process.env.MANTA_TICKETS_TABLE;
const DEFAULT_TICKET_TABLE = "support-tickets";
const RESOLVED_TICKET_TABLE = ENV_TICKET_TABLE || DEFAULT_TICKET_TABLE;

const TICKET_TABLE_CANDIDATES = [RESOLVED_TICKET_TABLE].filter(
  Boolean,
) as string[];

let cachedTicketTable: string | null = null;

export async function resolveTicketTable(): Promise<string> {
  if (cachedTicketTable) return cachedTicketTable;

  for (const table of TICKET_TABLE_CANDIDATES) {
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
    `Configured ticket table '${RESOLVED_TICKET_TABLE}' is not accessible. Ensure MANTA_TICKETS_TABLE is correct and the SDK key has access to this table.`,
  );
}
