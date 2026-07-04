import { useMemo } from "react";
import { cn } from "../../lib/utils";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";
import { useSort } from "../../hooks/common/useSort";
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
  key: string;
  label: string;
  sortable?: boolean;
  sortValue?: (item: T) => any;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
  density?: "normal" | "compact";
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage,
  onRowClick,
  className,
  density = "normal",
}: DataTableProps<T>) {
  const customExtractors = useMemo(() => {
    const extractors: Record<string, (item: T) => any> = {};
    columns.forEach((col) => {
      if (col.sortValue) {
        extractors[col.key] = col.sortValue;
      }
    });
    return extractors;
  }, [columns]);

  const { items: sortedData, requestSort, sortConfig } = useSort(
    data,
    null,
    customExtractors
  );

  const getSortIconComponent = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown size={14} className="text-gray-300 shrink-0" />;
    }
    return sortConfig.direction === "asc"
      ? <ChevronUp size={14} className="text-primary-600 shrink-0 font-bold" />
      : <ChevronDown size={14} className="text-primary-600 shrink-0 font-bold" />;
  };

  if (isLoading) {
    return <LoadingSpinner className="py-20" />;
  }

  if (data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedData.map((item) => {
          const headerCol = columns[0];
          const actionsCol = columns.find((col) => col.key === "actions");
          const otherCols = columns.filter((col) => col !== headerCol && col !== actionsCol);

          return (
            <div
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                "bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3",
                onRowClick && "cursor-pointer hover:bg-primary-50/10 transition-colors"
              )}
            >
              {/* Card Header */}
              {headerCol && (
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="font-semibold text-primary-600 text-base">
                    {headerCol.render(item)}
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="space-y-2 text-sm text-gray-500">
                {otherCols.map((col) => (
                  <div key={col.key} className="flex justify-between items-center gap-4">
                    <span className="font-semibold text-gray-700">{col.label}:</span>
                    <div className="text-gray-600 font-sans text-right">
                      {col.render(item)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer (Actions) */}
              {actionsCol && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  {actionsCol.render(item)}
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
              {columns.map((col) => {
                const isSortable = col.sortable !== false && col.key !== "actions";
                return (
                  <TableHead
                    key={col.key}
                    onClick={() => isSortable && requestSort(col.key)}
                    className={cn(
                      isSortable && "cursor-pointer select-none hover:bg-gray-100 transition-colors",
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {isSortable && getSortIconComponent(col.key)}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-primary-50/20!"
                )}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn(col.className)}>
                    {col.render(item)}
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


