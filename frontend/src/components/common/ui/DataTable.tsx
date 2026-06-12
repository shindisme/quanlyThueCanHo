import { cn } from "../../../lib/utils";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

// Bang du lieu co the sap xep
// T la kieu du lieu cua moi dong (vi du: Building, Apartment...)
// columns dinh nghia cac cot (tieu de, cach hien thi du lieu)
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
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider",
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
                "border-b border-gray-100 last:border-0",
                onRowClick && "cursor-pointer hover:bg-gray-50 transition-colors"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 text-sm text-gray-700", col.className)}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
