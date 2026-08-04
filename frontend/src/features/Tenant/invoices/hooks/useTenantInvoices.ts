import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as invoiceService from "../../../../services/invoiceService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import type { Invoice } from "../../../../types";

export function useTenantInvoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Modal control
  const detailsModal = useOnOff();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load tenant invoices 
  const { data: invoicesRes, isLoading } = useQuery({
    queryKey: ["tenant-invoices", statusFilter, debouncedSearch],
    queryFn: () =>
      invoiceService.getAllPage({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      }),
  });
  const invoices = invoicesRes?.data || [];

  // Sorting
  const { items: sortedInvoices, requestSort, getSortIcon, sortConfig } = useSort<Invoice>(invoices, {
    key: "created_at",
    direction: "desc",
  });

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedInvoices.length,
    initialPageSize: 10,
  });

  const paginatedInvoices = useMemo(() => {
    return sortedInvoices.slice(startIdx, endIdx);
  }, [sortedInvoices, startIdx, endIdx]);

  const handleOpenDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    detailsModal.onOpen();
  };

  return {
    invoices: paginatedInvoices,
    rawInvoicesCount: invoices.length,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,

    // Sort
    requestSort,
    getSortIcon,
    sortConfig,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,

    // Details Modal
    selectedInvoice,
    detailsModal,
    handleOpenDetails,
  };
}
