import React, { useMemo, memo } from "react";
import { cn } from "../../lib/utils";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";
import { useSort } from "../../hooks/useSort";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./Table";

export interface Column<T> {
  accessorKey?: string;
  key?: string;
  label: string;
  sortable?: boolean;
  sortValue?: (item: T) => unknown;
  className?: string;
  render: (item: T, index: number) => React.ReactNode;
  isAction?: boolean;
  isTitle?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
  density?: "normal" | "compact";
  rowKey?: (item: T) => string | number;
  rowClassName?: string | ((item: T) => string);
  cellClassName?: string | ((item: T, column: Column<T>) => string);
  stickyHeader?: boolean;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
}

function DataTableInner<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage,
  emptyComponent,
  loadingComponent,
  onRowClick,
  className,
  density = "normal",
  rowKey,
  rowClassName,
  cellClassName,
  stickyHeader = false,
  sortConfig: externalSortConfig,
  onSort,
}: DataTableProps<T>) {
  const customExtractors = useMemo(() => {
    const extractors: Record<string, (item: T) => unknown> = {};
    columns.forEach((col) => {
      const colKey = col.accessorKey || col.key;
      if (colKey && col.sortValue) {
        extractors[colKey] = col.sortValue;
      }
    });
    return extractors;
  }, [columns]);

  const internalSort = useSort(
    data,
    null,
    customExtractors
  );

  const activeSortConfig = externalSortConfig !== undefined ? externalSortConfig : internalSort.sortConfig;
  const handleSort = onSort || internalSort.requestSort;
  const sortedData = onSort ? data : internalSort.items;

  const getSortIconComponent = (colKey: string) => {
    if (!activeSortConfig || activeSortConfig.key !== colKey) {
      return <ChevronsUpDown size={14} className="text-gray-300 shrink-0" />;
    }
    return activeSortConfig.direction === "asc"
      ? <ChevronUp size={14} className="text-primary-600 shrink-0 font-bold" />
      : <ChevronDown size={14} className="text-primary-600 shrink-0 font-bold" />;
  };

  const getRowKey = (item: T, index: number): string | number => {
    if (rowKey) return rowKey(item);
    return (item as any).id ?? (item as any).key ?? index;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full">
        {loadingComponent ?? <LoadingSpinner className="py-20" />}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full">
        {emptyComponent ?? <EmptyState description={emptyMessage} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedData.map((item, index) => {
          const headerCol = columns.find((col) => col.isTitle) || columns[0];
          const actionsCol = columns.find((col) => col.isAction || col.accessorKey === "actions" || col.key === "actions");
          const otherCols = columns.filter((col) => col !== headerCol && col !== actionsCol);

          return (
            <div
              key={getRowKey(item, index)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "bg-white p-4 border border-gray-200 shadow-sm space-y-3",
                onRowClick && "cursor-pointer hover:bg-primary-50/10 transition-colors",
                typeof rowClassName === "function" ? rowClassName(item) : rowClassName
              )}
            >
              {/* Card Header */}
              {headerCol && (
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="font-semibold text-primary-600 text-base">
                    {headerCol.render(item, index)}
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="space-y-2 text-sm text-gray-500">
                {otherCols.map((col, cIdx) => (
                  <div key={col.accessorKey || col.key || cIdx} className="flex justify-between items-center gap-4">
                    <span className="font-semibold text-gray-700">{col.label}:</span>
                    <div className={cn(
                      "text-gray-600 font-sans text-right",
                      typeof cellClassName === "function" ? cellClassName(item, col) : cellClassName
                    )}>
                      {col.render(item, index)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer */}
              {actionsCol && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  {actionsCol.render(item, index)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className={cn("hidden md:block border border-gray-200 overflow-hidden bg-white shadow-xl rounded-none", className)}>
        <Table className={cn(density === "compact" && "[&_td]:p-2 [&_td]:text-xs [&_th]:h-8 [&_th]:px-3")}>
          <TableHeader>
            <TableRow>
              {columns.map((col, cIdx) => {
                const colKey = col.accessorKey || col.key || String(cIdx);
                const isSortable = col.sortable !== false && col.accessorKey !== "actions" && col.key !== "actions" && !col.isAction;
                return (
                  <TableHead
                    key={colKey}
                    onClick={() => isSortable && handleSort(colKey)}
                    className={cn(
                      isSortable && "cursor-pointer select-none hover:bg-gray-100 transition-colors",
                      stickyHeader && "sticky top-0 bg-gray-200 z-10",
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {isSortable && getSortIconComponent(colKey)}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, rIdx) => (
              <TableRow
                key={getRowKey(item, rIdx)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-primary-50/20!",
                  typeof rowClassName === "function" ? rowClassName(item) : rowClassName
                )}
              >
                {columns.map((col, cIdx) => (
                  <TableCell
                    key={col.accessorKey || col.key || cIdx}
                    className={cn(
                      col.className,
                      typeof cellClassName === "function" ? cellClassName(item, col) : cellClassName
                    )}
                  >
                    {col.render(item, rIdx)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const DataTable = memo(DataTableInner) as <T>(props: DataTableProps<T>) => React.ReactNode;

export default DataTable;
