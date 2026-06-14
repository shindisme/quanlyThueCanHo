import { cn } from "../../lib/utils";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

// ============================================================
// DATA TABLE - ArchitectUI Style
// ============================================================
// Bảng dữ liệu với: header bg-gray-50, text uppercase,
// hover rows, border nhẹ, empty state

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
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
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSpinner className="py-20" />;
  }

  if (data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className={cn("premium-table-container", className)}>
      <div className="overflow-x-auto">
        <table className="premium-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    col.className
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  onRowClick && "cursor-pointer hover:bg-primary-50/20!"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn(col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
