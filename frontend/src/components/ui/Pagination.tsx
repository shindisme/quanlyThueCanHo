import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Phan trang - hien thi so trang va nut Previous/Next
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Tao danh sach so trang de hien thi
  // Hien thi toi da 5 trang xung quanh trang hien tai
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;
    const curr = Number(currentPage);
    const total = Number(totalPages);

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, curr - 1);
      const end = Math.min(total - 1, curr + 1);

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total - 1) pages.push("...");
      pages.push(total);
    }

    return pages;
  }

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <button
        type="button"
        onClick={() => onPageChange(Number(currentPage) - 1)}
        disabled={Number(currentPage) === 1}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronLeft size={18} />
      </button>

      {getPageNumbers().map((page, index) =>
        page === "..." ? (
          <span key={`dots-${index}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(Number(page))}
            className={cn(
              "w-9 h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              Number(page) === Number(currentPage)
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Number(currentPage) + 1)}
        disabled={Number(currentPage) === Number(totalPages)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
