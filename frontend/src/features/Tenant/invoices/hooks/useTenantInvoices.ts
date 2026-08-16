import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as invoiceService from "../../../../services/invoiceService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useSort } from "../../../../hooks/useSort";
import type { Invoice } from "../../../../types";
import { getInvoiceRoomDisplay, getInvoiceStatus, getInvoiceTenant, getInvoiceType, hideInvoicesCoveredByFinalSettlement } from "../../../../utils/invoiceDisplay";
import { getInvoicePeriodSortValue } from "../../../../utils/invoicePeriod";
import { queryKeys } from "../../../../constants/queryKeys";

const INVOICE_SORT_EXTRACTORS = {
  room: (invoice: Invoice) => getInvoiceRoomDisplay(invoice).room,
  tenant: (invoice: Invoice) => getInvoiceTenant(invoice)?.full_name ?? "",
  period: getInvoicePeriodSortValue,
};

export function useTenantInvoices() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Modal control
  const detailsModal = useOnOff();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load tenant invoices
  const { data: invoicesRes, isLoading } = useQuery({
    queryKey: queryKeys.invoices.tenantList(),
    queryFn: () => invoiceService.getAllPage(),
  });

  const invoices = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    return hideInvoicesCoveredByFinalSettlement(invoicesRes?.data || []).filter((invoice) => {
      if (statusFilter && getInvoiceStatus(invoice) !== statusFilter) return false;
      if (typeFilter && getInvoiceType(invoice) !== typeFilter) return false;
      if (!keyword) return true;

      const room = getInvoiceRoomDisplay(invoice);
      return [invoice.invoice_code, room.room, room.branch]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [debouncedSearch, invoicesRes?.data, statusFilter, typeFilter]);

  // Sorting
  const { items: sortedInvoices, requestSort, getSortIcon, sortConfig } = useSort<Invoice>(invoices, {
    key: "created_at",
    direction: "desc",
  }, INVOICE_SORT_EXTRACTORS);

  // Pagination
  const { currentPage, setCurrentPage, totalPages, startIdx, endIdx } = usePagination({
    totalItems: sortedInvoices.length,
    initialPageSize: 10,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, setCurrentPage]);

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
    typeFilter,
    setTypeFilter,

    // Sort
    requestSort,
    getSortIcon,
    sortConfig,

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    startIdx,

    // Details Modal
    selectedInvoice,
    detailsModal,
    handleOpenDetails,
  };
}
