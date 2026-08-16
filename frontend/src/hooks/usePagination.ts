import { useState, useMemo, useEffect } from "react";

interface UsePaginationProps {
  totalItems: number;
  initialPageSize?: number;
  initialPage?: number;
}

export function usePagination({
  totalItems,
  initialPageSize = 15,
  initialPage = 1,
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage));
  const [pageSize, setPageSizeState] = useState(Math.max(1, initialPageSize));

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
  }, [totalItems, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;

  const setPageSize = (nextPageSize: number) => {
    setPageSizeState(Math.max(1, nextPageSize));
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    startIdx,
    endIdx,
  };
}
