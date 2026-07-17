import type { ApiPagination } from "../types";

export async function fetchAllPages<T, P extends { page?: number; limit?: number }>(
  fetchPageFn: (params: P) => Promise<{ data: T[]; pagination?: ApiPagination }>,
  params?: Omit<P, "page" | "limit">
): Promise<{ data: T[] }> {
  const first = await fetchPageFn({ ...params, page: 1, limit: 100 } as unknown as P);
  const totalPages = first.pagination?.totalPages ?? 1;
  if (totalPages <= 1) return { data: first.data };

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchPageFn({ ...params, page: index + 2, limit: 100 } as unknown as P)
    )
  );

  return { data: [first, ...rest].flatMap((page) => page.data) };
}
