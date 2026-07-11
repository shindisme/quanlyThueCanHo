import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as invoiceService from "../../../../services/invoiceService";
import * as buildingService from "../../../../services/buildingService";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useOnOff } from "../../../../hooks/useOnOff";
import { usePagination } from "../../../../hooks/usePagination";
import { useUserRole } from "../../../../hooks/useUserRole";
import { useSort } from "../../../../hooks/useSort";
import type { Invoice } from "../../../../types";

export function useInvoiceList() {
  const queryClient = useQueryClient();
  const { role, managedBuildingId } = useUserRole();

  // State lọc
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<number | undefined>(
    role === "MANAGER" ? (managedBuildingId || undefined) : undefined
  );

  // lọc tháng, năm 
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 300);

  const detailsModal = useOnOff();
  const generateModal = useOnOff();

  // Chọn hóa đơn
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Lấy danh sách chi nhánh để lọc & chọn
  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => buildingService.getAllBuildingPages(),
  });

  // Load invoices
  const { data: invoicesRes, isLoading, refetch } = useQuery({
    queryKey: ["invoices", statusFilter, buildingFilter, monthFilter, yearFilter, debouncedSearch],
    queryFn: () =>
      invoiceService.getAllInvoices({
        status: statusFilter || undefined,
        building_id: buildingFilter,
        month: monthFilter,
        year: yearFilter,
        search: debouncedSearch || undefined,
        limit: 100,
      }),
  });
  const invoices = invoicesRes?.data || [];

  // Sắp xếp
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

  // Tạo hóa đơn
  const handleGenerateInvoice = useMutation({
    mutationFn: (payload: invoiceService.GenerateMonthlyInvoicesPayload) =>
      invoiceService.generateMonthlyInvoices(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(res.message || "Tạo hóa đơn thành công!");
      generateModal.onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Tạo hóa đơn thất bại");
    },
  });

  const handleUpdateStatusInvoice = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      invoiceService.updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Cập nhật trạng thái hóa đơn thành công!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    },
  });

  const handleOpenDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    detailsModal.onOpen();
  };

  const handleToggleStatus = (invoice: Invoice) => {
    const nextStatus = invoice.status === "PAID" ? "UNPAID" : "PAID";
    handleUpdateStatusInvoice.mutate({ id: invoice.id, status: nextStatus });
  };

  return {
    role,
    managedBuildingId,
    invoices: paginatedInvoices,
    rawInvoicesCount: invoices.length,
    buildings,
    isLoading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    buildingFilter,
    setBuildingFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,

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

    // Generate Modal
    generateModal,
    generateInvoices: handleGenerateInvoice.mutate,
    isGenerating: handleGenerateInvoice.isPending,

    // Status Toggle
    handleToggleStatus,
    isUpdatingStatus: handleUpdateStatusInvoice.isPending,

    refetch,
  };
}
