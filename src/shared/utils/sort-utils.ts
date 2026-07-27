export function sortByCreatedAtDesc<T extends { createdAt?: string; created_at?: string }>(
  records: T[]
): T[] {
  return [...records].sort((a, b) => {
    const dateA = a.createdAt || a.created_at || "";
    const dateB = b.createdAt || b.created_at || "";

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    const timeA = new Date(dateA).getTime();
    const timeB = new Date(dateB).getTime();

    if (isNaN(timeA) && isNaN(timeB)) return 0;
    if (isNaN(timeA)) return 1;
    if (isNaN(timeB)) return -1;

    return timeB - timeA;
  });
}