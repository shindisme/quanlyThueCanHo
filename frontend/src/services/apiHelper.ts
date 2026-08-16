import type { ApiPagination } from "../types";

function removeDuplicateEntities<T>(items: T[]): T[] {
  const seenIds = new Set<string>();

  return items.filter((item) => {
    if (typeof item !== "object" || item === null || !("id" in item)) {
      return true;
    }

    const id = (item as { id?: unknown }).id;
    if (typeof id !== "string" && typeof id !== "number") {
      return true;
    }

    const entityKey = `${typeof id}:${id}`;
    if (seenIds.has(entityKey)) return false;

    seenIds.add(entityKey);
    return true;
  });
}

export async function fetchAllPages<T, P extends { page?: number; limit?: number }>(
  fetchPageFn: (params: P) => Promise<{ data: T[]; pagination?: ApiPagination }>,
  params?: Omit<P, "page" | "limit">
): Promise<{ data: T[] }> {
  const first = await fetchPageFn({ ...params, page: 1, limit: 100 } as unknown as P);
  const totalPages = first.pagination?.totalPages ?? 1;
  if (totalPages <= 1) return { data: removeDuplicateEntities(first.data) };

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchPageFn({ ...params, page: index + 2, limit: 100 } as unknown as P)
    )
  );

  const allItems = [first, ...rest].flatMap((page) => page.data);
  return { data: removeDuplicateEntities(allItems) };
}
