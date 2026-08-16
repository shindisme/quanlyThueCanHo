import type { SortConfig } from "../hooks/useSort";

export function getTableRowNumber(
  rowIndex: number,
  startIndex: number,
  totalItems: number,
  sortConfig?: SortConfig | null
) {
  return sortConfig?.key === "index" && sortConfig.direction === "desc"
    ? totalItems - startIndex - rowIndex
    : startIndex + rowIndex + 1;
}
